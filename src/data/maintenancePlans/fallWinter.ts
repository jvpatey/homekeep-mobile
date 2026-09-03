import { MaintenancePlanItemTemplate } from "./types";
import { type HomeHeatSource, uniqueHeatSources } from "./heatSources";
import { heatItemsForSeason } from "./heatMaintenance";

/** Same dimensions as spring questionnaire — lawn, exterior responsibility, heating type. */
export interface ColdWeatherPrepAnswers {
  hasLawn: boolean;
  propertyType: "house" | "condo_townhome";
  heatSource: HomeHeatSource;
  /** When set, tasks are included for every selected source. */
  heatSources?: HomeHeatSource[];
}

type FallItemDefinition = MaintenancePlanItemTemplate & {
  key: string;
  requiresLawn?: boolean;
  requiresHouseExterior?: boolean;
};

const COLD_WEATHER_PREP_CATALOG: FallItemDefinition[] = [
  {
    key: "clear_leaves_lawn",
    requiresLawn: true,
    title: "Clear leaves & lawn debris",
    description:
      "Rake or mulch leaves from turf and beds before snow — reduces mold and dead patches.",
    category: "LANDSCAPING",
    priority: "medium",
    estimated_duration_minutes: 90,
    interval_days: 365,
    start_offset_days: 0,
  },
  {
    key: "late_fall_fertilize",
    requiresLawn: true,
    title: "Late fall lawn fertilize",
    description:
      "Winterizer feed where appropriate for your grass type and climate.",
    category: "LANDSCAPING",
    priority: "medium",
    estimated_duration_minutes: 45,
    interval_days: 365,
    start_offset_days: 1,
  },
  {
    key: "gutters_fall",
    requiresHouseExterior: true,
    title: "Clean gutters & downspouts",
    description:
      "Clear gutters and downspouts after trees shed so winter melt drains properly. Typical cadence is twice a year (late spring and after leaf drop).",
    category: "EXTERIOR",
    priority: "high",
    estimated_duration_minutes: 90,
    interval_days: 180,
    start_offset_days: 2,
  },
  {
    key: "roof_winter",
    requiresHouseExterior: true,
    title: "Inspect roof and flashing",
    description:
      "Look for damaged shingles, flashing, or leaks before snow and ice load. Typical cadence is twice a year (spring and fall).",
    category: "EXTERIOR",
    priority: "high",
    estimated_duration_minutes: 45,
    interval_days: 180,
    start_offset_days: 3,
  },
  {
    key: "weatherstrip",
    title: "Seal or weatherstrip doors & windows",
    description:
      "Reduce drafts and condensation before sustained cold.",
    category: "INTERIOR",
    priority: "medium",
    estimated_duration_minutes: 90,
    interval_days: 365,
    start_offset_days: 4,
  },
  {
    key: "winterize_faucets",
    requiresHouseExterior: true,
    title: "Winterize outdoor faucets",
    description:
      "Shut off interior valves if present; drain lines that serve hose bibs.",
    category: "PLUMBING",
    priority: "high",
    estimated_duration_minutes: 45,
    interval_days: 365,
    start_offset_days: 5,
  },
  {
    key: "store_hoses",
    requiresHouseExterior: true,
    title: "Drain & store garden hoses",
    description:
      "Drain, coil, and store hoses so they don’t freeze and crack.",
    category: "EXTERIOR",
    priority: "medium",
    estimated_duration_minutes: 30,
    interval_days: 365,
    start_offset_days: 6,
  },
  {
    key: "store_outdoor_furniture",
    title: "Store outdoor furniture",
    description:
      "Clean and move cushions, umbrellas, and patio sets to shelter before freeze and snow.",
    category: "EXTERIOR",
    priority: "medium",
    estimated_duration_minutes: 60,
    interval_days: 365,
    start_offset_days: 7,
  },
];

function toTemplate(row: FallItemDefinition): MaintenancePlanItemTemplate {
  return {
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    estimated_duration_minutes: row.estimated_duration_minutes,
    interval_days: row.interval_days,
    start_offset_days: row.start_offset_days,
  };
}

export const COLD_WEATHER_PREP_BASE_TASK_CAP = COLD_WEATHER_PREP_CATALOG.length;

export function filterColdWeatherPrepItems(
  answers: ColdWeatherPrepAnswers
): MaintenancePlanItemTemplate[] {
  const out: MaintenancePlanItemTemplate[] = [];

  for (const row of COLD_WEATHER_PREP_CATALOG) {
    if (row.requiresLawn && !answers.hasLawn) continue;
    if (row.requiresHouseExterior && answers.propertyType !== "house") {
      continue;
    }
    out.push(toTemplate(row));
  }

  const heatSources = uniqueHeatSources(
    answers.heatSources?.length ? answers.heatSources : [answers.heatSource]
  );
  out.push(...heatItemsForSeason(heatSources, "fall"));

  return out;
}

export function getColdWeatherPrepBaseItems(): MaintenancePlanItemTemplate[] {
  return COLD_WEATHER_PREP_CATALOG.map(toTemplate);
}
