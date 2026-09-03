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

export function pickWeekendTasks(
  tasks: MaintenanceTask[],
  budgetMinutes: number
): MaintenanceTask[] {
  const sorted = [...tasks].sort((a, b) => {
    if (a.is_overdue !== b.is_overdue) return a.is_overdue ? -1 : 1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });
  const picked: MaintenanceTask[] = [];
  let used = 0;
  for (const task of sorted) {
    const duration = task.estimated_duration_minutes || 30;
    if (used + duration > budgetMinutes) continue;
    picked.push(task);
    used += duration;
  }
  return picked;
}
