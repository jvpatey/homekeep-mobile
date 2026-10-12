import { MaintenancePlanItemTemplate } from "./types";

export const CONDO_LIVING_PLAN_ID = "condo-living";

/** Inside-the-unit tasks; the HOA usually handles roof, siding, and grounds. */
const CONDO_LIVING_CATALOG: MaintenancePlanItemTemplate[] = [
  {
    title: "Review HOA documents & unit insurance",
    description:
      "Re-read what the HOA master policy covers versus your HO-6 policy, and note who repairs what (windows, balcony, plumbing inside walls).",
    category: "GENERAL",
    priority: "medium",
    estimated_duration_minutes: 45,
    interval_days: 365,
    start_offset_days: 0,
  },
  {
    title: "Find your main water shutoff",
    description:
      "Locate and label the unit shutoff (often in a utility closet or under the sink) so you can stop a leak before it reaches neighbours.",
    category: "GENERAL",
    priority: "high",
    estimated_duration_minutes: 15,
    interval_days: 365,
    start_offset_days: 1,
  },
  {
    title: "Inspect washing machine hoses",
    description:
      "Look for bulges, cracks, or rust at the fittings. Replace rubber hoses with braided stainless every five years.",
    category: "PLUMBING",
    priority: "high",
    estimated_duration_minutes: 15,
    interval_days: 365,
    start_offset_days: 3,
  },
  {
    title: "Check water heater drain pan",
    description:
      "Make sure the pan and drain line are clear and dry. A small drip here can become a ceiling leak downstairs.",
    category: "PLUMBING",
    priority: "medium",
    estimated_duration_minutes: 10,
    interval_days: 180,
    start_offset_days: 5,
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
    title: "Re-caulk tub & shower",
    description:
      "Replace cracked or mouldy caulk so water can’t seep into the floor or the unit below.",
    category: "INTERIOR",
    priority: "medium",
    estimated_duration_minutes: 60,
    interval_days: 365,
    start_offset_days: 12,
  },
  {
    title: "Clean sliding door track",
    description:
      "Vacuum the track, clear weep holes, and lubricate rollers so the door seals and drains properly.",
    category: "INTERIOR",
    priority: "low",
    estimated_duration_minutes: 20,
    interval_days: 180,
    start_offset_days: 14,
  },
  {
    title: "Clear balcony drain",
    description:
      "Remove leaves and debris from the balcony or patio drain before heavy rain or snowmelt.",
    category: "EXTERIOR",
    priority: "medium",
    estimated_duration_minutes: 15,
    interval_days: 180,
    start_offset_days: 16,
  },
  {
    title: "Confirm interconnected alarms with HOA",
    description:
      "Ask when building-wide smoke and CO alarms were last tested, and whether your unit alarms tie into the building system.",
    category: "SAFETY",
    priority: "medium",
    estimated_duration_minutes: 15,
    interval_days: 365,
    start_offset_days: 18,
  },
];

export function getCondoLivingBaseItems(): MaintenancePlanItemTemplate[] {
  return CONDO_LIVING_CATALOG.map((item) => ({ ...item }));
}
