import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleOptions, jsonResponse } from "@shared/cors.ts";
import {
  createServiceClient,
  resolveJwtUserId,
} from "@shared/notification-runner.ts";
import {
  dedupeKeyHouseholdJoin,
  dedupeKeyHouseholdLeave,
} from "@shared/dedupe.ts";
import { sendDeduped } from "@shared/expo-push.ts";
import { isMasterEnabled } from "@shared/preferences.ts";

function firstName(fullName?: string | null): string {
  const name = typeof fullName === "string" ? fullName.trim() : "";
  if (!name) return "Someone";
  return name.split(/\s+/)[0] || "Someone";
}

serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    const actorId = await resolveJwtUserId(req);
    if (!actorId) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const event = body?.event === "leave" ? "leave" : body?.event === "join"
      ? "join"
      : null;
    const householdId =
      typeof body?.householdId === "string" ? body.householdId : null;

    if (!event || !householdId) {
      return jsonResponse({ error: "Missing event or householdId" }, 400);
    }

    const supabase = createServiceClient();

    if (event === "join") {
      const { data: membership, error: memberError } = await supabase
        .from("household_members")
        .select("user_id")
        .eq("household_id", householdId)
        .eq("user_id", actorId)
        .maybeSingle();
      if (memberError) throw memberError;
      if (!membership) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }
    }

    const { data: members, error: listError } = await supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", householdId);
    if (listError) throw listError;

    const recipientIds = (members || [])
      .map((row: { user_id: string }) => row.user_id)
      .filter((id: string) => id !== actorId);

    if (recipientIds.length === 0) {
      return jsonResponse({ success: true, sent: 0 });
    }

    const { data: actorProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", actorId)
      .maybeSingle();

    const name = firstName(actorProfile?.full_name);
    const copy =
      event === "join"
        ? `${name} joined your home.`
        : `${name} left your home.`;
    const dedupeKey =
      event === "join"
        ? dedupeKeyHouseholdJoin(householdId, actorId)
        : dedupeKeyHouseholdLeave(householdId, actorId);
    const notificationType =
      event === "join" ? "household_join" : "household_leave";

    let sent = 0;
    for (const recipientId of recipientIds) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("push_token")
        .eq("id", recipientId)
        .maybeSingle();
      if (!profile?.push_token) continue;

      const enabled = await isMasterEnabled(supabase, recipientId);
      if (!enabled) continue;

      const ok = await sendDeduped(
        supabase,
        recipientId,
        dedupeKey,
        notificationType,
        {
          title: "HomeKeep",
          body: copy,
          data: { action: "household", household_id: householdId },
        }
      );
      if (ok) sent++;
    }

    return jsonResponse({ success: true, sent });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("notify-household-event error:", error);
    return jsonResponse({ error: "Internal server error", details: message }, 500);
  }
});
