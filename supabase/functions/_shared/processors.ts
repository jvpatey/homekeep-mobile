// deno-lint-ignore-file no-explicit-any
import { dedupeKeyMorning, dedupeKeyUpcoming } from "./dedupe.ts";
import { sendDeduped } from "./expo-push.ts";
import { isTypeEnabled } from "./preferences.ts";
import {
  addUtcDays,
  getLocalParts,
  isBetweenDaysInTz,
  OVERDUE_LOOKBACK_DAYS,
  tzStartOfDay,
  type LocalParts,
} from "./timezone.ts";

export interface NotificationResults {
  upcomingNotifications: number;
  morningNotifications: number;
  weeklySummaries: number;
  errors: number;
}

export function emptyResults(): NotificationResults {
  return {
    upcomingNotifications: 0,
    morningNotifications: 0,
    weeklySummaries: 0,
    errors: 0,
  };
}

interface VisibleRoutine {
  id: string;
  title: string;
  category: string;
  priority: string;
  estimated_duration_minutes: number;
}

interface VisibleTask {
  id: string;
  due_date: string;
  routine: VisibleRoutine | null;
}

async function getViewerHouseholdId(
  supabase: any,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.warn("Failed to load household_id", error);
    return null;
  }
  return typeof data?.household_id === "string" ? data.household_id : null;
}

async function loadVisibleIncompleteTasks(
  supabase: any,
  userId: string
): Promise<VisibleTask[]> {
  const householdId = await getViewerHouseholdId(supabase, userId);

  let query = supabase
    .from("routine_instances")
    .select(
      `
        id,
        due_date,
        is_completed,
        routine:maintenance_routines!inner(
          id,
          user_id,
          household_id,
          title,
          category,
          priority,
          estimated_duration_minutes,
          is_active
        )
      `
    )
    .eq("is_completed", false)
    .eq("routine.is_active", true);

  query = householdId
    ? query.eq("routine.household_id", householdId)
    : query.eq("routine.user_id", userId);

  const { data, error } = await query;
  if (error) throw error;

  return ((data || []) as VisibleTask[]).filter((task) => task.routine);
}

function sortByDueDate(tasks: VisibleTask[]): VisibleTask[] {
  return [...tasks].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );
}

function bucketTasks(tasks: VisibleTask[], now: Date, tz: string) {
  const todayStart = tzStartOfDay(now, tz);
  const tomorrowStart = addUtcDays(todayStart, 1);
  const nextDayStart = addUtcDays(todayStart, 2);
  const nextWeekStart = addUtcDays(todayStart, 7);
  const twoWeeksStart = addUtcDays(todayStart, 14);
  const lookbackStart = addUtcDays(todayStart, -OVERDUE_LOOKBACK_DAYS);

  const dueToday: VisibleTask[] = [];
  const dueTomorrow: VisibleTask[] = [];
  const thisWeek: VisibleTask[] = [];
  const nextWeek: VisibleTask[] = [];
  const overdue: VisibleTask[] = [];

  for (const task of tasks) {
    const dueStart = tzStartOfDay(new Date(task.due_date), tz);
    if (dueStart < todayStart && dueStart >= lookbackStart) {
      overdue.push(task);
    }
    if (isBetweenDaysInTz(task.due_date, todayStart, tomorrowStart, tz)) {
      dueToday.push(task);
    }
    if (isBetweenDaysInTz(task.due_date, tomorrowStart, nextDayStart, tz)) {
      dueTomorrow.push(task);
    }
    if (isBetweenDaysInTz(task.due_date, todayStart, nextWeekStart, tz)) {
      thisWeek.push(task);
    }
    if (isBetweenDaysInTz(task.due_date, nextWeekStart, twoWeeksStart, tz)) {
      nextWeek.push(task);
    }
  }

  return {
    dueToday: sortByDueDate(dueToday),
    dueTomorrow: sortByDueDate(dueTomorrow),
    thisWeek: sortByDueDate(thisWeek),
    nextWeek: sortByDueDate(nextWeek),
    overdue: sortByDueDate(overdue),
  };
}

function upcomingBody(tasks: VisibleTask[]): string {
  const title = tasks[0]?.routine?.title ?? "A task";
  if (tasks.length === 1) return `${title} is due tomorrow.`;
  return `${tasks.length} things due tomorrow, including ${title}.`;
}

