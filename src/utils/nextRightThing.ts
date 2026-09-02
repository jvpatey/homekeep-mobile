import { MaintenanceTask } from "../types/maintenance";
import { isSameDay, startOfDay, addDays } from "date-fns";

export function pickNextRightThing(
  overdueTasks: MaintenanceTask[],
  upcomingTasks: MaintenanceTask[]
): MaintenanceTask | null {
  if (overdueTasks.length > 0) {
    return [...overdueTasks].sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    )[0];
  }

  const today = startOfDay(new Date());
  const dueToday = upcomingTasks.filter((t) =>
    isSameDay(new Date(t.due_date), today)
  );
  if (dueToday.length > 0) {
    return dueToday[0];
  }

  const soon = upcomingTasks
    .filter((t) => !t.is_completed)
    .sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    );
  return soon[0] ?? null;
}

export function nextRightThingWhy(
  task: MaintenanceTask,
  options?: { weatherWhy?: string | null; inSeasonPlanId?: string | null }
): string {
  if (options?.weatherWhy) return options.weatherWhy;
  if (task.is_overdue) return "Overdue — this one first";
  const today = startOfDay(new Date());
  if (isSameDay(new Date(task.due_date), today)) return "Due today";
  const weekEnd = addDays(today, 7);
  if (new Date(task.due_date) <= weekEnd) return "Due this week";
  if (
    options?.inSeasonPlanId &&
    task.source_plan_id === options.inSeasonPlanId
  ) {
    return "In season for your climate";
  }
  return "Next on your schedule";
}
