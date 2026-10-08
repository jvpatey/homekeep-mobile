import { HomeSystems } from "./homeSystems";
import { toSpringAnswers, toStarterAnswers, toPoolSpaAnswers } from "./homeSystems";
import { filterSpringRefreshItems } from "./springRefresh";
import { filterColdWeatherPrepItems } from "./fallWinter";
import { filterNewHomeownerStarterItems } from "./newHomeownerStarter";
import { getYearRoundSafetyBaseItems } from "./yearRoundSafety";
import { filterPoolSpaItems } from "./poolSpa";
import { filterHomeAgeItems, HOME_AGE_PLAN_ID } from "./homeAgeItems";
import {
  filterHomeFeatureItems,
  HOME_FEATURES_PLAN_ID,
} from "./homeFeatureItems";
import {
  MaintenancePlanItemTemplate,
  routineIdentityKey,
  buildRoutinePayloadsFromItems,
} from "./types";
import { CreateMaintenanceRoutineData } from "../../types/maintenance";
import { recommendInSeasonPlanId } from "../../utils/homeSeason";

export type ScheduledHomeItem = MaintenancePlanItemTemplate & {
  source_plan_id: string;
};

function tag(
  items: MaintenancePlanItemTemplate[],
  source_plan_id: string
): ScheduledHomeItem[] {
  return items.map((item) => ({ ...item, source_plan_id }));
}

function dedupeItems(items: ScheduledHomeItem[]): ScheduledHomeItem[] {
  const seen = new Set<string>();
  const out: ScheduledHomeItem[] = [];
  for (const item of items) {
    const key = routineIdentityKey(
      item.title,
      item.category,
      item.interval_days
    );
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * Builds the merged, de-duplicated checklist for a home profile.
 * Starter + safety always; in-season plan when applicable; pool/spa when owned;
 * optional home features; age-conditional tasks when the year built is known.
 */
export function generateHomeScheduleItems(
  home: HomeSystems,
  options?: { month?: number; latitude?: number | null }
): ScheduledHomeItem[] {
  const month = options?.month ?? new Date().getMonth();
  const latitude = options?.latitude ?? null;
  const merged: ScheduledHomeItem[] = [];

  const starterAnswers = toStarterAnswers(home);
  if (starterAnswers) {
    merged.push(
      ...tag(
        filterNewHomeownerStarterItems(starterAnswers),
        "new-homeowner-starter"
      )
    );
  }

  merged.push(...tag(getYearRoundSafetyBaseItems(), "year-round-safety"));

  const inSeasonId = recommendInSeasonPlanId(month, latitude);
  const springAnswers = toSpringAnswers(home);
  if (inSeasonId === "spring-refresh" && springAnswers) {
    merged.push(
      ...tag(filterSpringRefreshItems(springAnswers), "spring-refresh")
    );
  } else if (inSeasonId === "cold-weather-prep" && springAnswers) {
    merged.push(
      ...tag(filterColdWeatherPrepItems(springAnswers), "cold-weather-prep")
    );
  }

  const poolAnswers = toPoolSpaAnswers(home);
  if (poolAnswers && (poolAnswers.hasPool || poolAnswers.hasSpa)) {
    merged.push(...tag(filterPoolSpaItems(poolAnswers), "pool-spa-care"));
  }

  merged.push(...tag(filterHomeFeatureItems(home), HOME_FEATURES_PLAN_ID));
  merged.push(...tag(filterHomeAgeItems(home), HOME_AGE_PLAN_ID));

  return dedupeItems(merged);
}

export function scheduledItemsToPayloads(
  items: ScheduledHomeItem[],
  anchorDate: Date = new Date()
): CreateMaintenanceRoutineData[] {
  return items.map((item) => {
    const [payload] = buildRoutinePayloadsFromItems([item], anchorDate);
    return {
      ...payload,
      source_plan_id: item.source_plan_id,
    };
  });
}
