import { MaintenancePlanItemTemplate } from "./types";
import { type HomeSystems, homeAgeYears } from "./homeSystems";

export const HOME_AGE_PLAN_ID = "home-age";

type HomeAgeItemDefinition = MaintenancePlanItemTemplate & {
  key: string;
  /** Include when the home was built before this year. */
  builtBefore?: number;
  /** Include when the home is at least this many years old. */
  minAgeYears?: number;
  /** Sewer lateral only applies when the home is on municipal sewer. */
  requiresMunicipalSewer?: boolean;
};

const HOME_AGE_CATALOG: HomeAgeItemDefinition[] = [
  {
    key: "lead_paint_awareness",
    builtBefore: 1978,
    title: "Lead paint awareness check",
    description:
      "Homes built before 1978 may have lead paint. Test before sanding, scraping, or renovating, and watch for chipping paint on windows, doors, and trim.",
    category: "SAFETY",
    priority: "high",
    estimated_duration_minutes: 30,
    interval_days: 1095,
    start_offset_days: 14,
  },
  {
    key: "asbestos_awareness",
    builtBefore: 1981,
    title: "Asbestos awareness check",
    description:
      "Older insulation, flooring, popcorn ceilings, and duct wrap can contain asbestos. Have suspect materials tested before disturbing them; leave intact material alone.",
    category: "SAFETY",
    priority: "high",
    estimated_duration_minutes: 30,
    interval_days: 1095,
    start_offset_days: 21,
  },
  {
    key: "electrical_inspection",
    minAgeYears: 40,
    title: "Electrical panel & wiring inspection",
    description:
      "Have a licensed electrician inspect the panel, grounding, and wiring. Flag aluminum branch wiring (common 1965–1973) and older panels such as Federal Pacific or Zinsco.",
    category: "ELECTRICAL",
    priority: "high",
    estimated_duration_minutes: 120,
    interval_days: 1095,
    start_offset_days: 28,
  },
  {
    key: "sewer_camera",
    minAgeYears: 40,
    requiresMunicipalSewer: true,
    title: "Sewer line camera inspection",
    description:
      "Older clay, cast-iron, or Orangeburg sewer laterals crack and collect roots. A camera scope catches problems before a backup.",
    category: "PLUMBING",
    priority: "medium",
    estimated_duration_minutes: 90,
    interval_days: 1095,
    start_offset_days: 35,
  },
];

function toTemplate(row: HomeAgeItemDefinition): MaintenancePlanItemTemplate {
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

/** Age-conditional tasks; empty when the year built is unknown. */
export function filterHomeAgeItems(
  home: HomeSystems | null | undefined,
  now: Date = new Date()
): MaintenancePlanItemTemplate[] {
  const age = homeAgeYears(home, now);
  if (age === null || !home?.yearBuilt) return [];
  const yearBuilt = home.yearBuilt;

  return HOME_AGE_CATALOG.filter((row) => {
    if (row.builtBefore !== undefined && yearBuilt >= row.builtBefore) {
      return false;
    }
    if (row.minAgeYears !== undefined && age < row.minAgeYears) return false;
    if (row.requiresMunicipalSewer && home.hasSeptic !== false) return false;
    return true;
  }).map(toTemplate);
}
