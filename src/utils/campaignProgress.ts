import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaintenanceRoutine, MaintenanceTask } from "../types/maintenance";
import { getMaintenancePlanById } from "../data/maintenancePlans";

const KEY_PREFIX = "@homekeep/campaign_celebrated:";

export type CampaignProgress = {
  planId: string;
  title: string;
  total: number;
  done: number;
  isComplete: boolean;
};

export function campaignCelebratedKey(planId: string, year: number): string {
  return `${KEY_PREFIX}${planId}:${year}`;
}

export async function hasCelebratedCampaign(
  planId: string,
  year: number = new Date().getFullYear()
): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(
      campaignCelebratedKey(planId, year)
    );
    return value === "1";
  } catch {
    return false;
  }
}

export async function markCampaignCelebrated(
  planId: string,
  year: number = new Date().getFullYear()
): Promise<void> {
  try {
    await AsyncStorage.setItem(campaignCelebratedKey(planId, year), "1");
  } catch {
    // best-effort
  }
}

/**
 * Progress for an applied seasonal plan.
 * Done = has at least one completion and is not currently overdue.
 */
export function computeCampaignProgress(
  planId: string,
  routines: MaintenanceRoutine[],
  openTasks: MaintenanceTask[],
  completedTasks: MaintenanceTask[]
): CampaignProgress | null {
  const planRoutines = routines.filter(
    (r) => r.is_active && r.source_plan_id === planId
  );
  if (planRoutines.length === 0) return null;

  const overdueIds = new Set(
    openTasks.filter((t) => t.is_overdue).map((t) => t.id)
  );
  const completedIds = new Set(completedTasks.map((t) => t.id));

  let done = 0;
  for (const routine of planRoutines) {
    const hasCompletion = completedIds.has(routine.id);
    const isOverdue = overdueIds.has(routine.id);
    if (hasCompletion && !isOverdue) done += 1;
  }

  const plan = getMaintenancePlanById(planId);
  return {
    planId,
    title: plan?.title ?? "Seasonal plan",
    total: planRoutines.length,
    done,
    isComplete: done >= planRoutines.length,
  };
}
