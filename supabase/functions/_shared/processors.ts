// deno-lint-ignore-file no-explicit-any
import {
  dedupeKeyMonthly,
  dedupeKeyMorning,
  dedupeKeyRecall,
  dedupeKeyUpcoming,
} from "./dedupe.ts";
import { sendDeduped } from "./expo-push.ts";
import { isTypeEnabled } from "./preferences.ts";
import { isTaskInSeason } from "./seasonalTasks.ts";
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
  monthlySummaries: number;
  recallAlerts: number;
  errors: number;
}

export function emptyResults(): NotificationResults {
  return {
    upcomingNotifications: 0,
    morningNotifications: 0,
    weeklySummaries: 0,
    monthlySummaries: 0,
    recallAlerts: 0,
    errors: 0,
  };
}

interface VisibleRoutine {
  id: string;
  title: string;
  category: string;
  priority: string;
  estimated_duration_minutes: number;
  interval_days: number;
  source_plan_id: string | null;
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

async function getViewerLatitude(
  supabase: any,
  userId: string,
  householdId: string | null
): Promise<number | null> {
  // Prefer the household owner's coords when sharing a home.
  let profileId = userId;
  if (householdId) {
    const { data: household } = await supabase
      .from("households")
      .select("created_by")
      .eq("id", householdId)
      .maybeSingle();
    if (typeof household?.created_by === "string") {
      profileId = household.created_by;
    }
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("latitude")
    .eq("id", profileId)
    .maybeSingle();
  if (error) {
    console.warn("Failed to load latitude", error);
    return null;
  }
  return typeof data?.latitude === "number" ? data.latitude : null;
}

async function loadVisibleIncompleteTasks(
  supabase: any,
  userId: string,
  month: number
): Promise<VisibleTask[]> {
  const householdId = await getViewerHouseholdId(supabase, userId);
  const latitude = await getViewerLatitude(supabase, userId, householdId);

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
          interval_days,
          source_plan_id,
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

  return ((data || []) as VisibleTask[]).filter((task) => {
    if (!task.routine) return false;
    return isTaskInSeason({
      category: task.routine.category,
      interval_days: task.routine.interval_days ?? 0,
      source_plan_id: task.routine.source_plan_id,
      month,
      latitude,
    });
  });
}

function localMonthFromParts(local: LocalParts): number {
  // localDate is YYYY-MM-DD in the user's timezone
  const month = Number(local.localDate.slice(5, 7));
  return Number.isFinite(month) ? month - 1 : new Date().getUTCMonth();
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

    const tasks = await loadVisibleIncompleteTasks(
      supabase,
      userId,
      localMonthFromParts(local)
    );
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
  const tasks = await loadVisibleIncompleteTasks(
    supabase,
    userId,
    localMonthFromParts(local)
  );
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

    const tasks = await loadVisibleIncompleteTasks(
      supabase,
      userId,
      localMonthFromParts(local)
    );
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

/**
 * Channel-neutral monthly recap. Push uses `monthlyPushBody`; an email
 * formatter can render the same object later.
 */
export interface MonthlySummary {
  /** Local send month, YYYY-MM. */
  month: string;
  /** Month being recapped, YYYY-MM. */
  previousMonth: string;
  previousMonthLabel: string;
  monthLabel: string;
  completedLastMonth: number;
  spentLastMonth: number;
  overdue: number;
  dueThisMonth: number;
  dueThisMonthIds: string[];
}

function monthLabel(year: number, monthIndex: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthIndex, 1)));
}

function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

async function loadCompletedBetween(
  supabase: any,
  userId: string,
  householdId: string | null,
  startLocal: Date,
  endLocal: Date,
  tz: string
): Promise<{ count: number; spent: number }> {
  // Pad the UTC query by a day each side, then filter on local dates.
  let query = supabase
    .from("routine_instances")
    .select(
      `
        id,
        completed_at,
        cost_amount,
        routine:maintenance_routines!inner(user_id, household_id)
      `
    )
    .eq("is_completed", true)
    .gte("completed_at", addUtcDays(startLocal, -1).toISOString())
    .lt("completed_at", addUtcDays(endLocal, 1).toISOString());

  query = householdId
    ? query.eq("routine.household_id", householdId)
    : query.eq("routine.user_id", userId);

  const { data, error } = await query;
  if (error) throw error;

  let count = 0;
  let spent = 0;
  for (const row of (data || []) as Array<{
    completed_at: string | null;
    cost_amount: number | string | null;
  }>) {
    if (!row.completed_at) continue;
    if (!isBetweenDaysInTz(row.completed_at, startLocal, endLocal, tz)) {
      continue;
    }
    count++;
    const cost = Number(row.cost_amount);
    if (Number.isFinite(cost) && cost > 0) spent += cost;
  }
  return { count, spent: Math.round(spent * 100) / 100 };
}

