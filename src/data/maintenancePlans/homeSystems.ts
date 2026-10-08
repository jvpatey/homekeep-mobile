import type { SpringRefreshAnswers } from "./springRefresh";
import type { ColdWeatherPrepAnswers } from "./fallWinter";
import type { NewHomeownerStarterAnswers } from "./newHomeownerStarter";
import type { PoolSpaAnswers } from "./poolSpa";
import {
  type HomeHeatSource,
  canonicalizeHeatSource,
  isHeatPumpFamily,
  uniqueHeatSources,
} from "./heatSources";

export type { HomeHeatSource } from "./heatSources";
export {
  HOME_HEAT_SOURCE_OPTIONS,
  canonicalizeHeatSource,
  isHomeHeatSource,
  isHeatPumpFamily,
  uniqueHeatSources,
} from "./heatSources";

export type HomePropertyType = "house" | "condo_townhome";

/** All selected heat types, including legacy single `heatSource` + `hasHeatPump`. */
export function homeHeatSources(
  home: HomeSystems | null | undefined
): HomeHeatSource[] {
  if (!home) return [];
  const sources = uniqueHeatSources([
    ...(Array.isArray(home.heatSources) ? home.heatSources : []),
    ...(home.heatSource ? [home.heatSource] : []),
  ]);
  if (home.hasHeatPump && !sources.some(isHeatPumpFamily)) {
    sources.push("central_heat_pump");
  }
  return sources;
}

export function homeHasHeatPump(
  home: HomeSystems | null | undefined
): boolean | undefined {
  if (!home) return undefined;
  const sources = homeHeatSources(home);
  if (sources.some(isHeatPumpFamily)) return true;
  if (home.hasHeatPump === true) return true;
  if (home.hasHeatPump === false) return false;
  if (sources.length > 0) return false;
  return undefined;
}

/** Saved home equipment / structure answers used to prefill plan questionnaires. */
export interface HomeSystems {
  hasLawn?: boolean;
  propertyType?: HomePropertyType;
  /** Preferred / first selected source. Kept for older rows and plan questionnaires. */
  heatSource?: HomeHeatSource;
  /** All heat types in this home. */
  heatSources?: HomeHeatSource[];
  hasHeatPump?: boolean;
  hasAirExchanger?: boolean;
  hasWaterSoftener?: boolean;
  hasRefrigeratorWaterFilter?: boolean;
  hasVentHoodFilters?: boolean;
  hasSeptic?: boolean;
  hasPool?: boolean;
  hasSpa?: boolean;
  poolUsesSaltChlorination?: boolean;
  /** Optional; drives age-conditional tasks. Not required for completeness. */
  yearBuilt?: number;
  /** Optional features below are not required for completeness; unset means "no". */
  hasSumpPump?: boolean;
  hasWell?: boolean;
  fireplaceType?: FireplaceType;
  hasIrrigation?: boolean;
  hasGarageDoor?: boolean;
  hasGenerator?: boolean;
  hasSolar?: boolean;
  hasEvCharger?: boolean;
  hasDeck?: boolean;
}

export type FireplaceType = "none" | "wood" | "gas" | "electric";

export type HomeFeatureFlag =
  | "hasSumpPump"
  | "hasWell"
  | "hasIrrigation"
  | "hasGarageDoor"
  | "hasGenerator"
  | "hasSolar"
  | "hasEvCharger"
  | "hasDeck";

export const HOME_FEATURE_FLAGS: HomeFeatureFlag[] = [
  "hasSumpPump",
  "hasWell",
  "hasIrrigation",
  "hasGarageDoor",
  "hasGenerator",
  "hasSolar",
  "hasEvCharger",
  "hasDeck",
];

export const HOME_FEATURE_OPTIONS: { id: HomeFeatureFlag; label: string }[] = [
  { id: "hasSumpPump", label: "Sump pump" },
  { id: "hasWell", label: "Private well" },
  { id: "hasIrrigation", label: "Sprinkler / irrigation system" },
  { id: "hasGarageDoor", label: "Garage door opener" },
  { id: "hasGenerator", label: "Standby or portable generator" },
  { id: "hasSolar", label: "Solar panels" },
  { id: "hasEvCharger", label: "EV charger" },
  { id: "hasDeck", label: "Deck" },
];

