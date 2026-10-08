import { MaintenancePlanItemTemplate } from "./types";
import type { HomeSystems } from "./homeSystems";
import { homeFeatureItem } from "./homeFeatureItems";

export const BASEMENT_WATER_PLAN_ID = "basement-water";

type BasementItemDefinition = {
  item: MaintenancePlanItemTemplate;
  requiresSumpPump?: boolean;
};

const BASEMENT_WATER_CATALOG: BasementItemDefinition[] = [
  { item: homeFeatureItem("sump_pump_test"), requiresSumpPump: true },
  {
    item: {
      title: "Test water leak sensors",
      description:
        "Press the test button or touch the probes with a damp cloth. Replace batteries and confirm alerts reach your phone.",
      category: "SAFETY",
      priority: "medium",
      estimated_duration_minutes: 15,
      interval_days: 180,
      start_offset_days: 1,
    },
  },
  {
    item: {
      title: "Empty & clean dehumidifier",
      description:
        "Clean the bucket and filter, and keep basement humidity between 30–50% to prevent mould.",
      category: "APPLIANCES",
      priority: "medium",
      estimated_duration_minutes: 15,
      interval_days: 30,
      start_offset_days: 2,
    },
  },
  {
    item: {
      title: "Check foundation for cracks & damp",
      description:
        "Walk the basement walls and floor with a flashlight. Note new cracks, efflorescence, or damp spots and photograph them for comparison.",
      category: "INTERIOR",
      priority: "medium",
      estimated_duration_minutes: 30,
      interval_days: 180,
      start_offset_days: 5,
    },
  },
  {
    item: {
      title: "Check grading & downspout extensions",
      description:
        "Soil should slope away from the foundation, and downspouts should discharge at least 4–6 feet from the house.",
      category: "EXTERIOR",
      priority: "high",
      estimated_duration_minutes: 30,
      interval_days: 365,
      start_offset_days: 7,
    },
  },
  {
    item: {
      title: "Clear window wells",
      description:
        "Remove leaves and debris, check the drain at the bottom, and make sure covers are secure.",
      category: "EXTERIOR",
      priority: "medium",
      estimated_duration_minutes: 20,
      interval_days: 180,
      start_offset_days: 9,
    },
  },
  {
    item: {
      title: "Flush water heater",
      description:
        "Drain a few gallons from the tank to clear sediment, which shortens tank life and can cause leaks.",
      category: "PLUMBING",
      priority: "medium",
      estimated_duration_minutes: 45,
      interval_days: 365,
      start_offset_days: 11,
    },
  },
];

export function getBasementWaterBaseItems(): MaintenancePlanItemTemplate[] {
  return BASEMENT_WATER_CATALOG.map((row) => ({ ...row.item }));
}

/** Drops the sump pump test only when the home says it has none. */
export function filterBasementWaterItems(
  home: HomeSystems | null | undefined
): MaintenancePlanItemTemplate[] {
  return BASEMENT_WATER_CATALOG.filter(
    (row) => !row.requiresSumpPump || home?.hasSumpPump !== false
  ).map((row) => ({ ...row.item }));
}
