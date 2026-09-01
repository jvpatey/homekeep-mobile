import { MaintenanceCategory, MaintenanceTask } from "../types/maintenance";
import { HomeSystems } from "./maintenancePlans/homeSystems";
import { startOfDay, addDays } from "date-fns";

export type HomeMapZoneId =
  | "exterior"
  | "interior"
  | "hvac"
  | "water"
  | "electrical"
  | "appliances"
  | "yard"
  | "pool"
  | "safety";

export type HomeMapZoneState = "quiet" | "scheduled" | "due" | "overdue";

export interface HomeMapZone {
  id: HomeMapZoneId;
  label: string;
  shortLabel: string;
  categories: MaintenanceCategory[];
  /** Pool zone matches source_plan_id instead of category. */
  sourcePlanId?: string;
  hidden?: boolean;
}

/** Titles filed as GENERAL/INTERIOR that still belong on a specific part of the house. */
const ZONE_TITLE_HINTS: Record<HomeMapZoneId, string[]> = {
  exterior: [
    "weatherstrip",
    "weather strip",
    "roof",
    "gutter",
    "flashing",
    "siding",
    "patio",
    "deck",
  ],
  interior: ["paint", "caulk", "floor", "carpet", "drywall", "attic", "basement"],
  hvac: ["furnace", "heat pump", "mini-split", "geothermal", "boiler", "hvac"],
  water: [
    "shutoff",
    "shut-off",
    "shut off",
    "septic",
    "softener",
    "hose bib",
    "faucet",
    "water valve",
  ],
  electrical: ["gfci", "breaker", "outlet", "panel", "electrical"],
  appliances: [
    "dishwasher",
    "refrigerator",
    "fridge",
    "vent hood",
    "microwave",
    "dryer",
  ],
  yard: ["lawn", "mow", "fertiliz", "leaf", "seed", "lime"],
  pool: ["pool", "spa", "hot tub"],
  safety: ["smoke", "extinguisher", "carbon monoxide", "co alarm", "chimney"],
};

export function getHomeMapZones(
  home: HomeSystems | null | undefined
): HomeMapZone[] {
  const hasLawn = home?.hasLawn === true;
  const hasPool = home?.hasPool === true || home?.hasSpa === true;

  return [
    {
      id: "exterior",
      label: "Roof & exterior",
      shortLabel: "Roof",
      categories: ["EXTERIOR"],
    },
    {
      id: "interior",
      label: "Interior",
      shortLabel: "Interior",
      categories: ["INTERIOR", "GENERAL"],
    },
    { id: "hvac", label: "HVAC", shortLabel: "HVAC", categories: ["HVAC"] },
    {
      id: "water",
      label: "Water",
      shortLabel: "Water",
      categories: ["PLUMBING"],
    },
    {
      id: "electrical",
      label: "Electrical",
      shortLabel: "Electric",
      categories: ["ELECTRICAL"],
    },
    {
      id: "appliances",
      label: "Appliances",
      shortLabel: "Appliances",
      categories: ["APPLIANCES"],
    },
    {
      id: "yard",
      label: "Yard",
      shortLabel: "Yard",
      categories: ["LANDSCAPING"],
      hidden: !hasLawn,
    },
    {
      id: "pool",
      label: "Pool & spa",
      shortLabel: "Pool",
      categories: [],
      sourcePlanId: "pool-spa-care",
      hidden: !hasPool,
    },
    {
      id: "safety",
      label: "Safety",
      shortLabel: "Safety",
      categories: ["SAFETY"],
    },
  ];
}

function titleHintsZone(title: string, zoneId: HomeMapZoneId): boolean {
  const haystack = title.toLowerCase();
  return ZONE_TITLE_HINTS[zoneId].some((hint) => haystack.includes(hint));
}

function hintedSpecificZone(title: string): HomeMapZoneId | null {
  for (const id of Object.keys(ZONE_TITLE_HINTS) as HomeMapZoneId[]) {
    if (id === "interior") continue;
    if (titleHintsZone(title, id)) return id;
  }
  return null;
}

export function taskMatchesZone(
  task: MaintenanceTask,
  zone: HomeMapZone
): boolean {
  if (zone.sourcePlanId && task.source_plan_id === zone.sourcePlanId) {
    return true;
  }

  const isGeneric = task.category === "GENERAL" || task.category === "INTERIOR";

  if (!isGeneric && zone.categories.includes(task.category)) {
    return true;
  }

  if (isGeneric) {
    const hinted = hintedSpecificZone(task.title);
    if (hinted) return hinted === zone.id;
    return zone.id === "interior";
  }

  return false;
}

function weekEndDate(): Date {
  return addDays(startOfDay(new Date()), 7);
}

export function zoneTaskCounts(
  zone: HomeMapZone,
  overdue: MaintenanceTask[],
  upcoming: MaintenanceTask[]
): { overdueCount: number; dueCount: number; scheduledCount: number } {
  const weekEnd = weekEndDate();
  const overdueCount = overdue.filter((t) => taskMatchesZone(t, zone)).length;
  const dueCount = upcoming.filter(
    (t) =>
      taskMatchesZone(t, zone) &&
      !t.is_completed &&
      new Date(t.due_date) <= weekEnd
  ).length;
  const scheduledCount = upcoming.filter(
    (t) => taskMatchesZone(t, zone) && !t.is_completed
  ).length;
  return { overdueCount, dueCount, scheduledCount };
}

export function zoneState(
  zone: HomeMapZone,
  overdue: MaintenanceTask[],
  upcoming: MaintenanceTask[]
): HomeMapZoneState {
  const { overdueCount, dueCount, scheduledCount } = zoneTaskCounts(
    zone,
    overdue,
    upcoming
  );
  if (overdueCount > 0) return "overdue";
  if (dueCount > 0) return "due";
  if (scheduledCount > 0) return "scheduled";
  return "quiet";
}

export function zoneCaption(
  zone: HomeMapZone,
  state: HomeMapZoneState,
  overdue: MaintenanceTask[],
  upcoming: MaintenanceTask[]
): string {
  const { overdueCount, dueCount } = zoneTaskCounts(zone, overdue, upcoming);
  if (state === "overdue") {
    return `${zone.label} · ${overdueCount} overdue`;
  }
  if (state === "due") {
    return `${zone.label} · ${dueCount} due this week`;
  }
  if (state === "scheduled") {
    return `${zone.label} · on the schedule`;
  }
  return `${zone.label} · all clear`;
}
