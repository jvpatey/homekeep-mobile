import { MaintenancePlanItemTemplate } from "./types";
import type { HomeSystems } from "./homeSystems";

export const HOME_FEATURES_PLAN_ID = "home-features";

export type HomeFeatureItemKey =
  | "sump_pump_test"
  | "well_water_test"
  | "well_pressure_tank"
  | "chimney_sweep"
  | "gas_fireplace_service"
  | "electric_fireplace_clean"
  | "garage_door_service"
  | "generator_exercise"
  | "generator_service"
  | "solar_inspection"
  | "ev_charger_inspection"
  | "deck_inspection"
  | "deck_seal";

type HomeFeatureItemDefinition = MaintenancePlanItemTemplate & {
  key: HomeFeatureItemKey;
  applies: (home: HomeSystems) => boolean;
};

const HOME_FEATURE_CATALOG: HomeFeatureItemDefinition[] = [
  {
    key: "sump_pump_test",
    applies: (home) => home.hasSumpPump === true,
    title: "Test sump pump",
    description:
      "Pour a bucket of water into the pit and confirm the pump kicks on and drains. Check the discharge line is clear and the backup battery (if any) holds a charge.",
    category: "PLUMBING",
    priority: "high",
    estimated_duration_minutes: 15,
    interval_days: 90,
    start_offset_days: 4,
  },
  {
    key: "well_water_test",
    applies: (home) => home.hasWell === true,
    title: "Test well water",
    description:
      "Send a sample to a certified lab for bacteria, nitrates, and local contaminants at least once a year, and after flooding or changes in taste or smell.",
    category: "PLUMBING",
    priority: "high",
    estimated_duration_minutes: 30,
    interval_days: 365,
    start_offset_days: 9,
  },
  {
    key: "well_pressure_tank",
    applies: (home) => home.hasWell === true,
    title: "Check well pump & pressure tank",
    description:
      "Watch for short cycling, check tank air pressure against the cut-in setting, and look for leaks around the wellhead.",
    category: "PLUMBING",
    priority: "medium",
    estimated_duration_minutes: 30,
    interval_days: 365,
    start_offset_days: 16,
  },
  {
    key: "chimney_sweep",
    applies: (home) => home.fireplaceType === "wood",
    title: "Chimney sweep & inspection",
    description:
      "Have a certified sweep remove creosote and inspect the flue, cap, and damper before burning season.",
    category: "SAFETY",
    priority: "high",
    estimated_duration_minutes: 90,
    interval_days: 365,
    start_offset_days: 12,
  },
  {
    key: "gas_fireplace_service",
    applies: (home) => home.fireplaceType === "gas",
    title: "Service gas fireplace",
    description:
      "Have the burner, pilot, glass, and venting checked yearly. Test the CO alarm nearby.",
    category: "HVAC",
    priority: "medium",
    estimated_duration_minutes: 60,
    interval_days: 365,
    start_offset_days: 12,
  },
  {
    key: "electric_fireplace_clean",
    applies: (home) => home.fireplaceType === "electric",
    title: "Clean electric fireplace",
    description:
      "Unplug it, vacuum dust from the heater vents and fan, and check the cord and outlet for heat damage.",
    category: "ELECTRICAL",
    priority: "low",
    estimated_duration_minutes: 20,
    interval_days: 365,
    start_offset_days: 12,
  },
  {
    key: "garage_door_service",
    applies: (home) => home.hasGarageDoor === true,
    title: "Lubricate & test garage door",
    description:
      "Lubricate rollers, hinges, and springs. Test auto-reverse with a board on the floor and check the photo-eye sensors.",
    category: "EXTERIOR",
    priority: "medium",
    estimated_duration_minutes: 30,
    interval_days: 180,
    start_offset_days: 6,
  },
  {
    key: "generator_exercise",
    applies: (home) => home.hasGenerator === true,
    title: "Run generator under load",
    description:
      "Exercise the generator for 15–20 minutes so it starts when you need it. Check fuel and oil levels.",
    category: "ELECTRICAL",
    priority: "medium",
    estimated_duration_minutes: 20,
    interval_days: 30,
    start_offset_days: 2,
  },
  {
    key: "generator_service",
    applies: (home) => home.hasGenerator === true,
    title: "Service generator",
    description:
      "Change oil, filters, and spark plug per the manual, and test the transfer switch.",
    category: "ELECTRICAL",
    priority: "medium",
    estimated_duration_minutes: 60,
    interval_days: 365,
    start_offset_days: 20,
  },
  {
    key: "solar_inspection",
    applies: (home) => home.hasSolar === true,
    title: "Inspect solar panels & production",
    description:
      "Compare monthly production with last year, look for shading, debris, or damaged panels, and check the inverter for faults.",
    category: "ELECTRICAL",
    priority: "low",
    estimated_duration_minutes: 30,
    interval_days: 365,
    start_offset_days: 24,
  },
  {
    key: "ev_charger_inspection",
    applies: (home) => home.hasEvCharger === true,
    title: "Inspect EV charger",
    description:
      "Check the cable and connector for cracks or heat damage, make sure the mount is secure, and test the GFCI if it has one.",
    category: "ELECTRICAL",
    priority: "low",
    estimated_duration_minutes: 15,
    interval_days: 365,
    start_offset_days: 26,
  },
  {
    key: "deck_inspection",
    applies: (home) => home.hasDeck === true,
    title: "Inspect deck structure",
    description:
      "Check for soft or rotting boards, loose railings, popped fasteners, and the ledger connection to the house.",
    category: "EXTERIOR",
    priority: "medium",
    estimated_duration_minutes: 45,
    interval_days: 365,
    start_offset_days: 10,
  },
  {
    key: "deck_seal",
    applies: (home) => home.hasDeck === true,
    title: "Clean & seal deck",
    description:
      "Wash and reapply stain or sealer when water stops beading on the surface.",
    category: "EXTERIOR",
    priority: "low",
    estimated_duration_minutes: 240,
    interval_days: 730,
    start_offset_days: 30,
  },
];

function toTemplate(
  row: HomeFeatureItemDefinition
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

/** One feature item by key, for plans that reuse it (keeps dedupe identity). */
export function homeFeatureItem(
  key: HomeFeatureItemKey
): MaintenancePlanItemTemplate {
  const row = HOME_FEATURE_CATALOG.find((item) => item.key === key);
  if (!row) throw new Error(`Unknown home feature item: ${key}`);
  return toTemplate(row);
}

export function filterHomeFeatureItems(
  home: HomeSystems | null | undefined
): MaintenancePlanItemTemplate[] {
  if (!home) return [];
  return HOME_FEATURE_CATALOG.filter((row) => row.applies(home)).map(
    toTemplate
  );
}
