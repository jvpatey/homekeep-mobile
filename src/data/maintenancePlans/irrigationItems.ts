import { MaintenancePlanItemTemplate } from "./types";

/** Shared by spring/fall catalogs and the irrigation plan so dedupe matches. */
export const IRRIGATION_SPRING_STARTUP_ITEM: MaintenancePlanItemTemplate = {
  title: "Start up irrigation system",
  description:
    "Open the main valve slowly, run each zone, and fix broken heads, leaks, or misaligned spray before the season.",
  category: "LANDSCAPING",
  priority: "medium",
  estimated_duration_minutes: 60,
  interval_days: 365,
  start_offset_days: 8,
};

export const IRRIGATION_FALL_BLOWOUT_ITEM: MaintenancePlanItemTemplate = {
  title: "Winterize irrigation (blowout)",
  description:
    "Shut off the supply and blow out lines with compressed air before the first hard freeze so pipes and heads don’t crack.",
  category: "LANDSCAPING",
  priority: "high",
  estimated_duration_minutes: 60,
  interval_days: 365,
  start_offset_days: 8,
};