function morningBody(dueToday: VisibleTask[], overdue: VisibleTask[]): string {
  if (dueToday.length === 1 && overdue.length === 0) {
    return `${dueToday[0].routine?.title ?? "A task"} is due today.`;
  }
  if (overdue.length === 1 && dueToday.length === 0) {
    return `${overdue[0].routine?.title ?? "A task"} is overdue.`;
  }
  const parts: string[] = [];
  if (overdue.length) {
    parts.push(
      `${overdue.length} overdue`
    );
  }
  if (dueToday.length) {
    parts.push(`${dueToday.length} due today`);
  }
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}.`;
  return `${parts[0]}.`;
}

function weeklyBody(
  thisWeek: number,
  nextWeek: number,
  overdue: number
): string {
  return `This week: ${thisWeek} due, ${nextWeek} next week, ${overdue} overdue.`;
}

function viewPayload(tasks: VisibleTask[]) {
  const instanceIds = tasks.map((task) => task.id);
  return {
    action: "view" as const,
    instance_ids: instanceIds,
    instance_id: instanceIds.length === 1 ? instanceIds[0] : undefined,
  };
}

export async function getUserTimezoneMap(
  supabase: any,
  userId?: string | null
): Promise<Record<string, string>> {
  let q = supabase.from("user_settings").select("user_id, timezone");
  if (userId) q = q.eq("user_id", userId);
  const { data, error } = await q;
  if (error) {
    console.warn("Failed to load user timezones, defaulting to UTC", error);
    return {};
  }
  const map: Record<string, string> = {};
  for (const row of data || []) map[row.user_id] = row.timezone || "UTC";
  return map;
}

export async function processUpcoming(
  supabase: any,
  now: Date,
  results: NotificationResults,
  userId: string,
  tz: string,
  local: LocalParts
) {
  try {
    const enabled = await isTypeEnabled(supabase, userId, "due_soon_reminder");
    if (!enabled) return;

    const tasks = await loadVisibleIncompleteTasks(supabase, userId);
    const { dueTomorrow } = bucketTasks(tasks, now, tz);
    if (dueTomorrow.length === 0) return;

    const sent = await sendDeduped(
      supabase,
      userId,
      dedupeKeyUpcoming(userId, local.localDate),
      "upcoming",
      {
        title: "HomeKeep",
        body: upcomingBody(dueTomorrow),
        data: viewPayload(dueTomorrow),
      }
    );
    if (sent) results.upcomingNotifications++;
  } catch (error) {
    console.error("Error processing upcoming notifications:", error);
    results.errors++;
  }
}

async function sendWeeklySummary(
  supabase: any,
  now: Date,
  results: NotificationResults,
  userId: string,
  tz: string,
  local: LocalParts
): Promise<boolean> {
  const tasks = await loadVisibleIncompleteTasks(supabase, userId);
  const { thisWeek, nextWeek, overdue } = bucketTasks(tasks, now, tz);
  const total = thisWeek.length + nextWeek.length + overdue.length;
  if (total === 0) return false;

  const sent = await sendDeduped(
    supabase,
    userId,
    dedupeKeyMorning(userId, local.localDate),
    "weekly_summary",
    {
      title: "HomeKeep",
      body: weeklyBody(thisWeek.length, nextWeek.length, overdue.length),
      data: {
        action: "view",
        summary: {
          thisWeek: thisWeek.length,
          nextWeek: nextWeek.length,
          overdue: overdue.length,
        },
        instance_ids: [...overdue, ...thisWeek].map((task) => task.id),
      },
    }
  );
  if (sent) results.weeklySummaries++;
  return sent;
}

export async function processMorning(
  supabase: any,
  now: Date,
  results: NotificationResults,
  userId: string,
  tz: string,
  local: LocalParts,
  options?: { preferWeeklyOnSaturday?: boolean }
) {
  try {
    const preferWeekly =
      options?.preferWeeklyOnSaturday !== false && local.weekday === 6;
    if (preferWeekly) {
      const weeklyOn = await isTypeEnabled(supabase, userId, "weekly_summary");
      if (weeklyOn) {
        const sentWeekly = await sendWeeklySummary(
          supabase,
          now,
          results,
          userId,
          tz,
          local
        );
        if (sentWeekly) return;
      }
    }

    const enabled = await isTypeEnabled(supabase, userId, "overdue_reminder");
    if (!enabled) return;

    const tasks = await loadVisibleIncompleteTasks(supabase, userId);
    const { dueToday, overdue } = bucketTasks(tasks, now, tz);
    if (dueToday.length === 0 && overdue.length === 0) return;

    const combined = [...overdue, ...dueToday];
    const sent = await sendDeduped(
      supabase,
      userId,
      dedupeKeyMorning(userId, local.localDate),
      "morning",
      {
        title: "HomeKeep",
        body: morningBody(dueToday, overdue),
        data: viewPayload(combined),
      }
    );
    if (sent) results.morningNotifications++;
  } catch (error) {
    console.error("Error processing morning notifications:", error);
    results.errors++;
  }
}

export async function processWeekly(
  supabase: any,
  now: Date,
  results: NotificationResults,
  userId: string,
  tz: string,
  local: LocalParts
) {
  try {
    const enabled = await isTypeEnabled(supabase, userId, "weekly_summary");
    if (!enabled) return;
    await sendWeeklySummary(supabase, now, results, userId, tz, local);
  } catch (error) {
    console.error("Error processing weekly summaries:", error);
    results.errors++;
  }
}

export type NotificationType = "upcoming" | "morning" | "weekly";

export async function runProcessorsForUser(
  supabase: any,
  now: Date,
  userId: string,
  tz: string,
  activeTypes: Set<NotificationType>,
  results: NotificationResults,
  options?: { scheduled?: boolean }
) {
  const local = getLocalParts(now, tz);

  if (activeTypes.has("upcoming")) {
    await processUpcoming(supabase, now, results, userId, tz, local);
  }
  if (activeTypes.has("morning")) {
    await processMorning(supabase, now, results, userId, tz, local, {
      preferWeeklyOnSaturday:
        !!options?.scheduled && !activeTypes.has("weekly"),
    });
  } else if (activeTypes.has("weekly")) {
    await processWeekly(supabase, now, results, userId, tz, local);
  }
}
