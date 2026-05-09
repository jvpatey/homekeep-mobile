import {
  CreateMaintenanceRoutineData,
  MaintenanceCategory,
  Priority,
} from "../../types/maintenance";

/** Display grouping for the plan library (not persisted). */
export type MaintenancePlanTag =
  | "spring"
  | "fall"
  | "safety"
  | "starter"
  | "general";

/** One row in a bundled plan — maps to CreateMaintenanceRoutineData after resolving dates. */
export interface MaintenancePlanItemTemplate {
  title: string;
  description?: string;
  category: MaintenanceCategory;
  priority: Priority;
  estimated_duration_minutes: number;
  interval_days: number;
  /** Days after anchor date (usually today) for first occurrence — avoids stacking every task on one day. */
  start_offset_days?: number;
}

/** Full definition shown in the Maintenance plans screen. */
export interface MaintenancePlanDefinition {
  id: string;
  title: string;
  shortDescription: string;
  /** Optional longer copy on the detail view. */
  body?: string;
  tag?: MaintenancePlanTag;
  items: MaintenancePlanItemTemplate[];
}

export type MaintenancePlanSummary = Pick<
  MaintenancePlanDefinition,
  "id" | "title" | "shortDescription" | "tag"
> & {
  taskCount: number;
};

/** Resolved payloads ready for Supabase insert (single anchor date for the whole apply action). */
export function buildRoutinePayloads(
  plan: MaintenancePlanDefinition,
  anchorDate: Date = new Date()
): CreateMaintenanceRoutineData[] {
  return buildRoutinePayloadsFromItems(plan.items, anchorDate);
}

/** Build payloads from an explicit item list (e.g. after questionnaire filtering). */
export function buildRoutinePayloadsFromItems(
  items: MaintenancePlanItemTemplate[],
  anchorDate: Date = new Date()
): CreateMaintenanceRoutineData[] {
  return items.map((item) => {
    const start = new Date(anchorDate);
    start.setDate(start.getDate() + (item.start_offset_days ?? 0));
    start.setHours(12, 0, 0, 0);
    return {
      title: item.title,
      description: item.description,
      category: item.category,
      priority: item.priority,
      estimated_duration_minutes: item.estimated_duration_minutes,
      interval_days: item.interval_days,
      start_date: start.toISOString(),
    };
  });
}

export function getPlanSummary(plan: MaintenancePlanDefinition): MaintenancePlanSummary {
  return {
    id: plan.id,
    title: plan.title,
    shortDescription: plan.shortDescription,
    tag: plan.tag,
    taskCount: plan.items.length,
  };
}
