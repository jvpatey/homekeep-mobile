import { MAINTENANCE_PLANS } from "./plans";
import type { MaintenancePlanDefinition } from "./types";

export const STARTER_PLAN_ID = "new-homeowner-starter";
export const POOL_SPA_PLAN_ID = "pool-spa-care";
export const SAFETY_PLAN_ID = "year-round-safety";

/** Unique source_plan_id values from routines already on the schedule. */
export function getAppliedPlanIds(
  routines: Array<{ source_plan_id?: string | null }>
): Set<string> {
  const ids = new Set<string>();
  for (const routine of routines) {
    const id = routine.source_plan_id;
    if (id) ids.add(id);
  }
  return ids;
}

/**
 * Plans shown in the task library. After home setup, starter is hidden —
 * that bundle was already offered during onboarding.
 */
export function getVisibleMaintenancePlans(context: {
  homeSetupComplete: boolean;
}): MaintenancePlanDefinition[] {
  return MAINTENANCE_PLANS.filter((plan) => {
    if (plan.id === STARTER_PLAN_ID && context.homeSetupComplete) {
      return false;
    }
    return true;
  });
}
