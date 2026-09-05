import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type EntitlementStatus =
  | "trialing"
  | "active"
  | "grace"
  | "expired"
  | "promo";

type RcEvent = {
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  product_id?: string;
  entitlement_ids?: string[];
  period_type?: string;
  store?: string;
  expiration_at_ms?: number;
  grace_period_expiration_at_ms?: number;
  transferred_from?: string[];
  transferred_to?: string[];
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function authorized(req: Request): boolean {
  const secret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET") ?? "";
  if (!secret) return false;
  const header = req.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  return token.length > 0 && token === secret;
}

function mapStore(store?: string): string | null {
  switch ((store ?? "").toUpperCase()) {
    case "APP_STORE":
    case "MAC_APP_STORE":
      return "app_store";
    case "PLAY_STORE":
      return "play_store";
    case "PROMOTIONAL":
      return "promotional";
    default:
      return null;
  }
}

function expirationIso(ms?: number): string | null {
  if (!ms || ms <= 0) return null;
  return new Date(ms).toISOString();
}

function statusForEvent(event: RcEvent): EntitlementStatus {
  const type = event.type ?? "";
  if (type === "EXPIRATION") return "expired";
  if (type === "BILLING_ISSUE") return "grace";
  if ((event.period_type ?? "").toUpperCase() === "TRIAL") return "trialing";
  return "active";
}

function looksLikePlus(event: RcEvent): boolean {
  const ids = event.entitlement_ids ?? [];
  if (ids.includes("homekeep_plus")) return true;
  const product = event.product_id ?? "";
  return (
    product === "homekeep_plus_monthly" || product === "homekeep_plus_yearly"
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!authorized(req)) {
    return json({ error: "Unauthorized" }, 401);
  }

  let payload: { event?: RcEvent };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const event = payload.event;
  if (!event?.type) {
    return json({ error: "Missing event" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const upsertForUser = async (
    appUserId: string,
    status: EntitlementStatus,
    extras: { product_id?: string | null; store?: string | null; expires_at?: string | null }
  ) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, household_id")
      .eq("id", appUserId)
      .maybeSingle();

    const { error } = await supabase.from("entitlements").upsert(
      {
        user_id: appUserId,
        household_id: profile?.household_id ?? null,
        status,
        store: extras.store ?? null,
        product_id: extras.product_id ?? null,
        expires_at: extras.expires_at ?? null,
        revenuecat_app_user_id: appUserId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) throw error;
  };

  try {
    if (event.type === "TRANSFER") {
      for (const fromId of event.transferred_from ?? []) {
        await upsertForUser(fromId, "expired", {
          product_id: event.product_id ?? null,
          store: mapStore(event.store),
          expires_at: expirationIso(event.expiration_at_ms) ?? new Date().toISOString(),
        });
      }
      for (const toId of event.transferred_to ?? []) {
        await upsertForUser(toId, statusForEvent(event), {
          product_id: event.product_id ?? null,
          store: mapStore(event.store),
          expires_at: expirationIso(event.expiration_at_ms),
        });
      }
      return json({ ok: true });
    }

    if (!looksLikePlus(event) && event.type !== "TEST") {
      return json({ ok: true, ignored: true });
    }

    const appUserId = event.app_user_id ?? event.original_app_user_id;
    if (!appUserId || appUserId.startsWith("$RCAnonymousID:")) {
      return json({ ok: true, ignored: true });
    }

    if (event.type === "TEST") {
      return json({ ok: true, test: true });
    }

    const expires =
      event.type === "BILLING_ISSUE"
        ? expirationIso(event.grace_period_expiration_at_ms) ??
          expirationIso(event.expiration_at_ms)
        : expirationIso(event.expiration_at_ms);

    await upsertForUser(appUserId, statusForEvent(event), {
      product_id: event.product_id ?? null,
      store: mapStore(event.store),
      expires_at: expires,
    });

    return json({ ok: true });
  } catch (error) {
    console.error("revenuecat-webhook failed", error);
    return json({ error: "Internal error" }, 500);
  }
});
