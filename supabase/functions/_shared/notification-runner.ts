// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getLocalParts } from "./timezone.ts";
import { jsonResponse } from "./cors.ts";
import {
  emptyResults,
  getUserTimezoneMap,
  runProcessorsForUser,
  type NotificationResults,
  type NotificationType,
} from "./processors.ts";

export interface RunOptions {
  userId?: string | null;
  forceType?: string | null;
  legacyType?: string | null;
  bypassHourCheck?: boolean;
}

function activeTypesForLocalHour(
  local: ReturnType<typeof getLocalParts>
): Set<NotificationType> {
  const types = new Set<NotificationType>();
  if (local.hour === 8) types.add("morning");
  if (local.hour === 18) types.add("upcoming");
  return types;
}

function parseForceType(forceType: string): Set<NotificationType> | null {
  const map: Record<string, NotificationType> = {
    upcoming: "upcoming",
    morning: "morning",
    weekly: "weekly",
    due_soon: "upcoming",
    daily: "morning",
    overdue: "morning",
  };
  const t = map[forceType];
  if (!t) return null;
  return new Set([t]);
}

function parseLegacyType(legacyType: string): Set<NotificationType> {
  if (legacyType === "all") {
    return new Set(["upcoming", "morning", "weekly"]);
  }
  const forced = parseForceType(legacyType);
  return forced ?? new Set();
}

export async function runNotificationJob(
  supabase: any,
  now: Date,
  options: RunOptions
): Promise<{
  results: NotificationResults;
  usersProcessed: number;
  userId: string | null;
}> {
  const results = emptyResults();
  const tzByUser = await getUserTimezoneMap(supabase, options.userId ?? null);

  let q = supabase
    .from("profiles")
    .select("id, push_token")
    .not("push_token", "is", null);

  if (options.userId) {
    q = q.eq("id", options.userId);
  }

  const { data: profiles, error } = await q;
  if (error) throw error;

  const users = profiles || [];
  const entitledIds = await loadEntitledUserIds(supabase);
  let usersProcessed = 0;
  const scheduled = !options.forceType && !options.bypassHourCheck;

  for (const profile of users) {
    if (!profile.push_token) continue;
    if (entitledIds && !entitledIds.has(profile.id)) continue;

    const tz = tzByUser[profile.id] || "UTC";
    const local = getLocalParts(now, tz);

    let activeTypes: Set<NotificationType>;

    if (options.forceType) {
      const forced = parseForceType(options.forceType);
      if (!forced) continue;
      activeTypes = forced;
    } else if (options.bypassHourCheck && options.legacyType) {
      activeTypes = parseLegacyType(options.legacyType);
    } else if (options.legacyType && options.legacyType !== "all") {
      activeTypes = parseLegacyType(options.legacyType);
    } else {
      activeTypes = activeTypesForLocalHour(local);
    }

    if (activeTypes.size === 0) continue;

    await runProcessorsForUser(
      supabase,
      now,
      profile.id,
      tz,
      activeTypes,
      results,
      { scheduled }
    );
    usersProcessed++;
  }

  return {
    results,
    usersProcessed,
    userId: options.userId ?? null,
  };
}

const ACTIVE_PLUS = new Set(["trialing", "active", "grace", "promo"]);

/** null = entitlements unavailable; skip the Plus filter (fail open). */
async function loadEntitledUserIds(
  supabase: any
): Promise<Set<string> | null> {
  const { data: rows, error } = await supabase
    .from("entitlements")
    .select("user_id, household_id, status, expires_at");
  if (error) {
    console.warn("entitlements lookup failed; sending without Plus filter", error);
    return null;
  }

  const entitled = new Set<string>();
  const households = new Set<string>();
  const now = Date.now();
  for (const row of rows ?? []) {
    const active = ACTIVE_PLUS.has(row.status);
    const unexpired =
      !row.expires_at || new Date(row.expires_at).getTime() > now;
    if (!active || !unexpired) continue;
    entitled.add(row.user_id);
    if (row.household_id) households.add(row.household_id);
  }

  if (households.size > 0) {
    const { data: members, error: memberError } = await supabase
      .from("household_members")
      .select("user_id")
      .in("household_id", [...households]);
    if (memberError) {
      console.warn("household member lookup failed", memberError);
    } else {
      for (const member of members ?? []) {
        entitled.add(member.user_id);
      }
    }
  }

  return entitled;
}

export function createServiceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function resolveJwtUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  return user?.id ?? null;
}

export function isPrivilegedRequest(req: Request): boolean {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const header = req.headers.get("x-cron-secret");
  if (cronSecret && header === cronSecret) return true;

  const auth = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (auth && serviceKey && auth.includes(serviceKey)) return true;

  return false;
}

export async function authorizeWorkerRequest(
  req: Request,
  explicitUserId: string | null
): Promise<{ userId: string | null; error: Response | null }> {
  if (isPrivilegedRequest(req)) {
    return { userId: explicitUserId, error: null };
  }

  const jwtUserId = await resolveJwtUserId(req);
  if (!jwtUserId) {
    return {
      userId: null,
      error: jsonResponse({ error: "Unauthorized" }, 401),
    };
  }

  if (explicitUserId && explicitUserId !== jwtUserId) {
    return {
      userId: null,
      error: jsonResponse({ error: "Forbidden" }, 403),
    };
  }

  return { userId: jwtUserId, error: null };
}

/** @deprecated Use authorizeWorkerRequest. Kept for call-site compatibility. */
export function assertAuthorized(req: Request): Response | null {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) return null;

  if (isPrivilegedRequest(req)) return null;

  return jsonResponse({ error: "Unauthorized" }, 401);
}

export async function resolveUserIdFromAuth(
  req: Request,
  explicitUserId: string | null
): Promise<string | null> {
  if (explicitUserId) return explicitUserId;
  return resolveJwtUserId(req);
}
