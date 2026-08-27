import type { SpringRefreshAnswers } from "./springRefresh";
import type { ColdWeatherPrepAnswers } from "./fallWinter";
import type { NewHomeownerStarterAnswers } from "./newHomeownerStarter";
import type { PoolSpaAnswers } from "./poolSpa";

export type HomePropertyType = "house" | "condo_townhome";
export type HomeHeatSource =
  | "gas_furnace"
  | "heat_pump"
  | "electric"
  | "other";

/** Saved home equipment / structure answers used to prefill plan questionnaires. */
export interface HomeSystems {
  hasLawn?: boolean;
  propertyType?: HomePropertyType;
  heatSource?: HomeHeatSource;
  hasHeatPump?: boolean;
  hasAirExchanger?: boolean;
  hasWaterSoftener?: boolean;
  hasRefrigeratorWaterFilter?: boolean;
  hasVentHoodFilters?: boolean;
  hasSeptic?: boolean;
  hasPool?: boolean;
  hasSpa?: boolean;
  poolUsesSaltChlorination?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Coerce a DB jsonb value into a HomeSystems object. */
export function parseHomeSystems(value: unknown): HomeSystems {
  if (!isRecord(value)) return {};
  const next: HomeSystems = {};
  if (typeof value.hasLawn === "boolean") next.hasLawn = value.hasLawn;
  if (value.propertyType === "house" || value.propertyType === "condo_townhome") {
    next.propertyType = value.propertyType;
  }
  if (
    value.heatSource === "gas_furnace" ||
    value.heatSource === "heat_pump" ||
    value.heatSource === "electric" ||
    value.heatSource === "other"
  ) {
    next.heatSource = value.heatSource;
  }
  if (typeof value.hasHeatPump === "boolean") next.hasHeatPump = value.hasHeatPump;
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
    home.propertyType === undefined ||
    home.heatSource === undefined
  ) {
    return null;
  }
  return {
    hasLawn: home.hasLawn,
    propertyType: home.propertyType,
    heatSource: home.heatSource,
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
  const hasHeatPump =
    home.hasHeatPump ??
    (home.heatSource === "heat_pump" ? true : undefined);
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
  if (home.heatSource) partial.heatSource = home.heatSource;
  return Object.keys(partial).length > 0 ? partial : null;
}

export function partialStarterAnswers(
  home: HomeSystems | null | undefined
): Partial<NewHomeownerStarterAnswers> | null {
  if (!home) return null;
  const hasHeatPump =
    home.hasHeatPump ??
    (home.heatSource === "heat_pump" ? true : undefined);
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
  return mergeHomeSystems(home, {
    hasLawn: answers.hasLawn,
    propertyType: answers.propertyType,
    heatSource: answers.heatSource,
    ...(answers.heatSource === "heat_pump" ? { hasHeatPump: true } : {}),
  });
}

export function mergeFromStarterAnswers(
  home: HomeSystems | null | undefined,
  answers: NewHomeownerStarterAnswers
): HomeSystems {
  return mergeHomeSystems(home, {
    hasHeatPump: answers.hasHeatPump,
    hasAirExchanger: answers.hasAirExchanger,
    hasWaterSoftener: answers.hasWaterSoftener,
    hasRefrigeratorWaterFilter: answers.hasRefrigeratorWaterFilter,
    hasVentHoodFilters: answers.hasVentHoodFilters,
    hasSeptic: answers.hasSeptic,
    ...(answers.hasHeatPump && !home?.heatSource
      ? { heatSource: "heat_pump" as const }
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
