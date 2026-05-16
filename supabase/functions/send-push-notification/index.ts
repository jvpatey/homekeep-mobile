/**
 * Self-contained so Dashboard deploy works (no ../_shared imports).
 * notification-worker / process-scheduled-notifications use _shared via CLI deploy.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, title, body, data } = await req.json();

    if (!userId || !title || !body) {
      return jsonResponse({ error: "Missing required fields" }, 400);
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("push_token")
      .eq("id", userId)
      .single();

    if (profileError || !userProfile?.push_token) {
      return jsonResponse({ error: "User not found or no push token" }, 404);
    }

    const expoPushToken: string = userProfile.push_token;

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: expoPushToken,
        sound: "default",
        title,
        body,
        data: data || {},
      }),
    });

    const expoResult = await response.json();
    if (!response.ok) {
      console.error("Expo push service error:", expoResult);
      throw new Error(`Expo push service error: ${response.statusText}`);
    }

    const ticket = Array.isArray(expoResult?.data) ? expoResult.data[0] : null;
    if (
      ticket?.status === "error" &&
      ticket?.details?.error === "DeviceNotRegistered"
    ) {
      await supabase
        .from("profiles")
        .update({ push_token: null, updated_at: new Date().toISOString() })
        .eq("id", userId);
    }

    const { error: logError } = await supabase.from("push_notifications").insert({
      user_id: userId,
      title,
      body,
      data: data || {},
      sent_at: new Date().toISOString(),
    });
    if (logError) console.error("Error logging notification:", logError);

    return jsonResponse({
      success: true,
      message: "Notification sent successfully",
      expoResult,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending push notification:", error);
    return jsonResponse({ error: "Internal server error", details: message }, 500);
  }
});
