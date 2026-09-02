export type HomeSeason = "spring" | "fall" | "off";

/** Northern meteorological spring: Mar–May (month 2–4). Southern: Sep–Nov. */
export function isSpringSeason(
  month: number,
  latitude?: number | null
): boolean {
  const southern = (latitude ?? 0) < 0;
  return southern ? month >= 8 && month <= 10 : month >= 2 && month <= 4;
}

/** Northern fall: Sep–Nov. Southern: Mar–May. */
export function isFallSeason(
  month: number,
  latitude?: number | null
): boolean {
  const southern = (latitude ?? 0) < 0;
  return southern ? month >= 2 && month <= 4 : month >= 8 && month <= 10;
}

export function getHomeSeason(
  month: number,
  latitude?: number | null
): HomeSeason {
  if (isSpringSeason(month, latitude)) return "spring";
  if (isFallSeason(month, latitude)) return "fall";
  return "off";
}

export function homeSeasonLabel(
  month: number,
  latitude?: number | null
): string {
  const season = getHomeSeason(month, latitude);
  if (season === "spring") return "Spring season";
  if (season === "fall") return "Cold-weather season";
  const southern = (latitude ?? 0) < 0;
  const isNorthernSummer = !southern && month >= 5 && month <= 7;
  const isSouthernSummer = southern && (month >= 11 || month <= 1);
  if (isNorthernSummer || isSouthernSummer) return "Warm season";
  return "Off-season";
}

/**
 * Growing / outdoor-active months: spring through early fall.
 * Northern: Mar–Oct. Southern: Sep–Apr.
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

/** In-season plan only — never starter or year-round safety. */
export function recommendInSeasonPlanId(
  month: number,
  latitude?: number | null
): "spring-refresh" | "cold-weather-prep" | null {
  const season = getHomeSeason(month, latitude);
  if (season === "spring") return "spring-refresh";
  if (season === "fall") return "cold-weather-prep";
  return null;
}
