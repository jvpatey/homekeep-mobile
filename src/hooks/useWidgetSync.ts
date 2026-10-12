import { useEffect, useMemo } from "react";
import { MaintenanceTask } from "../types/maintenance";
import { getHomeMapZones } from "../data/homeMapZones";
import {
  HomeSystems,
  isHomeSystemsComplete,
} from "../data/maintenancePlans";
import {
  LastCompletionMap,
  computeAllZoneHealth,
  overallHomeHealth,
} from "../utils/zoneHealth";
import { buildWidgetSnapshot, writeWidgetSnapshot } from "../lib/homeWidget";

/** Mirrors the dashboard's schedule and home health into the iOS widget. No-op elsewhere. */
export function useWidgetSync({
  overdue,
  upcoming,
  lastCompletion,
  home,
  ready,
}: {
  overdue: MaintenanceTask[];
  upcoming: MaintenanceTask[];
  lastCompletion: LastCompletionMap;
  home: HomeSystems | null | undefined;
  /** False until the first task load finishes, so an empty list isn't published. */
  ready: boolean;
}) {
  const health = useMemo(() => {
    if (!isHomeSystemsComplete(home)) return null;
    const zones = getHomeMapZones(home).filter((z) => !z.hidden);
    return overallHomeHealth(
      computeAllZoneHealth(zones, [...overdue, ...upcoming], lastCompletion)
    );
  }, [home, overdue, upcoming, lastCompletion]);

  useEffect(() => {
    if (!ready) return;
    writeWidgetSnapshot(buildWidgetSnapshot({ overdue, upcoming, health }));
  }, [ready, overdue, upcoming, health]);
}
