import { MaintenancePlanItemTemplate } from "./types";

type SafetyItemDefinition = MaintenancePlanItemTemplate & {
  key: string;
};

const YEAR_ROUND_SAFETY_CATALOG: SafetyItemDefinition[] = [
  {
    key: "smoke_co",
    title: "Test smoke & CO alarms",
    description:
      "Press test buttons monthly (NFPA). Replace batteries or units per manufacturer.",
    category: "SAFETY",
    priority: "high",
    estimated_duration_minutes: 20,
    interval_days: 30,
    start_offset_days: 0,
  },
  {
    key: "extinguisher",
    title: "Check fire extinguisher(s)",
    description:
      "Monthly visual check: gauge in the green zone, pin intact, accessible mount, not expired.",
    category: "SAFETY",
    priority: "medium",
    estimated_duration_minutes: 15,
    interval_days: 30,
    start_offset_days: 3,
  },
  {
    key: "hvac_space_clear",
    title: "Keep HVAC indoor space clear",
    description:
      "No storage against furnace, air handler, or heat pump closet—maintain airflow and reduce fire risk from paints, paper, or clutter.",
    category: "SAFETY",
    priority: "medium",
    estimated_duration_minutes: 15,
    interval_days: 365,
    start_offset_days: 7,
  },
  {
    key: "dryer_vent",
    title: "Clean dryer vent duct",
    description:
      "Lint buildup is a common fire risk; deep clean per run length.",
    category: "SAFETY",
    priority: "high",
    estimated_duration_minutes: 60,
    interval_days: 365,
    start_offset_days: 10,
  },
  {
    key: "gfci",
    title: "Exercise GFCI outlets",
    description:
      "Press TEST/RESET monthly on kitchen, bath, garage, and outdoor GFCIs. Replace any that fail.",
    category: "ELECTRICAL",
    priority: "medium",
    estimated_duration_minutes: 20,
    interval_days: 30,
    start_offset_days: 17,
  },
];

function toTemplate(row: SafetyItemDefinition): MaintenancePlanItemTemplate {
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

export const YEAR_ROUND_SAFETY_BASE_TASK_CAP = YEAR_ROUND_SAFETY_CATALOG.length;

export function getYearRoundSafetyBaseItems(): MaintenancePlanItemTemplate[] {
  return YEAR_ROUND_SAFETY_CATALOG.map(toTemplate);
}
