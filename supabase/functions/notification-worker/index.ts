import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleOptions, jsonResponse } from "@shared/cors.ts";
import {
  createServiceClient,
  resolveUserIdFromAuth,
  runNotificationJob,
} from "@shared/notification-runner.ts";

serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    const supabase = createServiceClient();
    const url = new URL(req.url);
    const forceType = url.searchParams.get("force_type");
    const userIdParam = await resolveUserIdFromAuth(
      req,
      url.searchParams.get("user_id")
    );

    const now = new Date();
    console.log(
      `notification-worker at ${now.toISOString()}, force_type=${forceType ?? "none"}, user_id=${userIdParam ?? "ALL"}`
    );

    const { results, usersProcessed, userId } = await runNotificationJob(
      supabase,
      now,
      {
        userId: userIdParam,
        forceType,
        bypassHourCheck: !!forceType,
      }
    );

    return jsonResponse({
      success: true,
      message: "Hourly notification worker completed",
      user_id: userId,
      users_processed: usersProcessed,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("notification-worker error:", error);
    return jsonResponse({ error: "Internal server error", details: message }, 500);
  }
});
