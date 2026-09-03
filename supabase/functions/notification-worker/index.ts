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
    const forceType = url.searchParams.get("force_type");
    const now = new Date();
    console.log(
      `notification-worker at ${now.toISOString()}, force_type=${forceType ?? "none"}, user_id=${authorized.userId ?? "ALL"}`
    );

    const { results, usersProcessed, userId } = await runNotificationJob(
      supabase,
      now,
      {
        userId: authorized.userId,
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
