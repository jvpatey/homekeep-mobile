import { recommendInSeasonPlanId } from "../../utils/homeSeason";

export function recommendMaintenancePlanId({
  month,
  latitude,
  activeRoutineCount,
}: {
  /** 0–11, same as Date#getMonth */
  month: number;
  latitude?: number | null;
  activeRoutineCount: number;
}): string {
  if (activeRoutineCount === 0) {
    return "new-homeowner-starter";
  }

  return recommendInSeasonPlanId(month, latitude) ?? "year-round-safety";
}
