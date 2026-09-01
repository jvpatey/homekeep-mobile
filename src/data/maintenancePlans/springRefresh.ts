import { MaintenancePlanItemTemplate } from "./types";
import { type HomeHeatSource, uniqueHeatSources } from "./heatSources";
import { heatItemsForSeason } from "./heatMaintenance";

/** Answers collected before showing the tailored Spring refresh checklist. */
export interface SpringRefreshAnswers {
  hasLawn: boolean;
  /** House: you typically maintain your own roof, gutters, and yard. Condo/townhome: shared or HOA-managed exterior. */
  propertyType: "house" | "condo_townhome";
  heatSource: HomeHeatSource;
  /** When set, tasks are included for every selected source. */
  heatSources?: HomeHeatSource[];
}

type SpringItemDefinition = MaintenancePlanItemTemplate & {
  key: string;
  /** Include only when the user has a lawn. */
  requiresLawn?: boolean;
  /** Roof, gutters — include when user lives in a house they maintain (not typical condo/townhome). */
  requiresHouseExterior?: boolean;
};

/**
 * Full Spring refresh catalog (your checklist). Filtering happens in
 * {@link filterSpringRefreshItems}.
 */
const SPRING_REFRESH_CATALOG: SpringItemDefinition[] = [
  {
    key: "lawn_debris",
    requiresLawn: true,
    title: "Clean up lawn debris",
    description:
      "Remove leaves, sticks, and winter debris from yard and beds.",
    category: "LANDSCAPING",
    priority: "medium",
    estimated_duration_minutes: 60,
    interval_days: 365,
    start_offset_days: 0,
  },
  {
    key: "mow_lawn",
    requiresLawn: true,
    title: "Mow lawn",
    description: "Cut grass regularly during active growth.",
    category: "LANDSCAPING",
    priority: "medium",
    estimated_duration_minutes: 45,
    interval_days: 7,
    start_offset_days: 1,
  },
  {
    key: "fertilize_lawn",
    requiresLawn: true,
    title: "Fertilize lawn",
    description:
      "Apply fertilizer during active growth for healthy turf.",
    category: "LANDSCAPING",
    priority: "medium",
    estimated_duration_minutes: 45,
    interval_days: 60,
    start_offset_days: 2,
  },
  {
    key: "seed_bare_spots",
    requiresLawn: true,
    title: "Seed bare spots",
    description: "Fill in thin or patchy areas with grass seed.",
    category: "LANDSCAPING",
    priority: "low",
    estimated_duration_minutes: 45,
    interval_days: 365,
    start_offset_days: 3,
  },
  {
    key: "lime_lawn",
    requiresLawn: true,
    title: "Lime lawn",
    description: "Apply lime if soil needs pH correction.",
    category: "LANDSCAPING",
    priority: "low",
    estimated_duration_minutes: 40,
    interval_days: 365,
    start_offset_days: 4,
  },
  {
    key: "patio_deck",
    title: "Clean patio / deck",
    description:
      "Sweep and wash outdoor surfaces after winter.",
    category: "EXTERIOR",
    priority: "medium",
    estimated_duration_minutes: 60,
    interval_days: 365,
    start_offset_days: 5,
  },
  {
    key: "roof_flashing",
    requiresHouseExterior: true,
    title: "Inspect roof and flashing",
    description:
      "Check for loose shingles, cracks, and leaks.",
    category: "EXTERIOR",
    priority: "high",
    estimated_duration_minutes: 45,
    interval_days: 365,
    start_offset_days: 6,
  },
  {
    key: "gutters",
    requiresHouseExterior: true,
    title: "Clean gutters & downspouts",
    description:
      "Remove debris so water drains properly.",
    category: "EXTERIOR",
    priority: "high",
    estimated_duration_minutes: 90,
    interval_days: 180,
    start_offset_days: 7,
  },
];

function toTemplate(row: SpringItemDefinition): MaintenancePlanItemTemplate {
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

/** Maximum base tasks (lawn + house exterior tasks) before heat-based extras. */
export const SPRING_REFRESH_BASE_TASK_CAP = SPRING_REFRESH_CATALOG.length;

/**
 * Builds the tailored task list for Spring refresh from questionnaire answers.
 */
export function filterSpringRefreshItems(
  answers: SpringRefreshAnswers
): MaintenancePlanItemTemplate[] {
  const out: MaintenancePlanItemTemplate[] = [];

  for (const row of SPRING_REFRESH_CATALOG) {
    if (row.requiresLawn && !answers.hasLawn) continue;
    if (row.requiresHouseExterior && answers.propertyType !== "house") {
      continue;
    }
    out.push(toTemplate(row));
  }

  const heatSources = uniqueHeatSources(
    answers.heatSources?.length ? answers.heatSources : [answers.heatSource]
  );
  out.push(...heatItemsForSeason(heatSources, "spring"));

  return out;
}

/** All base items (unfiltered) — used only for plan metadata / copy. */
export function getSpringRefreshBaseItems(): MaintenancePlanItemTemplate[] {
  return SPRING_REFRESH_CATALOG.map(toTemplate);
}
