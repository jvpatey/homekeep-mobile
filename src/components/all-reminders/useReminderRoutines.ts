import { useCallback, useState } from "react";
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

/** Every routine (active and paused) with delete / resume actions; reloads on focus. */
export function useReminderRoutines() {
  const { deleteTask, resumeTask, refreshTasks } = useTasks();
  const { triggerLight, triggerMedium } = useHaptics();
  const requirePlus = useRequirePlus();
  const [routines, setRoutines] = useState<MaintenanceRoutine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [resumingIds, setResumingIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const { data, error } = await MaintenanceService.getMaintenanceRoutines();
      if (error) throw error;
      setRoutines(data || []);
    } catch (error) {
      console.error("Error loading routines:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

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
