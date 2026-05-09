import { MaintenancePlanDefinition } from "./types";
import { getSpringRefreshBaseItems } from "./springRefresh";
import { getColdWeatherPrepBaseItems } from "./fallWinter";
import { getYearRoundSafetyBaseItems } from "./yearRoundSafety";

export const MAINTENANCE_PLANS: MaintenancePlanDefinition[] = [
  {
    id: "spring-refresh",
    title: "Spring refresh",
    shortDescription:
      "Answer a few questions to tailor lawn, exterior, and HVAC tasks for your home.",
    body: "We’ll ask about your lawn, home type, and heating so your checklist matches what you actually maintain.",
    tag: "spring",
    /** Full catalog (unfiltered); the UI runs questionnaire filtering before apply. */
    items: getSpringRefreshBaseItems(),
  },
  {
    id: "cold-weather-prep",
    title: "Cold-weather prep",
    shortDescription:
      "Fall yard and exterior work, freeze protection, and heating tuned to how your home is built.",
    body: "Answer the same short profile as Spring refresh — we tailor gutters, roof, outdoor plumbing, and HVAC extras (gas furnace vs heat pump) before you pick tasks.",
    tag: "fall",
    items: getColdWeatherPrepBaseItems(),
  },
  {
    id: "year-round-safety",
    title: "Year-round safety",
    shortDescription:
      "Smoke/CO, electrical checks, dryer vent, HVAC clearance — pick what to track.",
    body: "Choose which safety routines to add to your schedule. Skip anything that does not apply (for example dryer vent if you use shared laundry only).",
    tag: "safety",
    items: getYearRoundSafetyBaseItems(),
  },
  {
    id: "new-homeowner-starter",
    title: "New homeowner starter",
    shortDescription:
      "Baseline routines to locate shutoffs, protect HVAC, and watch water heater health.",
    tag: "starter",
    items: [
      {
        title: "Locate main water shutoff",
        description:
          "Tag or photograph it so anyone home can stop flooding quickly.",
        category: "GENERAL",
        priority: "high",
        estimated_duration_minutes: 15,
        interval_days: 365,
        start_offset_days: 0,
      },
      {
        title: "Set HVAC filter replacement cadence",
        description:
          "Match interval to pets and dust; typical range 60–90 days.",
        category: "HVAC",
        priority: "medium",
        estimated_duration_minutes: 20,
        interval_days: 90,
        start_offset_days: 5,
      },
      {
        title: "Water heater flush / inspection",
        description:
          "Drain sediment per manufacturer; inspect pan and relief valve.",
        category: "PLUMBING",
        priority: "medium",
        estimated_duration_minutes: 60,
        interval_days: 365,
        start_offset_days: 14,
      },
    ],
  },
];

export function getMaintenancePlanById(
  id: string
): MaintenancePlanDefinition | undefined {
  return MAINTENANCE_PLANS.find((p) => p.id === id);
}
