import { MaintenancePlanItemTemplate, PlanFilterContext } from "./types";
import {
  IRRIGATION_FALL_BLOWOUT_ITEM,
  IRRIGATION_SPRING_STARTUP_ITEM,
} from "./irrigationItems";
import { daysUntilSeason } from "../../utils/homeSeason";

export const IRRIGATION_OPEN_CLOSE_PLAN_ID = "irrigation-open-close";

const IRRIGATION_OPEN_CLOSE_CATALOG: MaintenancePlanItemTemplate[] = [
  IRRIGATION_SPRING_STARTUP_ITEM,
  {
    title: "Adjust irrigation controller schedule",
    description:
      "Shorten run times in spring and fall, lengthen them in peak summer, and enable the rain or freeze sensor if you have one.",
    category: "LANDSCAPING",
    priority: "low",
    estimated_duration_minutes: 15,
    interval_days: 90,
    start_offset_days: 14,
  },
  {
    title: "Backflow preventer test",
    description:
      "Many cities require a certified annual test of the backflow device. Keep the report for your records.",
    category: "PLUMBING",
    priority: "medium",
    estimated_duration_minutes: 30,
    interval_days: 365,
    start_offset_days: 21,
  },
  IRRIGATION_FALL_BLOWOUT_ITEM,
];

export function getIrrigationOpenCloseBaseItems(): MaintenancePlanItemTemplate[] {
  return IRRIGATION_OPEN_CLOSE_CATALOG.map((item) => ({ ...item }));
}

/** Pins startup to the next spring and blowout to the next fall. */
export function filterIrrigationOpenCloseItems(
  _home: unknown,
  context: PlanFilterContext
): MaintenancePlanItemTemplate[] {
  const now = context.now ?? new Date();
  return IRRIGATION_OPEN_CLOSE_CATALOG.map((item) => {
    if (item === IRRIGATION_SPRING_STARTUP_ITEM) {
      const days = daysUntilSeason("spring", now, context.latitude);
      return {
        ...item,
        start_offset_days: days === 0 ? item.start_offset_days : days + 30,
      };
    }
    if (item === IRRIGATION_FALL_BLOWOUT_ITEM) {
      const days = daysUntilSeason("fall", now, context.latitude);
      return {
        ...item,
        start_offset_days: days === 0 ? item.start_offset_days : days + 45,
      };
    }
    return { ...item };
  });
}
