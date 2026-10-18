import { useEffect, useMemo } from "react";
import { MaintenanceTask } from "../types/maintenance";
import { UpkeepResult } from "../utils/upkeep";
import { buildWidgetSnapshot, writeWidgetSnapshot } from "../lib/homeWidget";

/** Mirrors the schedule and upkeep score into the iOS widget. No-op elsewhere. */
export function useWidgetSync({
  overdue,
  upcoming,
  upkeep,
  ready,
}: {
  overdue: MaintenanceTask[];
  upcoming: MaintenanceTask[];
  upkeep: UpkeepResult | null;
  /** False until the first task load finishes, so an empty list isn't published. */
  ready: boolean;
}) {
  const health = useMemo(
    () =>
      upkeep?.state === "scored"
        ? { score: upkeep.score, grade: upkeep.grade }
        : null,
    [upkeep]
  );

  useEffect(() => {
    if (!ready) return;
    writeWidgetSnapshot(buildWidgetSnapshot({ overdue, upcoming, health }));
  }, [ready, overdue, upcoming, health]);
}
