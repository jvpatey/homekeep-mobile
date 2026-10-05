import { useCallback } from "react";
import { Alert } from "react-native";
import { useTasks } from "../../context/TasksContext";
import { useHaptics } from "../../hooks";
import { refreshRecordData } from "../../hooks/useRecordData";
import { usePlusFeature } from "../../lib/plusFeatures";
import { MaintenanceTask, isRepairRoutine } from "../../types/maintenance";

export interface RecordEntryAction {
  label: string;
  icon: "arrow-undo-outline" | "trash-outline" | "lock-closed-outline";
  destructive?: boolean;
  run: () => Promise<boolean>;
}

/**
 * Reversal for a record entry: a scheduled completion can be undone (the task
 * goes back on the schedule); a one-off repair has nothing to return to, so it
 * is deleted.
 */
export function useRecordEntryActions() {
  const { uncompleteTask, deleteTask } = useTasks();
  const { triggerMedium, triggerSuccess } = useHaptics();
  const { locked, unlock } = usePlusFeature("history");

  const undo = useCallback(
    async (task: MaintenanceTask) => {
      await triggerMedium();
      const result = await uncompleteTask(task.instance_id);
      if (!result.success) {
        Alert.alert(
          "Couldn't undo",
          result.error || "Please try again in a moment."
        );
        return false;
      }
      await refreshRecordData();
      return true;
    },
    [triggerMedium, uncompleteTask]
  );

  const removeRepair = useCallback(
    (task: MaintenanceTask) =>
      new Promise<boolean>((resolve) => {
        Alert.alert(
          "Delete this repair?",
          `“${task.title}” will be removed from your history and spend.`,
          [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                const result = await deleteTask(task.id);
                if (!result.success) {
                  Alert.alert(
                    "Couldn't delete",
                    result.error || "Please try again in a moment."
                  );
                  resolve(false);
                  return;
                }
                await triggerSuccess();
                await refreshRecordData();
                resolve(true);
              },
            },
          ]
        );
      }),
    [deleteTask, triggerSuccess]
  );

  return useCallback(
    (task: MaintenanceTask): RecordEntryAction =>
      isRepairRoutine(task)
        ? {
            label: "Delete repair",
            icon: "trash-outline",
            destructive: true,
            run: () => removeRepair(task),
          }
        : locked
          ? {
              label: "Undo completion",
              icon: "lock-closed-outline",
              run: async () => {
                // The paywall can't present over the entry sheet, so let it close first.
                setTimeout(() => void unlock(), 350);
                return true;
              },
            }
          : {
              label: "Undo completion",
              icon: "arrow-undo-outline",
              run: () => undo(task),
            },
    [locked, removeRepair, undo, unlock]
  );
}