export const FIREPLACE_TYPE_OPTIONS: {
  id: Exclude<FireplaceType, "none">;
  label: string;
}[] = [
  { id: "wood", label: "Wood-burning fireplace or stove" },
  { id: "gas", label: "Gas fireplace" },
  { id: "electric", label: "Electric fireplace" },
];

export const MIN_YEAR_BUILT = 1700;

export function isValidYearBuilt(
  value: unknown,
  now: Date = new Date()
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_YEAR_BUILT &&
    value <= now.getFullYear()
  );
}

/** Whole years since the home was built, or null when unknown. */
export function homeAgeYears(
  home: HomeSystems | null | undefined,
  now: Date = new Date()
): number | null {
  if (!home || !isValidYearBuilt(home.yearBuilt, now)) return null;
  return Math.max(0, now.getFullYear() - home.yearBuilt);
}

/** "Built 1962 · 64 years", or null when the year is unknown. */
export function formatHomeAge(
  home: HomeSystems | null | undefined,
  now: Date = new Date()
): string | null {
  const age = homeAgeYears(home, now);
  if (age === null || !home?.yearBuilt) return null;
  const ageLabel =
    age === 0 ? "new this year" : `${age} year${age === 1 ? "" : "s"}`;
  return `Built ${home.yearBuilt} · ${ageLabel}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** True when every field needed to generate a schedule has been answered. */
export function isHomeSystemsComplete(
  home: HomeSystems | null | undefined
): boolean {
  if (!home) return false;
  if (home.hasLawn === undefined) return false;
  if (!home.propertyType) return false;
  if (homeHeatSources(home).length === 0) return false;
  if (home.hasAirExchanger === undefined) return false;
  if (home.hasWaterSoftener === undefined) return false;
  if (home.hasRefrigeratorWaterFilter === undefined) return false;
  if (home.hasVentHoodFilters === undefined) return false;
  if (home.hasSeptic === undefined) return false;
  if (home.hasPool === undefined) return false;
  if (home.hasSpa === undefined) return false;
  if (home.hasPool && home.poolUsesSaltChlorination === undefined) {
    return false;
  }
  return true;
}

/** Coerce a DB jsonb value into a HomeSystems object. */
export function parseHomeSystems(value: unknown): HomeSystems {
  if (!isRecord(value)) return {};
  const next: HomeSystems = {};
  if (typeof value.hasLawn === "boolean") next.hasLawn = value.hasLawn;
  if (value.propertyType === "house" || value.propertyType === "condo_townhome") {
    next.propertyType = value.propertyType;
  }
  const parsedHeat = uniqueHeatSources([
    ...(Array.isArray(value.heatSources) ? value.heatSources : []),
    ...(canonicalizeHeatSource(value.heatSource)
      ? [value.heatSource]
      : []),
  ]);
  if (value.hasHeatPump === true && !parsedHeat.some(isHeatPumpFamily)) {
    parsedHeat.push("central_heat_pump");
  }
  if (parsedHeat.length > 0) {
    next.heatSources = parsedHeat;
    next.heatSource = parsedHeat[0];
  }
  if (typeof value.hasHeatPump === "boolean") {
    next.hasHeatPump = value.hasHeatPump;
  } else if (parsedHeat.some(isHeatPumpFamily)) {
    next.hasHeatPump = true;
  }
  if (typeof value.hasAirExchanger === "boolean") {
    next.hasAirExchanger = value.hasAirExchanger;
  }
  if (typeof value.hasWaterSoftener === "boolean") {
    next.hasWaterSoftener = value.hasWaterSoftener;
  }
  if (typeof value.hasRefrigeratorWaterFilter === "boolean") {
    next.hasRefrigeratorWaterFilter = value.hasRefrigeratorWaterFilter;
  }
  if (typeof value.hasVentHoodFilters === "boolean") {
    next.hasVentHoodFilters = value.hasVentHoodFilters;
  }
  if (typeof value.hasSeptic === "boolean") next.hasSeptic = value.hasSeptic;
  if (typeof value.hasPool === "boolean") next.hasPool = value.hasPool;
  if (typeof value.hasSpa === "boolean") next.hasSpa = value.hasSpa;
  if (typeof value.poolUsesSaltChlorination === "boolean") {
    next.poolUsesSaltChlorination = value.poolUsesSaltChlorination;
  }
  if (isValidYearBuilt(value.yearBuilt)) next.yearBuilt = value.yearBuilt;
  for (const flag of HOME_FEATURE_FLAGS) {
    const raw = value[flag];
    if (typeof raw === "boolean") next[flag] = raw;
  }
  if (
    value.fireplaceType === "none" ||
    value.fireplaceType === "wood" ||
    value.fireplaceType === "gas" ||
    value.fireplaceType === "electric"
  ) {
    next.fireplaceType = value.fireplaceType;
  }
  return next;
}

export function mergeHomeSystems(
  base: HomeSystems | null | undefined,
  patch: HomeSystems
): HomeSystems {
  return { ...(base ?? {}), ...patch };
}

export function toSpringAnswers(
  home: HomeSystems | null | undefined
): SpringRefreshAnswers | null {
  if (
    !home ||
    home.hasLawn === undefined ||
    home.propertyType === undefined
  ) {
    return null;
  }
  const sources = homeHeatSources(home);
  if (sources.length === 0) return null;
  return {
    hasLawn: home.hasLawn,
    propertyType: home.propertyType,
    heatSource: sources[0],
    heatSources: sources,
    hasIrrigation: home.hasIrrigation === true,
  };
}

export function toColdWeatherAnswers(
  home: HomeSystems | null | undefined
): ColdWeatherPrepAnswers | null {
  return toSpringAnswers(home);
}

export function toStarterAnswers(
  home: HomeSystems | null | undefined
): NewHomeownerStarterAnswers | null {
  if (!home) return null;
  const hasHeatPump = homeHasHeatPump(home);
  if (
    hasHeatPump === undefined ||
    home.hasAirExchanger === undefined ||
    home.hasWaterSoftener === undefined ||
    home.hasRefrigeratorWaterFilter === undefined ||
    home.hasVentHoodFilters === undefined ||
    home.hasSeptic === undefined
  ) {
    return null;
  }
  return {
    hasHeatPump,
    hasAirExchanger: home.hasAirExchanger,
    hasWaterSoftener: home.hasWaterSoftener,
    hasRefrigeratorWaterFilter: home.hasRefrigeratorWaterFilter,
    hasVentHoodFilters: home.hasVentHoodFilters,
    hasSeptic: home.hasSeptic,
  };
}

export function toPoolSpaAnswers(
  home: HomeSystems | null | undefined
): PoolSpaAnswers | null {
  if (!home || home.hasPool === undefined || home.hasSpa === undefined) {
    return null;
  }
  if (home.hasPool && home.poolUsesSaltChlorination === undefined) {
    return null;
  }
  return {
    hasPool: home.hasPool,
    hasSpa: home.hasSpa,
    poolUsesSaltChlorination: home.hasPool
      ? Boolean(home.poolUsesSaltChlorination)
      : false,
  };
}

export function partialSpringAnswers(
  home: HomeSystems | null | undefined
): Partial<SpringRefreshAnswers> | null {
  if (!home) return null;
  const partial: Partial<SpringRefreshAnswers> = {};
  if (home.hasLawn !== undefined) partial.hasLawn = home.hasLawn;
  if (home.propertyType) partial.propertyType = home.propertyType;
  const sources = homeHeatSources(home);
  if (sources.length > 0) {
    partial.heatSource = sources[0];
    partial.heatSources = sources;
  }
  return Object.keys(partial).length > 0 ? partial : null;
}

export function partialStarterAnswers(
  home: HomeSystems | null | undefined
): Partial<NewHomeownerStarterAnswers> | null {
  if (!home) return null;
  const hasHeatPump = homeHasHeatPump(home);
  const partial: Partial<NewHomeownerStarterAnswers> = {};
  if (hasHeatPump !== undefined) partial.hasHeatPump = hasHeatPump;
  if (home.hasAirExchanger !== undefined) {
    partial.hasAirExchanger = home.hasAirExchanger;
  }
  if (home.hasWaterSoftener !== undefined) {
    partial.hasWaterSoftener = home.hasWaterSoftener;
  }
  if (home.hasRefrigeratorWaterFilter !== undefined) {
    partial.hasRefrigeratorWaterFilter = home.hasRefrigeratorWaterFilter;
  }
  if (home.hasVentHoodFilters !== undefined) {
    partial.hasVentHoodFilters = home.hasVentHoodFilters;
  }
  if (home.hasSeptic !== undefined) partial.hasSeptic = home.hasSeptic;
  return Object.keys(partial).length > 0 ? partial : null;
}

export function partialPoolSpaAnswers(
  home: HomeSystems | null | undefined
): Partial<PoolSpaAnswers> | null {
  if (!home) return null;
  const partial: Partial<PoolSpaAnswers> = {};
  if (home.hasPool !== undefined) partial.hasPool = home.hasPool;
  if (home.hasSpa !== undefined) partial.hasSpa = home.hasSpa;
  if (home.poolUsesSaltChlorination !== undefined) {
    partial.poolUsesSaltChlorination = home.poolUsesSaltChlorination;
  }
  return Object.keys(partial).length > 0 ? partial : null;
}

export function mergeFromSpringAnswers(
  home: HomeSystems | null | undefined,
  answers: SpringRefreshAnswers | ColdWeatherPrepAnswers
): HomeSystems {
  const sources = uniqueHeatSources(
    answers.heatSources?.length ? answers.heatSources : [answers.heatSource]
  );
  return mergeHomeSystems(home, {
    hasLawn: answers.hasLawn,
    propertyType: answers.propertyType,
    heatSource: sources[0],
    heatSources: sources,
    hasHeatPump: sources.some(isHeatPumpFamily),
  });
}

export function mergeFromStarterAnswers(
  home: HomeSystems | null | undefined,
  answers: NewHomeownerStarterAnswers
): HomeSystems {
  const sources = homeHeatSources(home);
  const nextSources = answers.hasHeatPump
    ? uniqueHeatSources([...sources, "central_heat_pump"])
    : sources.filter((source) => !isHeatPumpFamily(source));
  return mergeHomeSystems(home, {
    hasHeatPump: answers.hasHeatPump,
    hasAirExchanger: answers.hasAirExchanger,
    hasWaterSoftener: answers.hasWaterSoftener,
    hasRefrigeratorWaterFilter: answers.hasRefrigeratorWaterFilter,
    hasVentHoodFilters: answers.hasVentHoodFilters,
    hasSeptic: answers.hasSeptic,
    ...(nextSources.length > 0
      ? { heatSource: nextSources[0], heatSources: nextSources }
      : answers.hasHeatPump
        ? {
            heatSource: "central_heat_pump" as const,
            heatSources: ["central_heat_pump"],
          }
        : {}),
  });
}

export function mergeFromPoolSpaAnswers(
  home: HomeSystems | null | undefined,
  answers: PoolSpaAnswers
): HomeSystems {
  return mergeHomeSystems(home, {
    hasPool: answers.hasPool,
    hasSpa: answers.hasSpa,
    poolUsesSaltChlorination: answers.hasPool
      ? answers.poolUsesSaltChlorination
      : false,
  });
}

export function answersForPlan(
  planId: string,
  home: HomeSystems | null | undefined
):
  | { kind: "spring"; answers: SpringRefreshAnswers }
  | { kind: "cold"; answers: ColdWeatherPrepAnswers }
  | { kind: "starter"; answers: NewHomeownerStarterAnswers }
  | { kind: "pool"; answers: PoolSpaAnswers }
  | null {
  if (planId === "spring-refresh") {
    const answers = toSpringAnswers(home);
    return answers ? { kind: "spring", answers } : null;
  }
  if (planId === "cold-weather-prep") {
    const answers = toColdWeatherAnswers(home);
    return answers ? { kind: "cold", answers } : null;
  }
  if (planId === "new-homeowner-starter") {
    const answers = toStarterAnswers(home);
    return answers ? { kind: "starter", answers } : null;
  }
  if (planId === "pool-spa-care") {
    const answers = toPoolSpaAnswers(home);
    return answers ? { kind: "pool", answers } : null;
  }
  return null;
}
