import { MaintenancePlanDefinition } from "./types";
import { getSpringRefreshBaseItems } from "./springRefresh";
import { getColdWeatherPrepBaseItems } from "./fallWinter";
import { getYearRoundSafetyBaseItems } from "./yearRoundSafety";
import { getNewHomeownerStarterBaseItems } from "./newHomeownerStarter";
import { getPoolSpaBaseItems } from "./poolSpa";

export const MAINTENANCE_PLANS: MaintenancePlanDefinition[] = [
  {
    id: "spring-refresh",
    title: "Spring refresh",
    shortDescription:
      "Answer a few questions to tailor lawn, exterior, and HVAC tasks for your home.",
    body: "We’ll ask about your lawn, home type, and heating so your checklist matches what you actually maintain.",
    tag: "spring",
    requiresQuestionnaire: true,
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
    requiresQuestionnaire: true,
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
    id: "pool-spa-care",
    title: "Pool & spa care",
    shortDescription:
      "Tailored water testing, filtration, seasonal open/close for pools, and spa drain cycles—answer what you own, then pick tasks.",
    body: "Intervals are typical reminders; adjust after you learn your water and climate. Pool closing may not apply if you swim year-round—leave those rows off.",
    tag: "pool",
    requiresQuestionnaire: true,
    items: getPoolSpaBaseItems(),
  },
  {
    id: "new-homeowner-starter",
    title: "New homeowner starter",
    shortDescription:
      "First-owner chores with short questions so HVAC, ventilator, softener, fridge and vent-hood filters, and septic tasks match your home—then pick what to add.",
    body: "We only show heat pump, HRV/ERV, water-softener, refrigerator filter, kitchen vent hood grease filters, and septic routines when you say you have that setup. Everything else is general; skip duplicates you already track in other plans.",
    tag: "starter",
    requiresQuestionnaire: true,
    /** Full catalog; UI runs questionnaire filtering before the task picker. */
    items: getNewHomeownerStarterBaseItems(),
  },
];

/** Plan ids that use a questionnaire before task selection — derived from {@link MAINTENANCE_PLANS}. */
export const QUESTIONNAIRE_PLAN_IDS = new Set(
  MAINTENANCE_PLANS.filter((p) => p.requiresQuestionnaire).map((p) => p.id)
);

export function getMaintenancePlanById(
  id: string
): MaintenancePlanDefinition | undefined {
  return MAINTENANCE_PLANS.find((p) => p.id === id);
}
