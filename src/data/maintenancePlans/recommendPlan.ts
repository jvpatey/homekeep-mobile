import { recommendInSeasonPlanId } from "../../utils/homeSeason";
import type { HomeSystems } from "./homeSystems";
import {
  POOL_SPA_PLAN_ID,
  SAFETY_PLAN_ID,
  STARTER_PLAN_ID,
} from "./planCatalog";

export function recommendMaintenancePlanId({
  month,
  latitude,
  activeRoutineCount,
  homeSetupComplete = false,
  appliedPlanIds,
  homeSystems,
}: {
  /** 0–11, same as Date#getMonth */
  month: number;
  latitude?: number | null;
  activeRoutineCount: number;
  homeSetupComplete?: boolean;
  appliedPlanIds?: Iterable<string>;
  homeSystems?: HomeSystems | null;
}): string {
  const applied = toIdSet(appliedPlanIds);
  const inSeason = recommendInSeasonPlanId(month, latitude);

  if (activeRoutineCount === 0) {
    if (!homeSetupComplete) return STARTER_PLAN_ID;
    return inSeason ?? SAFETY_PLAN_ID;
  }

  if (inSeason && !applied.has(inSeason)) {
    return inSeason;
  }

  if (
    (homeSystems?.hasPool || homeSystems?.hasSpa) &&
    !applied.has(POOL_SPA_PLAN_ID)
  ) {
    return POOL_SPA_PLAN_ID;
  }

  return SAFETY_PLAN_ID;
}

function toIdSet(ids?: Iterable<string>): Set<string> {
  if (!ids) return new Set();
  return ids instanceof Set ? ids : new Set(ids);
}
