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

/** Confirm clearing a pile of overdue tasks without marking them done. */
export function confirmClearOverdue(
  tasks: MaintenanceTask[]
): Promise<boolean> {
  const count = tasks.length;
  if (count === 0) return Promise.resolve(false);

  const recurring = tasks.filter((t) => t.interval_days > 0).length;
  const oneOff = count - recurring;
  const noun = count === 1 ? "task" : "tasks";

  let detail: string;
  if (recurring > 0 && oneOff > 0) {
    detail = `Recurring reminders move to their next due date. One-time tasks are removed. Nothing is marked done.`;
  } else if (recurring > 0) {
    detail = `They won't be marked done — each reminder moves to its next due date.`;
  } else {
    detail = `They'll be removed from your schedule without being marked done.`;
  }

  return new Promise((resolve) => {
    Alert.alert(
      `Clear ${count} overdue ${noun}?`,
      detail,
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
