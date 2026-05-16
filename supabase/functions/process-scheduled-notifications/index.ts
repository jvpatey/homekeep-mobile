/**
 * @deprecated Use notification-worker (hourly, per-user local time).
 * Kept for backward-compatible manual curls with ?type=daily|due_soon|overdue|weekly|all
 */
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
    const type = url.searchParams.get("type") || "all";
    const userIdParam = await resolveUserIdFromAuth(
      req,
      url.searchParams.get("user_id")
    );

    const now = new Date();
    console.log(
      `[deprecated] process-scheduled-notifications at ${now.toISOString()}, type=${type}, user_id=${userIdParam ?? "ALL"}`
    );

    const { results, usersProcessed, userId } = await runNotificationJob(
      supabase,
      now,
      {
        userId: userIdParam,
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
