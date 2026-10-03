/**
 * Seasonal visibility for outdoor maintenance tasks.
 * Keep in sync with src/utils/seasonalTasks.ts + src/utils/homeSeason.ts.
 */

export function isGrowingSeason(
  month: number,
  latitude?: number | null
): boolean {
  const southern = (latitude ?? 0) < 0;
  if (southern) {
    return month >= 8 || month <= 3;
  }
  return month >= 2 && month <= 9;
}

/** Hide frequent outdoor jobs when they are out of season. */
export function isTaskInSeason(input: {
  category: string;
  interval_days: number;
  source_plan_id?: string | null;
  month: number;
  latitude?: number | null;
}): boolean {
  const growing = isGrowingSeason(input.month, input.latitude);
  if (
    input.category === "LANDSCAPING" &&
    input.interval_days <= 90 &&
    !growing
  ) {
    return false;
  }
  if (
    input.source_plan_id === "pool-spa-care" &&
    input.interval_days <= 30 &&
    !growing
  ) {
    return false;
  }
  return true;
}
