import AsyncStorage from "@react-native-async-storage/async-storage";
import { weekendWindowEnd, taskDurationMinutes } from "./seasonalTasks";
import { MaintenanceTask } from "../types/maintenance";

const PLAN_KEY = "@homekeep/weekend_plan";
const HISTORY_KEY = "@homekeep/weekend_plan_history";
const HISTORY_LIMIT = 12;

export type WeekendPlanItem = {
  instanceId: string;
  title: string;
  durationMinutes: number;
  completedAtISO: string | null;
};

export type StoredWeekendPlan = {
  budgetMinutes: number;
  windowEndISO: string;
  startedAtISO: string;
  items: WeekendPlanItem[];
};

export type WeekendPlanHistoryEntry = {
  id: string;
  completedAtISO: string;
  budgetMinutes: number;
  taskCount: number;
  totalMinutes: number;
  titles: string[];
};

export type ResolvedWeekendPlan = {
  budgetMinutes: number;
  windowEnd: Date;
  startedAt: Date;
  items: Array<WeekendPlanItem & { isComplete: boolean }>;
  completedCount: number;
  totalCount: number;
  remainingCount: number;
  plannedMinutes: number;
  completedMinutes: number;
  remainingMinutes: number;
  isComplete: boolean;
};

function isValidPlan(value: unknown): value is StoredWeekendPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as StoredWeekendPlan;
  return (
    typeof plan.budgetMinutes === "number" &&
    typeof plan.windowEndISO === "string" &&
    typeof plan.startedAtISO === "string" &&
    Array.isArray(plan.items)
  );
}

/** Migrate older `{ budgetMinutes, windowEndISO }` records by dropping them. */
export async function loadWeekendPlan(): Promise<StoredWeekendPlan | null> {
  try {
    const raw = await AsyncStorage.getItem(PLAN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidPlan(parsed) || parsed.items.length === 0) {
      await AsyncStorage.removeItem(PLAN_KEY);
      return null;
    }
    if (Date.now() > new Date(parsed.windowEndISO).getTime()) {
      await AsyncStorage.removeItem(PLAN_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveWeekendPlan(
  plan: StoredWeekendPlan
): Promise<StoredWeekendPlan> {
  await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  return plan;
}

export async function clearWeekendPlan(): Promise<void> {
  await AsyncStorage.removeItem(PLAN_KEY);
}

export function createWeekendPlanFromTasks(
  tasks: MaintenanceTask[],
  budgetMinutes: number
): StoredWeekendPlan | null {
  if (tasks.length === 0) return null;
  const now = new Date();
  return {
    budgetMinutes,
    windowEndISO: weekendWindowEnd(now).toISOString(),
    startedAtISO: now.toISOString(),
    items: tasks.map((task) => ({
      instanceId: task.instance_id,
      title: task.title,
      durationMinutes: taskDurationMinutes(task),
      completedAtISO: null,
    })),
  };
}

export function resolveWeekendPlan(
  plan: StoredWeekendPlan
): ResolvedWeekendPlan {
  const items = plan.items.map((item) => ({
    ...item,
    isComplete: !!item.completedAtISO,
  }));
  const completedCount = items.filter((i) => i.isComplete).length;
  const plannedMinutes = items.reduce((sum, i) => sum + i.durationMinutes, 0);
  const completedMinutes = items
    .filter((i) => i.isComplete)
    .reduce((sum, i) => sum + i.durationMinutes, 0);

  return {
    budgetMinutes: plan.budgetMinutes,
    windowEnd: new Date(plan.windowEndISO),
    startedAt: new Date(plan.startedAtISO),
    items,
    completedCount,
    totalCount: items.length,
    remainingCount: items.length - completedCount,
    plannedMinutes,
    completedMinutes,
    remainingMinutes: plannedMinutes - completedMinutes,
    isComplete: items.length > 0 && completedCount === items.length,
  };
}

export async function markWeekendPlanItemComplete(
  instanceId: string,
  completedAt: Date = new Date()
): Promise<StoredWeekendPlan | null> {
  const plan = await loadWeekendPlan();
  if (!plan) return null;
  let changed = false;
  const items = plan.items.map((item) => {
    if (item.instanceId !== instanceId || item.completedAtISO) return item;
    changed = true;
    return { ...item, completedAtISO: completedAt.toISOString() };
  });
  if (!changed) return plan;
  const next = { ...plan, items };
  await saveWeekendPlan(next);
  return next;
}

export async function loadWeekendPlanHistory(): Promise<
  WeekendPlanHistoryEntry[]
> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WeekendPlanHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function archiveWeekendPlan(
  plan: StoredWeekendPlan
): Promise<WeekendPlanHistoryEntry> {
  const completedAt = new Date();
  const entry: WeekendPlanHistoryEntry = {
    id: `${completedAt.getTime()}`,
    completedAtISO: completedAt.toISOString(),
    budgetMinutes: plan.budgetMinutes,
    taskCount: plan.items.length,
    totalMinutes: plan.items.reduce((sum, i) => sum + i.durationMinutes, 0),
    titles: plan.items.map((i) => i.title),
  };
  const history = await loadWeekendPlanHistory();
  const next = [entry, ...history].slice(0, HISTORY_LIMIT);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  await clearWeekendPlan();
  return entry;
}
