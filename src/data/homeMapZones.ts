import { MaintenanceCategory, MaintenanceTask } from "../types/maintenance";
import { HomeSystems } from "./maintenancePlans/homeSystems";
import { startOfDay, addDays } from "date-fns";

export type HomeMapZoneId =
  | "exterior"
  | "hvac"
  | "water"
  | "electrical"
  | "appliances"
  | "yard"
  | "pool"
  | "safety";

export type HomeMapZoneState = "quiet" | "due" | "overdue";

export interface HomeMapZone {
  id: HomeMapZoneId;
  label: string;
  categories: MaintenanceCategory[];
  /** Pool zone matches source_plan_id instead of category. */
  sourcePlanId?: string;
  hidden?: boolean;
}

export function getHomeMapZones(home: HomeSystems | null | undefined): HomeMapZone[] {
  const hasLawn = home?.hasLawn === true;
  const hasPool = home?.hasPool === true || home?.hasSpa === true;

  return [
    {
      id: "exterior",
      label: "Roof & exterior",
      categories: ["EXTERIOR"],
    },
    { id: "hvac", label: "HVAC", categories: ["HVAC"] },
    { id: "water", label: "Water", categories: ["PLUMBING"] },
    { id: "electrical", label: "Electrical", categories: ["ELECTRICAL"] },
    { id: "appliances", label: "Appliances", categories: ["APPLIANCES"] },
    {
      id: "yard",
      label: "Yard",
      categories: ["LANDSCAPING"],
      hidden: !hasLawn,
    },
    {
      id: "pool",
      label: "Pool & spa",
      categories: ["GENERAL"],
      sourcePlanId: "pool-spa-care",
      hidden: !hasPool,
    },
    { id: "safety", label: "Safety", categories: ["SAFETY"] },
  ];
}

export function taskMatchesZone(
  task: MaintenanceTask,
  zone: HomeMapZone
): boolean {
  if (zone.sourcePlanId) {
    return task.source_plan_id === zone.sourcePlanId;
  }
  return zone.categories.includes(task.category);
}

export function zoneState(
  zone: HomeMapZone,
  overdue: MaintenanceTask[],
  upcoming: MaintenanceTask[]
): HomeMapZoneState {
  if (overdue.some((t) => taskMatchesZone(t, zone))) return "overdue";
  const weekEnd = addDays(startOfDay(new Date()), 7);
  const dueSoon = upcoming.some(
    (t) =>
      taskMatchesZone(t, zone) &&
      !t.is_completed &&
      new Date(t.due_date) <= weekEnd
  );
  if (dueSoon) return "due";
  return "quiet";
}

export function zoneCaption(
  zone: HomeMapZone,
  state: HomeMapZoneState,
  overdue: MaintenanceTask[],
  upcoming: MaintenanceTask[]
): string {
  const overdueCount = overdue.filter((t) => taskMatchesZone(t, zone)).length;
  if (state === "overdue") {
    return `${zone.label} · ${overdueCount} overdue`;
  }
  const weekEnd = addDays(startOfDay(new Date()), 7);
  const dueCount = upcoming.filter(
    (t) =>
      taskMatchesZone(t, zone) &&
      !t.is_completed &&
      new Date(t.due_date) <= weekEnd
  ).length;
  if (state === "due") {
    return `${zone.label} · ${dueCount} due this week`;
  }
  return `${zone.label} · all clear`;
}
