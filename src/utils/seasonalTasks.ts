import { addDays, endOfDay, format, startOfDay } from "date-fns";
import { MaintenanceTask } from "../types/maintenance";
import { isGrowingSeason } from "./homeSeason";

/** Hide frequent outdoor jobs (mow, fertilize, pool upkeep) when they are out of season instead of leaving them overdue. */
export function isTaskInSeason(
  task: MaintenanceTask,
  month: number,
  latitude?: number | null
): boolean {
  const growing = isGrowingSeason(month, latitude);
  if (
    task.category === "LANDSCAPING" &&
    task.interval_days <= 90 &&
    !growing
  ) {
    return false;
  }
  if (
    task.source_plan_id === "pool-spa-care" &&
    task.interval_days <= 30 &&
    !growing
  ) {
    return false;
  }
  return true;
}

export function taskDurationMinutes(task: MaintenanceTask): number {
  return task.estimated_duration_minutes > 0
    ? task.estimated_duration_minutes
    : 30;
}

/** End of the upcoming Sunday (today if today is Sunday). */
export function weekendWindowEnd(now: Date = new Date()): Date {
  const start = startOfDay(now);
  const daysUntilSunday = (7 - start.getDay()) % 7;
  return endOfDay(addDays(start, daysUntilSunday));
}

export type WeekendPlan = {
  tasks: MaintenanceTask[];
  usedMinutes: number;
  budgetMinutes: number;
  remainingMinutes: number;
  windowEnd: Date;
  windowLabel: string;
  eligibleCount: number;
};

/**
 * Pack overdue + tasks due through this Sunday into a time budget.
 * Skips farther-out schedule items so a 90-minute plan stays weekend-relevant.
 */
export function buildWeekendPlan(
  tasks: MaintenanceTask[],
  budgetMinutes: number,
  now: Date = new Date()
): WeekendPlan {
  const windowEnd = weekendWindowEnd(now);
  const windowStart = startOfDay(now);

  const eligible = tasks.filter((task) => {
    if (task.is_completed) return false;
    if (task.is_overdue) return true;
    const due = startOfDay(new Date(task.due_date));
    return due >= windowStart && due <= windowEnd;
  });

  const sorted = [...eligible].sort((a, b) => {
    if (a.is_overdue !== b.is_overdue) return a.is_overdue ? -1 : 1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const picked: MaintenanceTask[] = [];
  let used = 0;
  for (const task of sorted) {
    const duration = taskDurationMinutes(task);
    if (used + duration > budgetMinutes) continue;
    picked.push(task);
    used += duration;
  }

  const throughSunday = now.getDay() === 0;

  return {
    tasks: picked,
    usedMinutes: used,
    budgetMinutes,
    remainingMinutes: Math.max(0, budgetMinutes - used),
    windowEnd,
    windowLabel: throughSunday
      ? "Due today (Sunday)"
      : `Due through Sunday, ${format(windowEnd, "MMM d")}`,
    eligibleCount: eligible.length,
  };
}

/** @deprecated Prefer buildWeekendPlan — kept for call sites that only need the list. */
export function pickWeekendTasks(
  tasks: MaintenanceTask[],
  budgetMinutes: number
): MaintenanceTask[] {
  return buildWeekendPlan(tasks, budgetMinutes).tasks;
}
