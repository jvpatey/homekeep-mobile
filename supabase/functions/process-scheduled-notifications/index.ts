/**
 * @deprecated Use notification-worker (hourly, per-user local time).
 * Kept for backward-compatible manual curls with ?type=upcoming|morning|weekly|all
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleOptions, jsonResponse } from "@shared/cors.ts";
import {
  authorizeWorkerRequest,
  createServiceClient,
  runNotificationJob,
} from "@shared/notification-runner.ts";

serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    const url = new URL(req.url);
    const authorized = await authorizeWorkerRequest(
      req,
      url.searchParams.get("user_id")
    );
    if (authorized.error) return authorized.error;

    const supabase = createServiceClient();
    const type = url.searchParams.get("type") || "all";
    const now = new Date();
    console.log(
      `[deprecated] process-scheduled-notifications at ${now.toISOString()}, type=${type}, user_id=${authorized.userId ?? "ALL"}`
    );

    const { results, usersProcessed, userId } = await runNotificationJob(
      supabase,
      now,
      {
        userId: authorized.userId,
        legacyType: type,
        bypassHourCheck: true,
      }
    );

    return jsonResponse({
      success: true,
      message: `Processed notifications (type=${type}) — prefer notification-worker`,
      user_id: userId,
      users_processed: usersProcessed,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing scheduled notifications:", error);
    return jsonResponse({ error: "Internal server error", details: message }, 500);
  }
});
