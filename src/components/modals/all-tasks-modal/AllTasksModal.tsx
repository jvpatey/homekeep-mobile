import React, { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { useTasks } from "../../../context/TasksContext";
import { useHaptics } from "../../../hooks";
import { useRequirePlus } from "../../../hooks/useRequirePlus";
import { DesignSystem } from "../../../theme/designSystem";
import { HearthSheet } from "../../ui/HearthSheet";
import { AllRemindersList } from "../../all-reminders";
import { MaintenanceRoutine } from "../../../types/maintenance";
import { MaintenanceService } from "../../../services/maintenanceService";

interface AllTasksModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AllTasksModal({ visible, onClose }: AllTasksModalProps) {
  const { colors } = useTheme();
  const { deleteTask, resumeTask, refreshTasks } = useTasks();
  const { triggerLight, triggerMedium } = useHaptics();
  const requirePlus = useRequirePlus();
  const [routines, setRoutines] = useState<MaintenanceRoutine[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingTasks, setDeletingTasks] = useState<Set<string>>(new Set());
  const [resumingTasks, setResumingTasks] = useState<Set<string>>(new Set());

  const loadRoutines = useCallback(async () => {
    try {
      const { data, error } = await MaintenanceService.getMaintenanceRoutines();
      if (error) throw error;
      setRoutines(data || []);
    } catch (err) {
      console.error("Error loading routines:", err);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      void loadRoutines();
    }
  }, [visible, loadRoutines]);

  const handleClose = async () => {
    await triggerLight();
    onClose();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRoutines();
    setRefreshing(false);
  };

  const handleDeleteRoutine = async (
    routineId: string,
    routineTitle: string
  ) => {
    if (deletingTasks.has(routineId)) return;

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
            setDeletingTasks((prev) => new Set(prev).add(routineId));
            try {
              const result = await deleteTask(routineId);
              if (result.success) {
                await triggerLight();
                setRoutines((prev) =>
                  prev.filter((routine) => routine.id !== routineId)
                );
                await refreshTasks();
              } else {
                Alert.alert(
                  "Delete Failed",
                  result.error ||
                    "Failed to delete the reminder. Please try again."
                );
              }
            } catch (err) {
              console.error("Error deleting routine:", err);
              Alert.alert(
                "Delete Failed",
                "An unexpected error occurred. Please try again."
              );
            } finally {
              setDeletingTasks((prev) => {
                const next = new Set(prev);
                next.delete(routineId);
                return next;
              });
            }
          },
        },
      ]
    );
  };

  const handleResumeRoutine = async (routineId: string) => {
    if (resumingTasks.has(routineId)) return;
    if (!(await requirePlus())) return;

    setResumingTasks((prev) => new Set(prev).add(routineId));
    await triggerMedium();
    try {
      const result = await resumeTask(routineId);
      if (result.success) {
        await triggerLight();
        setRoutines((prev) =>
          prev.map((routine) =>
            routine.id === routineId
              ? { ...routine, is_active: true }
              : routine
          )
        );
        await refreshTasks();
      } else {
        Alert.alert(
          "Resume Failed",
          result.error || "Failed to resume this reminder. Please try again."
        );
      }
    } catch (err) {
      console.error("Error resuming routine:", err);
      Alert.alert(
        "Resume Failed",
        "An unexpected error occurred. Please try again."
      );
    } finally {
      setResumingTasks((prev) => {
        const next = new Set(prev);
        next.delete(routineId);
        return next;
      });
    }
  };

  return (
    <HearthSheet
      visible={visible}
      onClose={() => void handleClose()}
      title="All reminders"
      fillMaxHeight
      maxHeightRatio={0.92}
      keyboardAvoiding={false}
      contentStyle={{ paddingHorizontal: 0, flex: 1, backgroundColor: colors.background }}
    >
      <AllRemindersList
        routines={routines}
        deletingIds={deletingTasks}
        resumingIds={resumingTasks}
        onResume={(id) => void handleResumeRoutine(id)}
        onDelete={(id, title) => void handleDeleteRoutine(id, title)}
        contentPaddingBottom={DesignSystem.spacing.xxxl}
        refreshing={refreshing}
        onRefresh={() => void handleRefresh()}
      />
    </HearthSheet>
  );
}
