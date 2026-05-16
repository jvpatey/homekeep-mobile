// deno-lint-ignore-file no-explicit-any
import {
  dedupeKeyDailyDigest,
  dedupeKeyDueSoon,
  dedupeKeyOverdue,
  dedupeKeyWeeklySummary,
  tryRecordDelivery,
} from "./dedupe.ts";
import { sendPush, type PushPayload } from "./expo-push.ts";
import { shouldSendNotification } from "./preferences.ts";
import {
  addUtcDays,
  getLocalParts,
  isBetweenDaysInTz,
  OVERDUE_LOOKBACK_DAYS,
  tzStartOfDay,
  type LocalParts,
} from "./timezone.ts";

export interface NotificationResults {
  dueSoonNotifications: number;
  overdueNotifications: number;
  dailyDigests: number;
  weeklySummaries: number;
  errors: number;
}

export function emptyResults(): NotificationResults {
  return {
    dueSoonNotifications: 0,
    overdueNotifications: 0,
    dailyDigests: 0,
    weeklySummaries: 0,
    errors: 0,
  };
}

async function sendDeduped(
  supabase: any,
  userId: string,
  dedupeKey: string,
  notificationType: string,
  notification: PushPayload
): Promise<boolean> {
  const shouldSend = await tryRecordDelivery(
    supabase,
    userId,
    dedupeKey,
    notificationType
  );
  if (!shouldSend) return false;

  const result = await sendPush(supabase, userId, notification);
  if (!result.success) {
    console.warn("Push failed after dedupe record", {
      userId,
      dedupeKey,
      error: result.error,
    });
  }
  return result.success;
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

export async function processDueSoonNotifications(
  supabase: any,
  now: Date,
  results: NotificationResults,
  userId: string,
  tz: string,
  local: LocalParts
) {
  try {
    const { data: tasks, error } = await supabase
      .from("routine_instances")
      .select(`
        id,
        due_date,
        is_completed,
        routine:maintenance_routines(
          id,
          user_id,
          title,
          category,
          priority,
          estimated_duration_minutes,
          is_active
        )
      `)
      .eq("is_completed", false)
      .eq("routine.is_active", true)
      .eq("routine.user_id", userId);

    if (error) throw error;

    const todayStart = tzStartOfDay(now, tz);
    const tomorrowStart = addUtcDays(todayStart, 1);
    const nextDayStart = addUtcDays(todayStart, 2);

    for (const task of tasks || []) {
      if (!task.routine) continue;

      const isDueTomorrow = isBetweenDaysInTz(
        task.due_date,
        tomorrowStart,
        nextDayStart,
        tz
      );
      if (!isDueTomorrow) continue;

      const ok = await shouldSendNotification(
        supabase,
        task.routine.user_id,
        task.routine.category,
        "due_soon_reminder"
      );
      if (!ok) continue;

      const sent = await sendDeduped(
        supabase,
        task.routine.user_id,
        dedupeKeyDueSoon(task.id, local.localDate),
        "due_soon",
        {
          title: "HomeKeep",
          body: `${task.routine.title} is due tomorrow. Estimated time: ${task.routine.estimated_duration_minutes} minutes.`,
          data: {
            task_id: task.routine.id,
            instance_id: task.id,
            category: task.routine.category,
            priority: task.routine.priority,
            due_date: task.due_date,
            action: "view",
          },
        }
      );
      if (sent) results.dueSoonNotifications++;
    }
  } catch (error) {
    console.error("Error processing due soon notifications:", error);
    results.errors++;
  }
}

export async function processOverdueNotifications(
  supabase: any,
  now: Date,
  results: NotificationResults,
  userId: string,
  tz: string,
  local: LocalParts
) {
  try {
    const { data: tasks, error } = await supabase
      .from("routine_instances")
      .select(`
        id,
        due_date,
        is_completed,
        routine:maintenance_routines(
          id,
          user_id,
          title,
          category,
          priority,
          estimated_duration_minutes,
          is_active
        )
      `)
      .eq("is_completed", false)
      .eq("routine.is_active", true)
      .eq("routine.user_id", userId);

    if (error) throw error;

    const todayStart = tzStartOfDay(now, tz);
    const lookbackStart = addUtcDays(todayStart, -OVERDUE_LOOKBACK_DAYS);

    for (const task of tasks || []) {
      if (!task.routine) continue;

      const dueStart = tzStartOfDay(new Date(task.due_date), tz);
      const isOverdue = dueStart < todayStart;
      const withinLookback = dueStart >= lookbackStart;
      if (!(isOverdue && withinLookback)) continue;

      const ok = await shouldSendNotification(
        supabase,
        task.routine.user_id,
        task.routine.category,
        "overdue_reminder"
      );
      if (!ok) continue;

      const sent = await sendDeduped(
        supabase,
        task.routine.user_id,
        dedupeKeyOverdue(task.id, local.localDate),
        "overdue",
        {
          title: "HomeKeep",
          body: `${task.routine.title} is overdue. Please complete it soon.`,
          data: {
            task_id: task.routine.id,
            instance_id: task.id,
            category: task.routine.category,
            priority: task.routine.priority,
            due_date: task.due_date,
            action: "complete",
          },
        }
      );
      if (sent) results.overdueNotifications++;
    }
  } catch (error) {
    console.error("Error processing overdue notifications:", error);
    results.errors++;
  }
}

async function generateDigestCountsWithSql(
  supabase: any,
  userId: string,
  categories: string[],
  todayStart: Date,
  tomorrowStart: Date,
  nextDayStart: Date,
  lookbackStart: Date,
  tz: string
) {
  if (!categories || categories.length === 0) {
    return { dueToday: 0, dueTomorrow: 0, overdue: 0, totalTasks: 0 };
  }

  const base = supabase
    .from("routine_instances")
    .select("id, due_date, routine:maintenance_routines(category, is_active)")
    .eq("routine.user_id", userId)
    .in("routine.category", categories)
    .eq("is_completed", false)
    .eq("routine.is_active", true);

  const { data: dueTodayRows, error: e1 } = await base
    .gte("due_date", todayStart.toISOString())
    .lt("due_date", tomorrowStart.toISOString());
  if (e1) throw e1;

  const { data: dueTomorrowRows, error: e2 } = await base
    .gte("due_date", tomorrowStart.toISOString())
    .lt("due_date", nextDayStart.toISOString());
  if (e2) throw e2;

  const { data: overdueRows, error: e3 } = await base
    .gte("due_date", lookbackStart.toISOString())
    .lt("due_date", todayStart.toISOString());
  if (e3) throw e3;

  console.log("digest overdue details", {
    userId,
    tz,
    todayStart: todayStart.toISOString(),
    lookbackStart: lookbackStart.toISOString(),
    overdueIds: (overdueRows || []).map((r: any) => r.id),
  });

  const dueToday = dueTodayRows?.length || 0;
  const dueTomorrow = dueTomorrowRows?.length || 0;
  const overdue = overdueRows?.length || 0;

  return {
    dueToday,
    dueTomorrow,
    overdue,
    totalTasks: dueToday + dueTomorrow + overdue,
  };
}

export async function processDailyDigests(
  supabase: any,
  now: Date,
  results: NotificationResults,
  userId: string,
  tz: string,
  local: LocalParts
) {
  try {
    const { data: preferences, error } = await supabase
      .from("notification_preferences")
      .select("user_id, category")
      .eq("daily_digest", true)
      .eq("user_id", userId);

    if (error) throw error;

    const categories = (preferences || []).map((p: any) => p.category);
    if (categories.length === 0) return;

    const todayStart = tzStartOfDay(now, tz);
    const tomorrowStart = addUtcDays(todayStart, 1);
    const nextDayStart = addUtcDays(todayStart, 2);
    const lookbackStart = addUtcDays(todayStart, -OVERDUE_LOOKBACK_DAYS);

    const digest = await generateDigestCountsWithSql(
      supabase,
      userId,
      categories,
      todayStart,
      tomorrowStart,
      nextDayStart,
      lookbackStart,
      tz
    );

    const hasDailyItems = digest.dueToday + digest.dueTomorrow > 0;
    if (!hasDailyItems) return;

    console.log("daily digest counts", { userId, tz, digest });

    const sent = await sendDeduped(
      supabase,
      userId,
      dedupeKeyDailyDigest(userId, local.localDate),
      "daily_digest",
      {
        title: "HomeKeep",
        body: `You have ${digest.dueToday} tasks due today and ${digest.dueTomorrow} due tomorrow.`,
        data: {
          action: "view",
          digest: {
            dueToday: digest.dueToday,
            dueTomorrow: digest.dueTomorrow,
          },
        },
      }
    );
    if (sent) results.dailyDigests++;
  } catch (error) {
    console.error("Error processing daily digests:", error);
    results.errors++;
  }
}

export async function processWeeklySummaries(
  supabase: any,
  now: Date,
  results: NotificationResults,
  userId: string,
  tz: string,
  local: LocalParts
) {
  try {
    if (local.weekday !== 1) return;

    const { data: preferences, error } = await supabase
      .from("notification_preferences")
      .select("user_id, category")
      .eq("weekly_summary", true)
      .eq("user_id", userId);

    if (error) throw error;

    const categories = (preferences || []).map((p: any) => p.category);
    if (categories.length === 0) return;

    const todayStart = tzStartOfDay(now, tz);
    const nextWeekStart = addUtcDays(todayStart, 7);
    const twoWeeksStart = addUtcDays(todayStart, 14);
    const lookbackStart = addUtcDays(todayStart, -OVERDUE_LOOKBACK_DAYS);

    const weekly = await generateDigestCountsWithSql(
      supabase,
      userId,
      categories,
      todayStart,
      nextWeekStart,
      twoWeeksStart,
      lookbackStart,
      tz
    );

    const summary = {
      thisWeek: weekly.dueToday,
      nextWeek: weekly.dueTomorrow,
      overdue: weekly.overdue,
      totalTasks: weekly.dueToday + weekly.dueTomorrow + weekly.overdue,
    };

    console.log("weekly summary counts", { userId, tz, summary });
    if (summary.totalTasks === 0) return;

    const sent = await sendDeduped(
      supabase,
      userId,
      dedupeKeyWeeklySummary(userId, local.weekStart),
      "weekly_summary",
      {
        title: "HomeKeep",
        body: `This week: ${summary.thisWeek} tasks due, ${summary.nextWeek} next week, ${summary.overdue} overdue.`,
        data: { action: "view", summary },
      }
    );
    if (sent) results.weeklySummaries++;
  } catch (error) {
    console.error("Error processing weekly summaries:", error);
    results.errors++;
  }
}

export type NotificationType = "daily" | "due_soon" | "overdue" | "weekly";

export async function runProcessorsForUser(
  supabase: any,
  now: Date,
  userId: string,
  tz: string,
  activeTypes: Set<NotificationType>,
  results: NotificationResults
) {
  const local = getLocalParts(now, tz);

  if (activeTypes.has("daily")) {
    await processDailyDigests(supabase, now, results, userId, tz, local);
  }
  if (activeTypes.has("due_soon")) {
    await processDueSoonNotifications(supabase, now, results, userId, tz, local);
  }
  if (activeTypes.has("overdue")) {
    await processOverdueNotifications(supabase, now, results, userId, tz, local);
  }
  if (activeTypes.has("weekly")) {
    await processWeeklySummaries(supabase, now, results, userId, tz, local);
  }
}
