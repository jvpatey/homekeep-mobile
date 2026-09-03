import { MaintenancePlanItemTemplate } from "./types";

/** Collected before tailoring conditional equipment rows. */
export interface NewHomeownerStarterAnswers {
  hasHeatPump: boolean;
  /** HRV, ERV, or whole-home air exchanger. */
  hasAirExchanger: boolean;
  hasWaterSoftener: boolean;
  /** Fridge with dispenser / filter cartridge (not ice-only with no filter). */
  hasRefrigeratorWaterFilter: boolean;
  /** Range hood or OTR microwave with removable grease filters. */
  hasVentHoodFilters: boolean;
  /** Private septic system (not municipal sewer). */
  hasSeptic: boolean;
}

type StarterItemDefinition = MaintenancePlanItemTemplate & {
  key: string;
  requiresHeatPump?: boolean;
  requiresAirExchanger?: boolean;
  requiresWaterSoftener?: boolean;
  requiresRefrigeratorWaterFilter?: boolean;
  requiresVentHoodFilters?: boolean;
  requiresSeptic?: boolean;
};

const NEW_HOMEOWNER_STARTER_CATALOG: StarterItemDefinition[] = [
  {
    key: "water_shutoff",
    title: "Find your main water shutoff",
    description:
      "Locate the valve that stops water to the whole house (often basement, crawl, or utility wall). Tag or photograph it—during a leak you will not have time to search.",
    category: "GENERAL",
    priority: "high",
    estimated_duration_minutes: 15,
    interval_days: 365,
    start_offset_days: 0,
  },
  {
    key: "softener_salt",
    requiresWaterSoftener: true,
    title: "Refill water softener salt",
    description:
      "Peek at the brine tank about monthly (more often if your household uses a lot of water). Letting it run empty can damage the resin and let hard water through.",
    category: "PLUMBING",
    priority: "medium",
    estimated_duration_minutes: 15,
    interval_days: 30,
    start_offset_days: 2,
  },
  {
    key: "heat_pump_filters",
    requiresHeatPump: true,
    title: "Clean heat pump filters",
    description:
      "Wash or replace indoor air-handler filters—typically every 1–3 months, more often with pets or heavy use.",
    category: "HVAC",
    priority: "medium",
    estimated_duration_minutes: 25,
    interval_days: 90,
    start_offset_days: 4,
  },
  {
    key: "heat_pump_yearly",
    requiresHeatPump: true,
    title: "Professional heat pump inspection",
    description:
      "Book a technician visit (coils, refrigerant check, drainage, defrost). Typical once per year; many owners align with spring or fall.",
    category: "HVAC",
    priority: "high",
    estimated_duration_minutes: 120,
    interval_days: 365,
    start_offset_days: 8,
  },
  {
    key: "dryer_vent",
    title: "Clean dryer vent duct",
    description:
      "Lint buildup is a fire risk. Clear lint trap every load; deep-clean the duct run on a schedule that matches how often you dry clothes.",
    category: "SAFETY",
    priority: "high",
    estimated_duration_minutes: 60,
    interval_days: 365,
    start_offset_days: 12,
  },
  {
    key: "fire_extinguisher",
    title: "Check fire extinguisher(s)",
    description:
      "Monthly visual check: gauge in the green zone, pin intact, accessible mount, not expired—kitchen and garage at minimum.",
    category: "SAFETY",
    priority: "medium",
    estimated_duration_minutes: 15,
    interval_days: 30,
    start_offset_days: 15,
  },
  {
    key: "smoke_test",
    title: "Test smoke & CO alarms",
    description:
      "Press test on each unit monthly (NFPA). Replace batteries or devices per manufacturer.",
    category: "SAFETY",
    priority: "high",
    estimated_duration_minutes: 20,
    interval_days: 30,
    start_offset_days: 18,
  },
  {
    key: "dishwasher_filter",
    title: "Clean dishwasher filter",
    description:
      "Remove and rinse the trap at the bottom tub monthly—many first-time owners miss it until dishes stop cleaning well.",
    category: "APPLIANCES",
    priority: "medium",
    estimated_duration_minutes: 15,
    interval_days: 30,
    start_offset_days: 22,
  },
  {
    key: "vent_hood_filters",
    requiresVentHoodFilters: true,
    title: "Clean kitchen vent hood grease filters",
    description:
      "Pull the metal mesh filters monthly (check under an over-the-range microwave too). Degrease in hot soapy water or the dishwasher if allowed; swap charcoal filters if your hood uses them.",
    category: "APPLIANCES",
    priority: "medium",
    estimated_duration_minutes: 20,
    interval_days: 30,
    start_offset_days: 23,
  },
  {
    key: "fridge_water_filter",
    requiresRefrigeratorWaterFilter: true,
    title: "Replace refrigerator water filter",
    description:
      "Many dispensers use a twist-in or slide-out cartridge (often inside the fridge or grille). Replace on the schedule on the label—usually about twice a year—or when flow or taste changes.",
    category: "APPLIANCES",
    priority: "medium",
    estimated_duration_minutes: 15,
    interval_days: 180,
    start_offset_days: 24,
  },
  {
    key: "air_exchanger",
    requiresAirExchanger: true,
    title: "Clean air exchanger filters (HRV/ERV)",
    description:
      "Wash or replace core and pre-filters per manufacturer—often every three months.",
    category: "HVAC",
    priority: "medium",
    estimated_duration_minutes: 30,
    interval_days: 90,
    start_offset_days: 26,
  },
  {
    key: "septic_pumping",
    requiresSeptic: true,
    title: "Schedule septic tank pumping",
    description:
      "The tank needs periodic pumping so solids do not reach the drain field—typically every 3–5 years depending on household size and local rules. Adjust timing after an inspection; protecting the field matters more than the calendar.",
    category: "PLUMBING",
    priority: "high",
    estimated_duration_minutes: 45,
    interval_days: 1095,
    start_offset_days: 28,
  },
  {
    key: "manuals",
    title: "Keep manuals, warranties, and key contacts",
    description:
      "One folder or note for appliance manuals, HVAC warranty numbers, and a trusted plumber or electrician.",
    category: "GENERAL",
    priority: "low",
    estimated_duration_minutes: 30,
    interval_days: 365,
    start_offset_days: 30,
  },
];

