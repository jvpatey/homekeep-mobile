import { Alert } from "react-native";
import { MaintenanceTask } from "../types/maintenance";
import { computeNextOccurrenceDueDate } from "../services/MaintenanceInstanceService";
import { formatTaskDueDate } from "./formatTaskDates";

export function getNextOccurrenceDueDate(
  dueDate: string,
  intervalDays: number
): Date {
  return computeNextOccurrenceDueDate(dueDate, intervalDays);
}

export function confirmSkipTaskOccurrence(
  task: MaintenanceTask
): Promise<boolean> {
  const nextDue = getNextOccurrenceDueDate(task.due_date, task.interval_days);

  return new Promise((resolve) => {
    Alert.alert(
      "Skip this occurrence?",
      `Skip "${task.title}" on ${formatTaskDueDate(task.due_date)}? The next occurrence will be scheduled for ${formatTaskDueDate(nextDue.toISOString())}.`,
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        {
          text: "Skip",
          style: "destructive",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
