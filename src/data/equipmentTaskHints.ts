import type { MaintenancePlanItemTemplate } from "./maintenancePlans/types";
import { routineIdentityKey } from "./maintenancePlans/types";
import type { MaintenanceCategory } from "../types/maintenance";

export type EquipmentHintGroup = {
  keywords: string[];
  /** Skip this group when the name also contains one of these (e.g. range vs range hood). */
  excludeIf?: string[];
  items: MaintenancePlanItemTemplate[];
};

const WATER_HEATER: MaintenancePlanItemTemplate = {
  title: "Flush water heater",
  description:
    "Drain a few gallons to clear sediment so the tank heats evenly and lasts longer.",
  category: "PLUMBING",
  priority: "medium",
  estimated_duration_minutes: 45,
  interval_days: 365,
  start_offset_days: 10,
};

const FURNACE: MaintenancePlanItemTemplate = {
  title: "Replace HVAC filter",
  description:
    "Swap the furnace or air-handler filter so airflow stays clean.",
  category: "HVAC",
  priority: "medium",
  estimated_duration_minutes: 15,
  interval_days: 90,
  start_offset_days: 4,
};

const DRYER: MaintenancePlanItemTemplate = {
  title: "Clean dryer vent duct",
  description:
    "Lint buildup is a fire risk. Clear the lint trap every load; deep-clean the duct on a schedule.",
  category: "SAFETY",
  priority: "high",
  estimated_duration_minutes: 30,
  interval_days: 365,
  start_offset_days: 6,
};

const AC: MaintenancePlanItemTemplate = {
  title: "Replace HVAC filter before cooling season",
  description:
    "Fresh filter before heavy AC use keeps coils cleaner and bills lower.",
  category: "HVAC",
  priority: "medium",
  estimated_duration_minutes: 15,
  interval_days: 180,
  start_offset_days: 5,
};

const SOFTENER: MaintenancePlanItemTemplate = {
  title: "Refill water softener salt",
  description:
    "Check the brine tank. Letting it run empty can damage the resin.",
  category: "PLUMBING",
  priority: "medium",
  estimated_duration_minutes: 15,
  interval_days: 30,
  start_offset_days: 2,
};

const HEAT_PUMP: MaintenancePlanItemTemplate = {
  title: "Clean heat pump filters",
  description:
    "Wash or replace indoor air-handler filters per the manufacturer.",
  category: "HVAC",
  priority: "medium",
  estimated_duration_minutes: 25,
  interval_days: 90,
  start_offset_days: 4,
};

const MOWER: MaintenancePlanItemTemplate = {
  title: "Service lawn mower",
  description:
    "Change oil, clean the deck, and sharpen or replace the blade before peak mowing.",
  category: "LANDSCAPING",
  priority: "low",
  estimated_duration_minutes: 45,
  interval_days: 365,
  start_offset_days: 14,
};

const DISHWASHER: MaintenancePlanItemTemplate = {
  title: "Clean dishwasher filter",
  description:
    "Remove and rinse the trap at the bottom tub—many first-time owners miss it until dishes stop cleaning well.",
  category: "APPLIANCES",
  priority: "medium",
  estimated_duration_minutes: 15,
  interval_days: 90,
  start_offset_days: 22,
};

const FRIDGE_FILTER: MaintenancePlanItemTemplate = {
  title: "Replace refrigerator water filter",
  description:
    "Many dispensers use a twist-in or slide-out cartridge. Replace on the label schedule—usually about twice a year—or when flow or taste changes.",
  category: "APPLIANCES",
  priority: "medium",
  estimated_duration_minutes: 15,
  interval_days: 180,
  start_offset_days: 24,
};

const FRIDGE_COILS: MaintenancePlanItemTemplate = {
  title: "Vacuum refrigerator coils",
  description:
    "Dust on the condenser coils (usually behind or under the fridge) makes the compressor work harder. Unplug or pull the fridge carefully and vacuum.",
  category: "APPLIANCES",
  priority: "low",
  estimated_duration_minutes: 20,
  interval_days: 180,
  start_offset_days: 25,
};