function toTemplate(
  row: StarterItemDefinition
): MaintenancePlanItemTemplate {
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

export const NEW_HOMEOWNER_STARTER_BASE_TASK_CAP =
  NEW_HOMEOWNER_STARTER_CATALOG.length;

export function filterNewHomeownerStarterItems(
  answers: NewHomeownerStarterAnswers
): MaintenancePlanItemTemplate[] {
  const out: MaintenancePlanItemTemplate[] = [];

  for (const row of NEW_HOMEOWNER_STARTER_CATALOG) {
    if (row.requiresHeatPump && !answers.hasHeatPump) continue;
    if (row.requiresAirExchanger && !answers.hasAirExchanger) continue;
    if (row.requiresWaterSoftener && !answers.hasWaterSoftener) continue;
    if (
      row.requiresRefrigeratorWaterFilter &&
      !answers.hasRefrigeratorWaterFilter
    ) {
      continue;
    }
    if (row.requiresVentHoodFilters && !answers.hasVentHoodFilters) continue;
    if (row.requiresSeptic && !answers.hasSeptic) continue;
    out.push(toTemplate(row));
  }

  return out;
}

/** Full catalog (unfiltered); filtering runs in {@link filterNewHomeownerStarterItems}. */
export function getNewHomeownerStarterBaseItems(): MaintenancePlanItemTemplate[] {
  return NEW_HOMEOWNER_STARTER_CATALOG.map(toTemplate);
}
