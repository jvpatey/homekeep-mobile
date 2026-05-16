// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getLocalParts } from "./timezone.ts";
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

  if (local.hour === 8) types.add("daily");
  if (local.hour === 18) types.add("due_soon");
  if (local.hour === 9) {
    types.add("overdue");
    if (local.weekday === 1) types.add("weekly");
  }

  return types;
}

function parseForceType(forceType: string): Set<NotificationType> | null {
  const map: Record<string, NotificationType> = {
    daily: "daily",
    due_soon: "due_soon",
    overdue: "overdue",
    weekly: "weekly",
  };
  const t = map[forceType];
  if (!t) return null;
  return new Set([t]);
}

function parseLegacyType(legacyType: string): Set<NotificationType> {
  if (legacyType === "all") {
    return new Set(["daily", "due_soon", "overdue", "weekly"]);
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
  let usersProcessed = 0;

  for (const profile of users) {
    if (!profile.push_token) continue;

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
      results
    );
    usersProcessed++;
  }

  return {
    results,
    usersProcessed,
    userId: options.userId ?? null,
  };
}

export function createServiceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function resolveUserIdFromAuth(
  req: Request,
  explicitUserId: string | null
): Promise<string | null> {
  if (explicitUserId) return explicitUserId;

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

/** Optional guard when CRON_SECRET is configured. */
export function assertAuthorized(req: Request): Response | null {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) return null;

  const header = req.headers.get("x-cron-secret");
  if (header === cronSecret) return null;

  const auth = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (auth && serviceKey && auth.includes(serviceKey)) return null;

  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
