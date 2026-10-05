import { MaintenanceTask } from "../types/maintenance";
import {
  HomeSummarySpendTotals,
  HomeSummaryTaskCompletion,
  HomeSummaryTaskGroup,
} from "../types/homeSummary";
import { formatDateTime } from "../screens/completion-history/utils";
import { DEFAULT_CURRENCY, formatMoney } from "./formatMoney";
import { computeSpendLedger, spendForYear } from "./spendLedger";

function completionSortKey(task: MaintenanceTask): number {
  const raw = task.completed_at || task.due_date;
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function mapCompletion(task: MaintenanceTask): HomeSummaryTaskCompletion {
  const labor =
    task.labor_type === "diy" || task.labor_type === "hired"
      ? task.labor_type
      : null;
  const cost =
    typeof task.cost_amount === "number" && Number.isFinite(task.cost_amount)
      ? task.cost_amount
      : null;
  return {
    completedDateLabel: formatDateTime(task.completed_at || task.due_date),
    completedByLabel:
      task.completed_by_name?.trim() ||
      (task.completed_by ? "HomeShare member" : null),
    notes: task.notes?.trim() || null,
    costAmount: cost,
    laborType: labor,
    completedAtIso: task.completed_at || task.due_date || null,
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

export function countHomeSummaryCompletions(
  groups: HomeSummaryTaskGroup[]
): number {
  return groups.reduce((sum, group) => sum + group.completions.length, 0);
}

export function formatHomeSummaryHistoryMeta(
  groups: HomeSummaryTaskGroup[]
): string {
  const completions = countHomeSummaryCompletions(groups);
  const routines = groups.length;
  if (completions === 0) return "0 completions (all time)";
  if (completions === routines) {
    return `${completions} completion${completions === 1 ? "" : "s"} (all time)`;
  }
  return `${completions} completions across ${routines} task${
    routines === 1 ? "" : "s"
  } (all time)`;
}

export function formatHomeSummaryCost(
  amount: number,
  currency: string = DEFAULT_CURRENCY
): string {
  return formatMoney(amount, currency);
}

export function laborTypeLabel(
  laborType: "diy" | "hired" | null | undefined
): string | null {
  if (laborType === "diy") return "DIY";
  if (laborType === "hired") return "Hired";
  return null;
}

/** Year and all-time spend for the PDF, from the same ledger as the Spend screen. */
export function computeHomeSummarySpendTotals(
  tasks: MaintenanceTask[],
  now: Date = new Date()
): HomeSummarySpendTotals {
  const ledger = computeSpendLedger(tasks, now);
  const year = now.getFullYear();
  return {
    yearLabel: String(year),
    yearTotal: spendForYear(ledger, year)?.total ?? 0,
    allTimeTotal: ledger.allTime.total,
    hasAnyCost: ledger.hasAnyCost,
  };
}
