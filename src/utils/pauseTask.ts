import { Alert } from "react-native";
import { MaintenanceTask } from "../types/maintenance";

export function confirmPauseTask(task: MaintenanceTask): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      "Pause this reminder?",
      `Pause "${task.title}"? It won’t appear on your schedule or send reminders until you resume it from All reminders.`,
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        {
          text: "Pause",
          style: "destructive",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