export async function buildMonthlySummary(
  supabase: any,
  userId: string,
  tz: string,
  now: Date
): Promise<MonthlySummary> {
  const local = getLocalParts(now, tz);
  const year = Number(local.localDate.slice(0, 4));
  const monthIndex = localMonthFromParts(local);

  const thisMonthStart = new Date(Date.UTC(year, monthIndex, 1));
  const lastMonthStart = new Date(Date.UTC(year, monthIndex - 1, 1));
  const nextMonthStart = new Date(Date.UTC(year, monthIndex + 1, 1));

  const householdId = await getViewerHouseholdId(supabase, userId);
  const completed = await loadCompletedBetween(
    supabase,
    userId,
    householdId,
    lastMonthStart,
    thisMonthStart,
    tz
  );

  const tasks = await loadVisibleIncompleteTasks(supabase, userId, monthIndex);
  const { overdue } = bucketTasks(tasks, now, tz);
  const dueThisMonth = sortByDueDate(
    tasks.filter((task) =>
      isBetweenDaysInTz(task.due_date, thisMonthStart, nextMonthStart, tz)
    )
  );

  return {
    month: monthKey(thisMonthStart),
    previousMonth: monthKey(lastMonthStart),
    previousMonthLabel: monthLabel(
      lastMonthStart.getUTCFullYear(),
      lastMonthStart.getUTCMonth()
    ),
    monthLabel: monthLabel(year, monthIndex),
    completedLastMonth: completed.count,
    spentLastMonth: completed.spent,
    overdue: overdue.length,
    dueThisMonth: dueThisMonth.length,
    dueThisMonthIds: dueThisMonth.map((task) => task.id),
  };
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function monthlyPushBody(summary: MonthlySummary): string {
  const recap =
    summary.completedLastMonth > 0
      ? `${summary.previousMonthLabel}: ${plural(summary.completedLastMonth, "task", "tasks")} done.`
      : `Nothing logged in ${summary.previousMonthLabel}.`;

  const ahead: string[] = [];
  if (summary.dueThisMonth > 0) {
    ahead.push(`${summary.dueThisMonth} due in ${summary.monthLabel}`);
  }
  if (summary.overdue > 0) {
    ahead.push(`${summary.overdue} overdue`);
  }
  if (ahead.length === 0) {
    return `${recap} You're all caught up for ${summary.monthLabel}.`;
  }
  return `${recap} ${ahead.join(", ")}.`;
}

export async function processMonthly(
  supabase: any,
  now: Date,
  results: NotificationResults,
  userId: string,
  tz: string
) {
  try {
    const enabled = await isTypeEnabled(supabase, userId, "monthly_summary");
    if (!enabled) return;

    const summary = await buildMonthlySummary(supabase, userId, tz, now);
    const hasNews =
      summary.completedLastMonth > 0 ||
      summary.dueThisMonth > 0 ||
      summary.overdue > 0;
    if (!hasNews) return;

    const sent = await sendDeduped(
      supabase,
      userId,
      dedupeKeyMonthly(userId, summary.month),
      "monthly_summary",
      {
        title: `Your ${summary.previousMonthLabel} home recap`,
        body: monthlyPushBody(summary),
        data: {
          action: "view",
          summary: {
            kind: "monthly",
            month: summary.previousMonth,
            completed: summary.completedLastMonth,
            spent: summary.spentLastMonth,
            overdue: summary.overdue,
            dueThisMonth: summary.dueThisMonth,
          },
          instance_ids: summary.dueThisMonthIds,
        },
      }
    );
    if (sent) results.monthlySummaries++;
  } catch (error) {
    console.error("Error processing monthly summary:", error);
    results.errors++;
  }
}

/** Recalls older than this are left to the in-app banner. */
const RECALL_PUSH_WINDOW_DAYS = 30;
const MAX_RECALL_PUSHES_PER_RUN = 3;

interface OpenRecall {
  id: string;
  equipment_id: string;
  recall_number: string;
  title: string;
  hazard: string | null;
  notified_at: string | null;
  equipment: { name: string | null } | null;
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Pushes undismissed recalls for the viewer's home. Dedupe is per user, so
 * every household member hears about each recall once; `notified_at`
 * records the first push.
 */
export async function processRecalls(
  supabase: any,
  now: Date,
  results: NotificationResults,
  userId: string
) {
  try {
    const enabled = await isTypeEnabled(supabase, userId, "recall_alerts");
    if (!enabled) return;

    const householdId = await getViewerHouseholdId(supabase, userId);
    let query = supabase
      .from("equipment_recalls")
      .select(
        "id, equipment_id, recall_number, title, hazard, notified_at, equipment:equipment_manuals(name)"
      )
      .is("dismissed_at", null)
      .gte(
        "created_at",
        addUtcDays(now, -RECALL_PUSH_WINDOW_DAYS).toISOString()
      )
      .order("created_at", { ascending: true })
      .limit(20);
    query = householdId
      ? query.eq("household_id", householdId)
      : query.eq("user_id", userId);

    const { data, error } = await query;
    if (error) throw error;

    let sentCount = 0;
    for (const recall of (data || []) as OpenRecall[]) {
      if (sentCount >= MAX_RECALL_PUSHES_PER_RUN) break;
      const equipmentName = recall.equipment?.name?.trim() || "your equipment";
      const sent = await sendDeduped(
        supabase,
        userId,
        dedupeKeyRecall(userId, recall.equipment_id, recall.recall_number),
        "recall",
        {
          title: `Recall: ${equipmentName}`,
          body: truncate(recall.title, 178),
          data: {
            action: "recall",
            equipment_id: recall.equipment_id,
            recall_id: recall.id,
          },
        }
      );
      if (!sent) continue;
      sentCount++;
      results.recallAlerts++;
      if (!recall.notified_at) {
        await supabase
          .from("equipment_recalls")
          .update({ notified_at: now.toISOString() })
          .eq("id", recall.id);
      }
    }
  } catch (error) {
    console.error("Error processing recall alerts:", error);
    results.errors++;
  }
}

export type NotificationType =
  | "upcoming"
  | "morning"
  | "weekly"
  | "monthly"
  | "recall";

/** Job types that only run for HomeKeep+ members. */
export const PLUS_ONLY_TYPES: ReadonlySet<NotificationType> = new Set([
  "upcoming",
  "morning",
  "weekly",
]);

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
  if (activeTypes.has("monthly")) {
    await processMonthly(supabase, now, results, userId, tz);
  }
  if (activeTypes.has("recall")) {
    await processRecalls(supabase, now, results, userId);
  }
}
