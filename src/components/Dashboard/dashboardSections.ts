import { MaintenanceTask } from "../../types/maintenance";
import { groupTasksByDate, formatDate } from "./timeline-view/utils";
import {
  getDueSoonTasks,
  sortTasksByPriorityAndDate,
} from "./utils";

/** One row per routine: earliest upcoming instance only (matches former timeline load). */
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
  /** Stable key for SectionList */
  key: string;
  /** Primary heading (e.g. Due soon, Today) */
  title: string;
  /** Secondary line under title */
  subtitle?: string;
  headerVariant: "due_soon" | "date";
  date?: Date;
  taskCount?: number;
  data: MaintenanceTask[];
};

/**
 * Builds SectionList sections: "Due soon" (next 7 days, same rules as stats)
 * then date-grouped upcoming tasks. Tasks in Due soon are excluded from date
 * sections so each instance appears once.
 */
export function buildDashboardSections(
  scheduleTasks: MaintenanceTask[]
): DashboardScheduleSection[] {
  const sorted = dedupeEarliestPerRoutine(scheduleTasks);
  const dueSoon = sortTasksByPriorityAndDate(getDueSoonTasks(sorted));
  const dueSoonIds = new Set(dueSoon.map((t) => t.instance_id));

  const rest = sorted.filter((t) => !dueSoonIds.has(t.instance_id));
  const grouped = groupTasksByDate(rest);

  const sections: DashboardScheduleSection[] = [];

  if (dueSoon.length > 0) {
    sections.push({
      key: "due_soon",
      title: "Due soon",
      subtitle: "Next 7 days",
      headerVariant: "due_soon",
      data: dueSoon,
    });
  }

  grouped.forEach(({ date, tasks }, index) => {
    sections.push({
      key: `date-${date.toISOString()}`,
      title: formatDate(date),
      subtitle: index === 0 ? "Scheduled ahead" : undefined,
      headerVariant: "date",
      date,
      taskCount: tasks.length,
      data: tasks,
    });
  });

  return sections;
}
