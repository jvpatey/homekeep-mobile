import { MaintenanceTask } from "../types/maintenance";
import {
  HomeSummaryTaskCompletion,
  HomeSummaryTaskGroup,
} from "../types/homeSummary";
import { formatDateTime } from "../screens/completion-history/utils";

function completionSortKey(task: MaintenanceTask): number {
  const raw = task.completed_at || task.due_date;
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function mapCompletion(task: MaintenanceTask): HomeSummaryTaskCompletion {
  return {
    completedDateLabel: formatDateTime(task.completed_at || task.due_date),
    completedByLabel:
      task.completed_by_name?.trim() ||
      (task.completed_by ? "Household member" : null),
    notes: task.notes?.trim() || null,
  };
}

/** Groups completed instances by routine for summary tables. */
export function groupCompletedTasksByRoutine(
  instances: MaintenanceTask[]
): HomeSummaryTaskGroup[] {
  const entries = Array.from(byRoutineMap(instances).entries());

  entries.sort(([, a], [, b]) => {
    const latestA = Math.max(...a.map(completionSortKey));
    const latestB = Math.max(...b.map(completionSortKey));
    return latestB - latestA;
  });

  return entries.map(([, routineInstances]) => {
    const sortedInstances = [...routineInstances].sort(
      (a, b) => completionSortKey(b) - completionSortKey(a)
    );
    const first = sortedInstances[0];
    return {
      title: first.title,
      category: first.category,
      completions: sortedInstances.map(mapCompletion),
    };
  });
}

function byRoutineMap(
  instances: MaintenanceTask[]
): Map<string, MaintenanceTask[]> {
  const map = new Map<string, MaintenanceTask[]>();
  for (const task of instances) {
    const list = map.get(task.id) ?? [];
    list.push(task);
    map.set(task.id, list);
  }
  return map;
}

export function countHomeSummaryCompletions(groups: HomeSummaryTaskGroup[]): number {
  return groups.reduce((sum, group) => sum + group.completions.length, 0);
}

export function formatHomeSummaryHistoryMeta(groups: HomeSummaryTaskGroup[]): string {
  const completions = countHomeSummaryCompletions(groups);
  const routines = groups.length;
  if (completions === 0) return "0 completions (all time)";
  if (completions === routines) {
    return `${completions} completion${completions === 1 ? "" : "s"} (all time)`;
  }
  return `${completions} completions across ${routines} task${routines === 1 ? "" : "s"} (all time)`;
}
