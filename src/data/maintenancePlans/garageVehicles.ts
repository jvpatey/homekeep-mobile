import { MaintenancePlanItemTemplate } from "./types";
import type { HomeSystems } from "./homeSystems";
import { homeFeatureItem } from "./homeFeatureItems";

export const GARAGE_VEHICLES_PLAN_ID = "garage-vehicles";

type GarageItemDefinition = {
  item: MaintenancePlanItemTemplate;
  requiresEvCharger?: boolean;
};

const GARAGE_VEHICLES_CATALOG: GarageItemDefinition[] = [
  { item: homeFeatureItem("garage_door_service") },
  {
    item: {
      title: "Check garage door opener & remotes",
      description:
        "Replace remote and keypad batteries, test the wall button and manual release, and update the keypad code if it’s been shared.",
      category: "ELECTRICAL",
      priority: "low",
      estimated_duration_minutes: 15,
      interval_days: 365,
      start_offset_days: 2,
    },
  },
  {
    item: {
      title: "Replace garage door weatherstripping",
      description:
        "Check the bottom seal and side stops for gaps or cracking that let in water, pests, and cold air.",
      category: "EXTERIOR",
      priority: "low",
      estimated_duration_minutes: 45,
      interval_days: 730,
      start_offset_days: 8,
    },
  },
  {
    item: {
      title: "Clean garage floor & drain",
      description:
        "Sweep out winter salt and debris, clean oil spots, and clear the floor drain if you have one.",
      category: "INTERIOR",
      priority: "low",
      estimated_duration_minutes: 60,
      interval_days: 180,
      start_offset_days: 10,
    },
  },
  {
    item: {
      title: "Store fuels & chemicals safely",
      description:
        "Keep gas cans, paint, and pool chemicals in sealed containers away from water heaters and furnaces, and keep an extinguisher by the door.",
      category: "SAFETY",
      priority: "medium",
      estimated_duration_minutes: 30,
      interval_days: 365,
      start_offset_days: 12,
    },
  },
  { item: homeFeatureItem("ev_charger_inspection"), requiresEvCharger: true },
];

export function getGarageVehiclesBaseItems(): MaintenancePlanItemTemplate[] {
  return GARAGE_VEHICLES_CATALOG.map((row) => ({ ...row.item }));
}

export function filterGarageVehiclesItems(
  home: HomeSystems | null | undefined
): MaintenancePlanItemTemplate[] {
  return GARAGE_VEHICLES_CATALOG.filter(
    (row) => !row.requiresEvCharger || home?.hasEvCharger === true
  ).map((row) => ({ ...row.item }));
}
