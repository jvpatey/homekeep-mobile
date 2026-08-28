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

  const southern = (latitude ?? 0) < 0;
  const isSpring = southern
    ? month >= 8 && month <= 10
    : month >= 2 && month <= 4;
  const isFall = southern
    ? month >= 2 && month <= 4
    : month >= 8 && month <= 10;

  if (isSpring) return "spring-refresh";
  if (isFall) return "cold-weather-prep";
  return "year-round-safety";
}
