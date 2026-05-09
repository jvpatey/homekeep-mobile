import { MaintenancePlanDefinition } from "./types";
import { getSpringRefreshBaseItems } from "./springRefresh";

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
    id: "fall-winter-readiness",
    title: "Fall & winter readiness",
    shortDescription:
      "Heating, plumbing freeze risks, and moisture control before cold weather.",
    body: "Align tasks with your local frost dates; adjust offsets when you apply if needed.",
    tag: "fall",
    items: [
      {
        title: "Furnace / heating service",
        description:
          "Inspection, filter, and burner or heat exchanger check before heating season.",
        category: "HVAC",
        priority: "high",
        estimated_duration_minutes: 120,
        interval_days: 365,
        start_offset_days: 0,
      },
      {
        title: "Seal or weatherstrip doors & windows",
        description:
          "Reduce drafts and condensation before sustained cold.",
        category: "INTERIOR",
        priority: "medium",
        estimated_duration_minutes: 90,
        interval_days: 365,
        start_offset_days: 7,
      },
      {
        title: "Winterize outdoor faucets & hoses",
        description:
          "Shut off interior valves if present; drain and store hoses.",
        category: "PLUMBING",
        priority: "high",
        estimated_duration_minutes: 45,
        interval_days: 365,
        start_offset_days: 14,
      },
      {
        title: "Clean gutters after leaves",
        description:
          "Second pass after fall drop to keep winter melt draining correctly.",
        category: "EXTERIOR",
        priority: "high",
        estimated_duration_minutes: 90,
        interval_days: 180,
        start_offset_days: 30,
      },
    ],
  },
  {
    id: "year-round-safety",
    title: "Year-round safety",
    shortDescription:
      "Smoke/CO alarms, fire readiness, and lint buildup that affects safety.",
    tag: "safety",
    items: [
      {
        title: "Test smoke & CO alarms",
        description: "Press test buttons; replace batteries or units per manufacturer.",
        category: "SAFETY",
        priority: "high",
        estimated_duration_minutes: 20,
        interval_days: 90,
        start_offset_days: 0,
      },
      {
        title: "Check fire extinguisher(s)",
        description: "Pressure gauge in green zone, accessible mount, not expired.",
        category: "SAFETY",
        priority: "medium",
        estimated_duration_minutes: 15,
        interval_days: 365,
        start_offset_days: 3,
      },
      {
        title: "Clean dryer vent duct",
        description:
          "Lint buildup is a common fire risk; deep clean per run length.",
        category: "SAFETY",
        priority: "high",
        estimated_duration_minutes: 60,
        interval_days: 365,
        start_offset_days: 10,
      },
      {
        title: "Exercise GFCI outlets",
        description:
          "Press TEST/RESET on kitchen, bath, garage, and outdoor GFCIs.",
        category: "ELECTRICAL",
        priority: "medium",
        estimated_duration_minutes: 20,
        interval_days: 180,
        start_offset_days: 17,
      },
    ],
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
