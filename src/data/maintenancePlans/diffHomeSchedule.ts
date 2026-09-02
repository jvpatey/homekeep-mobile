import {
  generateHomeScheduleItems,
  ScheduledHomeItem,
} from "./generateHomeSchedule";
import type { HomeSystems } from "./homeSystems";
import { MAINTENANCE_PLANS } from "./plans";
import { routineIdentityKey } from "./types";
import type { MaintenanceCategory } from "../../types/maintenance";

const CATALOG_PLAN_IDS = new Set(MAINTENANCE_PLANS.map((plan) => plan.id));

export type ExistingRoutineForDiff = {
  id: string;
  title: string;
  category: MaintenanceCategory;
  interval_days: number;
  source_plan_id?: string | null;
};

export type PauseCandidate = ExistingRoutineForDiff & {
  identityKey: string;
};

export interface HomeScheduleDiff {
  toAdd: ScheduledHomeItem[];
  toPause: PauseCandidate[];
}

function itemKey(item: {
  title: string;
  category: MaintenanceCategory;
  interval_days: number;
}): string {
  return routineIdentityKey(item.title, item.category, item.interval_days);
}

/**
 * Diff generated catalogs for the same season. Only systems changes
 * produce adds/pauses — off-season plan items are left alone.
 */
export function diffHomeSchedule({
  oldHome,
  newHome,
  existingRoutines,
  month,
  latitude,
}: {
  oldHome: HomeSystems | null | undefined;
  newHome: HomeSystems;
  existingRoutines: ExistingRoutineForDiff[];
  month?: number;
  latitude?: number | null;
}): HomeScheduleDiff {
  const options = { month, latitude };
  const oldItems = generateHomeScheduleItems(oldHome ?? {}, options);
  const newItems = generateHomeScheduleItems(newHome, options);

  const oldKeys = new Set(oldItems.map(itemKey));
  const newKeys = new Set(newItems.map(itemKey));
  const existingKeys = new Set(existingRoutines.map(itemKey));

  const toAdd = newItems.filter((item) => {
    const key = itemKey(item);
    return !oldKeys.has(key) && !existingKeys.has(key);
  });

  const removedKeys = new Set(
    [...oldKeys].filter((key) => !newKeys.has(key))
  );

  const toPause: PauseCandidate[] = [];
  for (const routine of existingRoutines) {
    const identityKey = itemKey(routine);
    if (!removedKeys.has(identityKey)) continue;
    if (
      !routine.source_plan_id ||
      !CATALOG_PLAN_IDS.has(routine.source_plan_id)
    ) {
      continue;
    }
    toPause.push({ ...routine, identityKey });
  }

  return { toAdd, toPause };
}
