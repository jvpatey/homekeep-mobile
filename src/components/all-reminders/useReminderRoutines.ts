import { useCallback, useState, useSyncExternalStore } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTasks } from "../../context/TasksContext";
import { useHaptics } from "../../hooks";
import { useRequirePlus } from "../../hooks/useRequirePlus";
import { MaintenanceRoutine } from "../../types/maintenance";
import { MaintenanceService } from "../../services/maintenanceService";

function withId(set: Set<string>, id: string) {
  return new Set(set).add(id);
}

function withoutId(set: Set<string>, id: string) {
  const next = new Set(set);
  next.delete(id);
  return next;
}

interface RoutinesSnapshot {
  routines: MaintenanceRoutine[];
  loaded: boolean;
}

const EMPTY_SNAPSHOT: RoutinesSnapshot = { routines: [], loaded: false };
let snapshot = EMPTY_SNAPSHOT;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: RoutinesSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setRoutines(
  update: (routines: MaintenanceRoutine[]) => MaintenanceRoutine[]
) {
  emit({ ...snapshot, routines: update(snapshot.routines) });
}

/** Every routine (active and paused); dedupes concurrent callers. */
export function refreshRoutines(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data, error } = await MaintenanceService.getMaintenanceRoutines();
      if (error) throw error;
      emit({ routines: data ?? [], loaded: true });
    } catch (error) {
      console.error("Error loading routines:", error);
      emit({ ...snapshot, loaded: true });
    }
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Shared routine list without the delete / resume actions. */
export function useRoutineSnapshot(): RoutinesSnapshot {
  return useSyncExternalStore(subscribe, () => snapshot);
}

/** Clear on sign-out so the next account never sees stale rows. */
export function resetRoutineCache() {
  emit(EMPTY_SNAPSHOT);
}

/** Every routine (active and paused) with delete / resume actions; reloads on focus. */
export function useReminderRoutines() {
  const { deleteTask, resumeTask, refreshTasks } = useTasks();
  const { triggerLight, triggerMedium } = useHaptics();
  const requirePlus = useRequirePlus();
  const { routines, loaded } = useRoutineSnapshot();
  const [refreshing, setRefreshing] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [resumingIds, setResumingIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      void refreshRoutines();
    }, [])
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await refreshRoutines();
    setRefreshing(false);
  }, []);

  const remove = useCallback(
    async (routineId: string, routineTitle: string) => {
      if (deletingIds.has(routineId)) return;
      await triggerMedium();
      Alert.alert(
        "Delete reminder?",
        `Permanently delete “${routineTitle}” and all of its history?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              setDeletingIds((prev) => withId(prev, routineId));
              try {
                const result = await deleteTask(routineId);
                if (result.success) {
                  await triggerLight();
                  setRoutines((prev) => prev.filter((r) => r.id !== routineId));
                  await refreshTasks();
                } else {
                  Alert.alert(
                    "Delete Failed",
                    result.error ||
                      "Failed to delete the reminder. Please try again."
                  );
                }
              } catch (error) {
                console.error("Error deleting routine:", error);
                Alert.alert(
                  "Delete Failed",
                  "An unexpected error occurred. Please try again."
                );
              } finally {
                setDeletingIds((prev) => withoutId(prev, routineId));
              }
            },
          },
        ]
      );
    },
    [deleteTask, deletingIds, refreshTasks, triggerLight, triggerMedium]
  );

  const resume = useCallback(
    async (routineId: string) => {
      if (resumingIds.has(routineId)) return;
      if (!(await requirePlus())) return;

      setResumingIds((prev) => withId(prev, routineId));
      await triggerMedium();
      try {
        const result = await resumeTask(routineId);
        if (result.success) {
          await triggerLight();
          setRoutines((prev) =>
            prev.map((r) => (r.id === routineId ? { ...r, is_active: true } : r))
          );
          await refreshTasks();
        } else {
          Alert.alert(
            "Resume Failed",
            result.error || "Failed to resume this reminder. Please try again."
          );
        }
      } catch (error) {
        console.error("Error resuming routine:", error);
        Alert.alert(
          "Resume Failed",
          "An unexpected error occurred. Please try again."
        );
      } finally {
        setResumingIds((prev) => withoutId(prev, routineId));
      }
    },
    [refreshTasks, requirePlus, resumeTask, resumingIds, triggerLight, triggerMedium]
  );

  return {
    routines,
    loaded,
    refreshing,
    deletingIds,
    resumingIds,
    refresh,
    remove,
    resume,
  };
}
