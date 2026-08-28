import { MaintenanceTask } from "../../types/maintenance";
import { groupTasksByDate, formatDate } from "./timeline-view/utils";
import { sortTasksByDateThenPriority } from "./utils";

/** One row per routine: earliest upcoming instance only. */
export function dedupeEarliestPerRoutine(
  tasks: MaintenanceTask[]
): MaintenanceTask[] {
  const earliestByRoutine = new Map<string, MaintenanceTask>();
  for (const task of tasks) {
    if (task.is_completed) continue;
    const existing = earliestByRoutine.get(task.id);
    if (!existing) {
      earliestByRoutine.set(task.id, task);
      continue;
    }
    const existingDue = new Date(existing.due_date).getTime();
    const taskDue = new Date(task.due_date).getTime();
    if (taskDue < existingDue) {
      earliestByRoutine.set(task.id, task);
    }
  }

  return Array.from(earliestByRoutine.values()).sort(
    (a, b) =>
      new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );
}

export type DashboardScheduleSection = {
  key: string;
  title: string;
  subtitle?: string;
  headerVariant: "overdue" | "date";
  date?: Date;
  taskCount?: number;
  data: MaintenanceTask[];
};

/**
 * Overdue first, then chronological date groups. No separate "Due soon" bucket.
 */
export function buildDashboardSections(
  scheduleTasks: MaintenanceTask[],
  overdueTasks: MaintenanceTask[] = []
): DashboardScheduleSection[] {
  const sections: DashboardScheduleSection[] = [];

  const overdueSorted = sortTasksByDateThenPriority(overdueTasks);
  const overdueIds = new Set(overdueSorted.map((t) => t.instance_id));

  if (overdueSorted.length > 0) {
    sections.push({
      key: "overdue",
      title: "Overdue",
      subtitle:
        overdueSorted.length === 1
          ? "1 task needs attention"
          : `${overdueSorted.length} tasks need attention`,
      headerVariant: "overdue",
      data: overdueSorted,
    });
  }

  const upcoming = dedupeEarliestPerRoutine(
    scheduleTasks.filter((t) => !overdueIds.has(t.instance_id))
  );
  const grouped = groupTasksByDate(upcoming);

  grouped.forEach(({ date, tasks }) => {
    sections.push({
      key: `date-${date.toISOString()}`,
      title: formatDate(date),
      headerVariant: "date",
      date,
      taskCount: tasks.length,
      data: tasks,
    });
  });

  return sections;
}

/** Count tasks due today (for header chip). */
export function countDueToday(tasks: MaintenanceTask[]): number {
  const today = new Date().toDateString();
  return tasks.filter(
    (t) => new Date(t.due_date).toDateString() === today && !t.is_completed
  ).length;
}
