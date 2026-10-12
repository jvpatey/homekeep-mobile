import { MaintenancePlanDefinition } from "./types";
import { getSpringRefreshBaseItems } from "./springRefresh";
import { getColdWeatherPrepBaseItems } from "./fallWinter";
import { getYearRoundSafetyBaseItems } from "./yearRoundSafety";
import { getNewHomeownerStarterBaseItems } from "./newHomeownerStarter";
import { getPoolSpaBaseItems } from "./poolSpa";
import { CONDO_LIVING_PLAN_ID, getCondoLivingBaseItems } from "./condoLiving";
import {
  BASEMENT_WATER_PLAN_ID,
  filterBasementWaterItems,
  getBasementWaterBaseItems,
} from "./basementWater";
import {
  GARAGE_VEHICLES_PLAN_ID,
  filterGarageVehiclesItems,
  getGarageVehiclesBaseItems,
} from "./garageVehicles";
import {
  IRRIGATION_OPEN_CLOSE_PLAN_ID,
  filterIrrigationOpenCloseItems,
  getIrrigationOpenCloseBaseItems,
} from "./irrigationOpenClose";

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
  {
    id: CONDO_LIVING_PLAN_ID,
    title: "Condo & townhome",
    shortDescription:
      "Inside-the-unit care when the HOA handles the roof and grounds: leaks, vents, seals, and HOA paperwork.",
    body: "Focuses on what you’re usually responsible for in a shared building. Water leaks travel to neighbours, so several of these are about catching drips early.",
    tag: "condo",
    items: getCondoLivingBaseItems(),
  },
  {
    id: BASEMENT_WATER_PLAN_ID,
    title: "Basement & water",
    shortDescription:
      "Keep water out: sump pump, leak sensors, dehumidifier, grading, window wells, and the water heater.",
    body: "Most basement damage starts small. These checks catch rising humidity, blocked drainage, and a sump pump that won’t start before the next big storm.",
    tag: "water",
    items: getBasementWaterBaseItems(),
    filterForHome: filterBasementWaterItems,
  },
  {
    id: GARAGE_VEHICLES_PLAN_ID,
    title: "Garage & vehicles",
    shortDescription:
      "Garage door safety, opener and seals, floor and drain, safe storage, and your EV charger.",
    body: "The garage door is the largest moving object in most homes. Keep its auto-reverse working and its seals tight; EV charger checks show up when you’ve told us you have one.",
    tag: "garage",
    items: getGarageVehiclesBaseItems(),
    filterForHome: filterGarageVehiclesItems,
  },
  {
    id: IRRIGATION_OPEN_CLOSE_PLAN_ID,
    title: "Irrigation open & close",
    shortDescription:
      "Spring startup, seasonal controller changes, backflow test, and the fall blowout before the first freeze.",
    body: "Startup and blowout are scheduled for the next spring and fall where you live, so you can add the whole plan at any time of year.",
    tag: "irrigation",
    items: getIrrigationOpenCloseBaseItems(),
    filterForHome: filterIrrigationOpenCloseItems,
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
