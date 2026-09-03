import { MaintenancePlanItemTemplate } from "./types";

/** Answers before filtering pool vs spa vs salt-specific rows. */
export interface PoolSpaAnswers {
  hasPool: boolean;
  hasSpa: boolean;
  /** Salt chlorinator / saltwater pool — only relevant when {@link hasPool} is true. */
  poolUsesSaltChlorination: boolean;
}

type PoolSpaItemDefinition = MaintenancePlanItemTemplate & {
  key: string;
  requiresPool?: boolean;
  requiresSpa?: boolean;
  /** Pool tasks that only apply with a salt chlorinator. */
  requiresSaltChlorination?: boolean;
};

const POOL_SPA_CATALOG: PoolSpaItemDefinition[] = [
  {
    key: "pool_water_test",
    requiresPool: true,
    title: "Test pool water & balance chemistry",
    description:
      "Check sanitizer, pH, and alkalinity per your kit or strips; adjust before swimmers use the pool.",
    category: "GENERAL",
    priority: "high",
    estimated_duration_minutes: 20,
    interval_days: 7,
    start_offset_days: 0,
  },
  {
    key: "pool_skim",
    requiresPool: true,
    title: "Skim pool surface & empty skimmer baskets",
    description:
      "Clear leaves and debris before they sink; keeps circulation strong and chlorine working.",
    category: "GENERAL",
    priority: "medium",
    estimated_duration_minutes: 15,
    interval_days: 7,
    start_offset_days: 1,
  },
  {
    key: "pool_brush_vac",
    requiresPool: true,
    title: "Brush pool surfaces & vacuum",
    description:
      "Brush walls and floor toward the main drain weekly; vacuum or run the cleaner so algae cannot take hold.",
    category: "GENERAL",
    priority: "medium",
    estimated_duration_minutes: 45,
    interval_days: 7,
    start_offset_days: 2,
  },
  {
    key: "pool_shock",
    requiresPool: true,
    title: "Shock or oxidize pool water",
    description:
      "Follow test results—often weekly in peak season or after storms and heavy use—to knock down chloramines and organic load.",
    category: "GENERAL",
    priority: "medium",
    estimated_duration_minutes: 25,
    interval_days: 14,
    start_offset_days: 3,
  },
  {
    key: "pool_filter_service",
    requiresPool: true,
    title: "Clean or backwash pool filter",
    description:
      "Cartridge: rinse or soak per pressure gauge; sand/DE: backwash when pressure rises per manufacturer.",
    category: "GENERAL",
    priority: "medium",
    estimated_duration_minutes: 35,
    interval_days: 30,
    start_offset_days: 4,
  },
  {
    key: "pool_pump_inspect",
    requiresPool: true,
    title: "Inspect pool pump & strainer basket",
    description:
      "Clear the pump basket monthly, listen for unusual noise, and check for leaks at seals and unions.",
    category: "PLUMBING",
    priority: "medium",
    estimated_duration_minutes: 20,
    interval_days: 30,
    start_offset_days: 5,
  },
  {
    key: "salt_cell_clean",
    requiresPool: true,
    requiresSaltChlorination: true,
    title: "Clean salt chlorinator cell",
    description:
      "Inspect calcium buildup on the cell plates; acid-wash only when the manual says it is time—too often shortens cell life.",
    category: "GENERAL",
    priority: "medium",
    estimated_duration_minutes: 35,
    interval_days: 90,
    start_offset_days: 6,
  },
  {
    key: "pool_opening",
    requiresPool: true,
    title: "Open pool for swim season",
    description:
      "Remove cover safely, start circulation, balance water, and bring sanitizer to range before swimming.",
    category: "GENERAL",
    priority: "high",
    estimated_duration_minutes: 120,
    interval_days: 365,
    start_offset_days: 7,
  },
  {
    key: "pool_closing",
    requiresPool: true,
    title: "Close & winterize pool",
    description:
      "Lower water if required in your climate, blow lines or add antifreeze per local practice, winter chemicals, and secure the cover.",
    category: "GENERAL",
    priority: "high",
    estimated_duration_minutes: 180,
    interval_days: 365,
    start_offset_days: 10,
  },
  {
    key: "spa_water_test",
    requiresSpa: true,
    title: "Test hot tub water & maintain sanitizer",
    description:
      "Spas run hot—sanitizer demand is high. Check pH and sanitizer before each heavy-use weekend if possible.",
    category: "GENERAL",
    priority: "high",
    estimated_duration_minutes: 15,
    interval_days: 7,
    start_offset_days: 8,
  },
  {
    key: "spa_filters",
    requiresSpa: true,
    title: "Clean spa filters",
    description:
      "Rinse cartridges often; deep clean or replace when flow drops or after heavy bather load.",
    category: "APPLIANCES",
    priority: "medium",
    estimated_duration_minutes: 25,
    interval_days: 30,
    start_offset_days: 12,
  },
  {
    key: "spa_drain_refill",
    requiresSpa: true,
    title: "Drain & refill spa",
    description:
      "Typical guidance is every three to four months for residential spas—sooner with frequent use or cloudy water.",
    category: "PLUMBING",
    priority: "medium",
    estimated_duration_minutes: 90,
    interval_days: 90,
    start_offset_days: 14,
  },
  {
    key: "spa_cover_inspect",
    requiresSpa: true,
    title: "Inspect spa cover & straps",
    description:
      "Look for waterlogging, tears, and worn clips—heat escape drives up energy bills and strains the heater.",
    category: "GENERAL",
    priority: "low",
    estimated_duration_minutes: 15,
    interval_days: 90,
    start_offset_days: 16,
  },
];

function toTemplate(row: PoolSpaItemDefinition): MaintenancePlanItemTemplate {
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

export const POOL_SPA_BASE_TASK_CAP = POOL_SPA_CATALOG.length;

export function filterPoolSpaItems(
  answers: PoolSpaAnswers
): MaintenancePlanItemTemplate[] {
  const out: MaintenancePlanItemTemplate[] = [];

  for (const row of POOL_SPA_CATALOG) {
    if (row.requiresPool && !answers.hasPool) continue;
    if (row.requiresSpa && !answers.hasSpa) continue;
    if (
      row.requiresSaltChlorination &&
      (!answers.hasPool || !answers.poolUsesSaltChlorination)
    ) {
      continue;
    }
    out.push(toTemplate(row));
  }

  return out;
}

/** Full catalog (unfiltered); filtering runs in {@link filterPoolSpaItems}. */
export function getPoolSpaBaseItems(): MaintenancePlanItemTemplate[] {
  return POOL_SPA_CATALOG.map(toTemplate);
}