const RANGE_HOOD: MaintenancePlanItemTemplate = {
  title: "Clean kitchen vent hood grease filters",
  description:
    "Pull the metal mesh filters. Degrease in hot soapy water or the dishwasher if allowed; swap charcoal filters if your hood uses them.",
  category: "APPLIANCES",
  priority: "medium",
  estimated_duration_minutes: 20,
  interval_days: 60,
  start_offset_days: 23,
};

const STOVE: MaintenancePlanItemTemplate = {
  title: "Deep-clean oven and cooktop",
  description:
    "Wipe spills after use; run a self-clean or manual degrease on a schedule so grease does not bake on or become a fire risk.",
  category: "APPLIANCES",
  priority: "medium",
  estimated_duration_minutes: 45,
  interval_days: 90,
  start_offset_days: 20,
};

const MICROWAVE: MaintenancePlanItemTemplate = {
  title: "Clean microwave interior",
  description:
    "Steam with a bowl of water and wipe the cavity, door seal, and turntable so splatters do not bake on.",
  category: "APPLIANCES",
  priority: "low",
  estimated_duration_minutes: 15,
  interval_days: 30,
  start_offset_days: 12,
};

export const EQUIPMENT_TASK_HINTS: EquipmentHintGroup[] = [
  { keywords: ["water heater", "hot water tank", "hot-water"], items: [WATER_HEATER] },
  { keywords: ["furnace", "boiler"], items: [FURNACE] },
  { keywords: ["dryer"], items: [DRYER] },
  { keywords: ["air conditioner", "a/c", "ac unit", "central air"], items: [AC] },
  { keywords: ["softener"], items: [SOFTENER] },
  { keywords: ["heat pump", "mini split", "mini-split"], items: [HEAT_PUMP] },
  { keywords: ["mower", "lawn mower"], items: [MOWER] },
  { keywords: ["dishwasher"], items: [DISHWASHER] },
  {
    keywords: ["fridge", "refrigerator"],
    items: [FRIDGE_FILTER, FRIDGE_COILS],
  },
  {
    keywords: ["range hood", "vent hood", "extractor hood", "cooker hood"],
    items: [RANGE_HOOD],
  },
  {
    keywords: ["stove", "range", "oven", "cooktop", "cook top"],
    excludeIf: ["hood"],
    items: [STOVE],
  },
  {
    keywords: ["microwave", "over-the-range", "over the range"],
    items: [MICROWAVE, RANGE_HOOD],
  },
];

export function hintsForEquipmentName(
  name: string
): MaintenancePlanItemTemplate[] {
  const hay = name.trim().toLowerCase();
  if (!hay) return [];
  const matched: MaintenancePlanItemTemplate[] = [];
  const seen = new Set<string>();
  for (const group of EQUIPMENT_TASK_HINTS) {
    if (!group.keywords.some((keyword) => hay.includes(keyword))) continue;
    if (group.excludeIf?.some((skip) => hay.includes(skip))) continue;
    for (const item of group.items) {
      const key = routineIdentityKey(
        item.title,
        item.category,
        item.interval_days
      );
      if (seen.has(key)) continue;
      seen.add(key);
      matched.push(item);
    }
  }
  return matched;
}

export function partitionEquipmentHints<
  T extends {
    title: string;
    category: MaintenanceCategory;
    interval_days: number;
    id: string;
  },
>(
  hints: MaintenancePlanItemTemplate[],
  existing: T[]
): { toLink: T[]; toCreate: MaintenancePlanItemTemplate[] } {
  const byKey = new Map(
    existing.map((row) => [
      routineIdentityKey(row.title, row.category, row.interval_days),
      row,
    ])
  );
  const toLink: T[] = [];
  const toCreate: MaintenancePlanItemTemplate[] = [];
  const linked = new Set<string>();
  for (const hint of hints) {
    const key = routineIdentityKey(
      hint.title,
      hint.category,
      hint.interval_days
    );
    const match = byKey.get(key);
    if (match && !linked.has(match.id)) {
      toLink.push(match);
      linked.add(match.id);
    } else if (!match) {
      toCreate.push(hint);
    }
  }
  return { toLink, toCreate };
}
