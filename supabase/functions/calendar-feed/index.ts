/**
 * calendar-feed: read-only ICS subscription of upcoming maintenance.
 *
 * GET ?token=<64 hex> (no JWT; the token is the credential, issued by the
 * get_or_create_calendar_feed RPC and revoked by rotate_calendar_feed).
 * Emits each routine's open occurrence (overdue ones up to 30 days back)
 * plus projected repeats for the next 6 months as all-day events.
 */
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "@shared/cors.ts";
import { createServiceClient } from "@shared/notification-runner.ts";
import {
  getViewerHouseholdId,
  getViewerLatitude,
} from "@shared/processors.ts";
import { isTaskInSeason } from "@shared/seasonalTasks.ts";
import { formatLocalDate } from "@shared/timezone.ts";
import { buildIcsCalendar, type IcsAllDayEvent } from "@shared/ics.ts";
import { findTaskHowTo } from "@shared/taskHowToContent.ts";

const TOKEN_PATTERN = /^[0-9a-f]{64}$/;
const OVERDUE_LOOKBACK_DAYS = 30;
const HORIZON_DAYS = 183;
const MAX_EVENTS = 400;
const HOW_TO_STEPS_IN_DESCRIPTION = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

interface OpenInstanceRow {
  id: string;
  due_date: string;
  routine: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    interval_days: number | null;
    source_plan_id: string | null;
  } | null;
}

function textResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
  });
}

serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;
  if (req.method !== "GET" && req.method !== "HEAD") {
    return textResponse("Use GET", 405);
  }
  try {
    return await handle(req);
  } catch (error) {
    console.error("calendar-feed unhandled error", error);
    return textResponse("Calendar unavailable", 500);
  }
});

async function handle(req: Request): Promise<Response> {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!TOKEN_PATTERN.test(token)) return textResponse("Not found", 404);

  const supabase = createServiceClient();
  const { data: feed, error: feedError } = await supabase
    .from("calendar_feeds")
    .select("user_id")
    .eq("token", token)
    .is("revoked_at", null)
    .maybeSingle();
  if (feedError) throw feedError;
  if (!feed?.user_id) return textResponse("Not found", 404);
  const userId: string = feed.user_id;

  const householdId = await getViewerHouseholdId(supabase, userId);
  const [latitude, timeZone, instances] = await Promise.all([
    getViewerLatitude(supabase, userId, householdId),
    loadTimeZone(supabase, userId),
    loadOpenInstances(supabase, userId, householdId),
  ]);

  const events = buildEvents(instances, timeZone, latitude, new Date());
  const body = buildIcsCalendar({
    name: "HomeKeep",
    events,
    refreshMinutes: 60,
  });

  return new Response(req.method === "HEAD" ? null : body, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="homekeep.ics"',
      "Cache-Control": "max-age=3600",
    },
  });
}

async function loadTimeZone(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase
    .from("user_settings")
    .select("timezone")
    .eq("user_id", userId)
    .maybeSingle();
  const tz = typeof data?.timezone === "string" ? data.timezone : "UTC";
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

async function loadOpenInstances(
  supabase: any,
  userId: string,
  householdId: string | null
): Promise<OpenInstanceRow[]> {
  const since = new Date(Date.now() - OVERDUE_LOOKBACK_DAYS * DAY_MS);
  let query = supabase
    .from("routine_instances")
    .select(
      `
        id,
        due_date,
        routine:maintenance_routines!inner(
          id,
          user_id,
          household_id,
          title,
          description,
          category,
          interval_days,
          source_plan_id,
          is_active
        )
      `
    )
    .eq("is_completed", false)
    .eq("routine.is_active", true)
    .gte("due_date", since.toISOString())
    .order("due_date", { ascending: true })
    .limit(1000);

  query = householdId
    ? query.eq("routine.household_id", householdId)
    : query.eq("routine.user_id", userId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as OpenInstanceRow[];
}

function describe(routine: NonNullable<OpenInstanceRow["routine"]>): string {
  const parts: string[] = [];
  if (routine.description?.trim()) parts.push(routine.description.trim());
  const howTo = findTaskHowTo(routine.title);
  if (howTo) {
    const steps = howTo.steps
      .slice(0, HOW_TO_STEPS_IN_DESCRIPTION)
      .map((step, i) => `${i + 1}. ${step}`);
    if (howTo.steps.length > HOW_TO_STEPS_IN_DESCRIPTION) {
      steps.push("Full steps in the HomeKeep app.");
    }
    parts.push(steps.join("\n"));
  }
  parts.push("Mark it done in HomeKeep.");
  return parts.join("\n\n");
}

function buildEvents(
  instances: OpenInstanceRow[],
  timeZone: string,
  latitude: number | null,
  now: Date
): IcsAllDayEvent[] {
  const todayLocal = formatLocalDate(now, timeZone);
  const horizon = now.getTime() + HORIZON_DAYS * DAY_MS;
  const seen = new Set<string>();
  const events: IcsAllDayEvent[] = [];

  const push = (
    routine: NonNullable<OpenInstanceRow["routine"]>,
    at: Date,
    description: string
  ) => {
    const date = formatLocalDate(at, timeZone);
    const uid = `${routine.id}-${date.replace(/-/g, "")}@homekeep`;
    if (seen.has(uid)) return;
    const inSeason = isTaskInSeason({
      category: routine.category,
      interval_days: routine.interval_days ?? 0,
      source_plan_id: routine.source_plan_id,
      month: Number(date.slice(5, 7)) - 1,
      latitude,
    });
    if (!inSeason) return;
    seen.add(uid);
    events.push({ uid, date, summary: routine.title, description });
  };

  for (const instance of instances) {
    const routine = instance.routine;
    if (!routine) continue;
    const description = describe(routine);
    const due = new Date(instance.due_date);
    if (Number.isNaN(due.getTime())) continue;
    push(routine, due, description);

    const interval = routine.interval_days ?? 0;
    if (interval <= 0) continue;
    for (
      let next = due.getTime() + interval * DAY_MS;
      next <= horizon;
      next += interval * DAY_MS
    ) {
      const at = new Date(next);
      if (formatLocalDate(at, timeZone) < todayLocal) continue;
      push(routine, at, description);
    }
  }

  return events
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, MAX_EVENTS);
}
