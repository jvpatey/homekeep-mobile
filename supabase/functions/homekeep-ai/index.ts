/**
 * homekeep-ai: one entry point for every model-backed feature.
 *
 * POST { task: "scan_nameplate" | ..., ...payload } with the user's JWT.
 * Success: { result, remaining } where `remaining` is free calls left for
 * that feature (null for HomeKeep + members).
 * Failure: { error: { code, message, reason? } } with code one of
 * unauthorized | quota_exhausted | plus_required | rate_limited |
 * bad_input | model_error.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleOptions, jsonResponse } from "@shared/cors.ts";
import {
  createServiceClient,
  resolveJwtUserId,
} from "@shared/notification-runner.ts";
import { checkQuota, logUsage } from "@shared/ai/quota.ts";
import { GeminiError } from "@shared/ai/gemini.ts";
import { type AiTask, TaskInputError } from "@shared/ai/tasks/types.ts";
import { scanNameplate } from "@shared/ai/tasks/scanNameplate.ts";
import { assistantChat } from "@shared/ai/tasks/assistantChat.ts";
import { extractInspection } from "@shared/ai/tasks/extractInspection.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// deno-lint-ignore no-explicit-any
const TASKS: Record<string, AiTask<any>> = {
  scan_nameplate: scanNameplate,
  assistant_chat: assistantChat,
  extract_inspection: extractInspection,
};

function createUserClient(req: Request) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
      auth: { persistSession: false },
    }
  );
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  reason?: string
): Response {
  return jsonResponse({ error: { code, message, reason } }, status);
}

serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;
  try {
    return await handle(req);
  } catch (error) {
    console.error("homekeep-ai unhandled error", error);
    return errorResponse(500, "model_error", "Please try again");
  }
});

async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return errorResponse(405, "bad_input", "Use POST");
  }

  const userId = await resolveJwtUserId(req);
  if (!userId) return errorResponse(401, "unauthorized", "Sign in again");

  const body = await req.json().catch(() => null);
  const task = body && typeof body.task === "string" ? TASKS[body.task] : null;
  if (!task) return errorResponse(400, "bad_input", "Unknown task");

  let input: unknown;
  try {
    input = task.parse(body);
  } catch (error) {
    if (error instanceof TaskInputError) {
      return errorResponse(400, "bad_input", error.message, error.reason);
    }
    throw error;
  }

  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", userId)
    .maybeSingle();
  const householdId: string | null = profile?.household_id ?? null;

  let quota;
  try {
    quota = await checkQuota(supabase, userId, task.feature);
  } catch (error) {
    console.error("homekeep-ai quota check failed", error);
    return errorResponse(500, "model_error", "Please try again");
  }
  if (!quota.ok) {
    const messages = {
      plus_required: "This needs HomeKeep +",
      quota_exhausted: "You've used your free tries",
      rate_limited: "Daily limit reached. Try again tomorrow.",
    };
    return errorResponse(
      quota.code === "rate_limited" ? 429 : 402,
      quota.code,
      messages[quota.code]
    );
  }

  try {
    const output = await task.run(
      { supabase, userClient: createUserClient(req), userId, householdId },
      input
    );
    if (output.usage) {
      await logUsage(supabase, {
        userId,
        householdId,
        feature: task.feature,
        status: "ok",
        ...output.usage,
      });
    }
    const remaining = quota.isPlus
      ? null
      : output.usage
        ? quota.remainingAfter
        : (quota.remainingAfter ?? 0) + 1;
    return jsonResponse({ result: output.result, remaining });
  } catch (error) {
    const rejected = error instanceof TaskInputError;
    await logUsage(supabase, {
      userId,
      householdId,
      feature: task.feature,
      status: rejected ? "rejected" : "error",
    });
    if (rejected) {
      return errorResponse(422, "bad_input", error.message, error.reason);
    }
    console.error(`homekeep-ai ${task.feature} failed`, error);
    const status = error instanceof GeminiError && error.status === 429 ? 503 : 502;
    return errorResponse(status, "model_error", "Couldn't reach the assistant. Try again.");
  }
}
