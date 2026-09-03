import { MaintenancePlanItemTemplate } from "./types";
import {
  HomeHeatSource,
  heatSourcesInclude,
} from "./heatSources";

const CENTRAL_HP_FILTERS: MaintenancePlanItemTemplate = {
  title: "Clean heat pump filters",
  description:
    "Wash or replace air-handler filters—typically every 1–3 months, more often with pets or heavy use.",
  category: "HVAC",
  priority: "medium",
  estimated_duration_minutes: 25,
  interval_days: 90,
  start_offset_days: 8,
};

const CENTRAL_HP_PRO: MaintenancePlanItemTemplate = {
  title: "Professional heat pump inspection",
  description:
    "Annual technician visit for coils, refrigerant, defrost, and safe operation.",
  category: "HVAC",
  priority: "high",
  estimated_duration_minutes: 120,
  interval_days: 365,
  start_offset_days: 9,
};

const MINI_SPLIT_FILTERS: MaintenancePlanItemTemplate = {
    title: "Clean mini-split indoor filters",
  description:
    "Pop off each head’s filter and rinse every 2–4 weeks in heavy use so coils stay efficient.",
  category: "HVAC",
  priority: "medium",
  estimated_duration_minutes: 20,
  interval_days: 30,
  start_offset_days: 8,
};

const MINI_SPLIT_PRO: MaintenancePlanItemTemplate = {
  title: "Professional mini-split service",
  description:
    "Yearly clean of indoor coils, drain lines, and outdoor units so heads do not freeze or drip.",
  category: "HVAC",
  priority: "high",
  estimated_duration_minutes: 90,
  interval_days: 365,
  start_offset_days: 9,
};

const GEO_FILTER: MaintenancePlanItemTemplate = {
  title: "Replace geothermal air-handler filter",
  description:
    "Ground-source systems still move air through a filter — swap on the manufacturer’s cadence.",
  category: "HVAC",
  priority: "medium",
  estimated_duration_minutes: 15,
  interval_days: 90,
  start_offset_days: 8,
};

const GEO_PRO: MaintenancePlanItemTemplate = {
  title: "Professional geothermal inspection",
  description:
    "Annual check of the loop, circulating pumps, and air handler — less outdoor-coil work than air-source.",
  category: "HVAC",
  priority: "high",
  estimated_duration_minutes: 90,
  interval_days: 365,
  start_offset_days: 9,
};

const GAS_FILTER_SPRING: MaintenancePlanItemTemplate = {
  title: "Replace HVAC filter",
  description:
    "Swap the furnace or air-handler filter every 1–3 months so airflow stays clean.",
  category: "HVAC",
  priority: "medium",
  estimated_duration_minutes: 15,
  interval_days: 90,
  start_offset_days: 10,
};

const GAS_TUNE_FALL: MaintenancePlanItemTemplate = {
  title: "Natural gas furnace tune-up",
  description:
    "Professional inspection: heat exchanger, ignition, flame, and CO safety before daily heat.",
  category: "HVAC",
  priority: "high",
  estimated_duration_minutes: 120,
  interval_days: 365,
  start_offset_days: 10,
};

const OIL_SERVICE: MaintenancePlanItemTemplate = {
  title: "Oil furnace or boiler service",
  description:
    "Annual clean and tune — nozzle, filter, combustion, and tank fittings — before heating season.",
  category: "HVAC",
  priority: "high",
  estimated_duration_minutes: 120,
  interval_days: 365,
  start_offset_days: 10,
};

const PROPANE_TUNE: MaintenancePlanItemTemplate = {
  title: "Propane furnace tune-up",
  description:
    "Yearly inspection of burners, heat exchanger, and connections before you rely on heat daily.",
  category: "HVAC",
  priority: "high",
  estimated_duration_minutes: 120,
  interval_days: 365,
  start_offset_days: 10,
};

const WOOD_CHIMNEY: MaintenancePlanItemTemplate = {
  title: "Inspect chimney and wood or pellet stove",
  description:
    "Creosote and blocked flues are a fire risk. Sweep or inspect before the burn season.",
  category: "SAFETY",
  priority: "high",
  estimated_duration_minutes: 60,
  interval_days: 365,
  start_offset_days: 11,
};

const WOOD_ASH: MaintenancePlanItemTemplate = {
  title: "Empty wood or pellet stove ash",
  description:
    "Clear cooled ash so airflow stays clean. More often in heavy use.",
  category: "HVAC",
  priority: "medium",
  estimated_duration_minutes: 20,
  interval_days: 30,
  start_offset_days: 12,
};

function pushUnique(
  out: MaintenancePlanItemTemplate[],
  item: MaintenancePlanItemTemplate
) {
  if (out.some((row) => row.title === item.title)) return;
  out.push({ ...item });
}

/** Seasonal HVAC extras for every selected heat type. */
export function heatItemsForSeason(
  sources: readonly HomeHeatSource[],
  season: "spring" | "fall"
): MaintenancePlanItemTemplate[] {
  const out: MaintenancePlanItemTemplate[] = [];

  if (heatSourcesInclude(sources, "central_heat_pump")) {
    pushUnique(out, CENTRAL_HP_FILTERS);
    pushUnique(out, CENTRAL_HP_PRO);
  }
  if (heatSourcesInclude(sources, "mini_split")) {
    pushUnique(out, MINI_SPLIT_FILTERS);
    pushUnique(out, MINI_SPLIT_PRO);
  }
  if (heatSourcesInclude(sources, "geothermal")) {
    pushUnique(out, GEO_FILTER);
    pushUnique(out, GEO_PRO);
  }
  if (heatSourcesInclude(sources, "gas_furnace")) {
    pushUnique(out, GAS_FILTER_SPRING);
    pushUnique(out, GAS_TUNE_FALL);
  }
  if (heatSourcesInclude(sources, "oil")) {
    pushUnique(out, OIL_SERVICE);
  }
  if (heatSourcesInclude(sources, "propane")) {
    pushUnique(out, PROPANE_TUNE);
  }
  if (heatSourcesInclude(sources, "wood_pellet")) {
    pushUnique(out, WOOD_CHIMNEY);
    if (season === "fall") pushUnique(out, WOOD_ASH);
  }

  return out;
}
