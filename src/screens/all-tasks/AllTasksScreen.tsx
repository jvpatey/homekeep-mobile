import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { useHaptics, useScreenInsets } from "../../hooks";
import { useRequirePlus } from "../../hooks/useRequirePlus";
import { HearthScreen } from "../../components/ui";
import { AllRemindersList } from "../../components/all-reminders";
import { MaintenanceRoutine } from "../../types/maintenance";
import { MaintenanceService } from "../../services/maintenanceService";
import { DesignSystem } from "../../theme/designSystem";
import { AllTasksScreenProps } from "./types";

export function AllTasksScreen({ navigation }: AllTasksScreenProps) {
  const { colors } = useTheme();
  const { deleteTask, resumeTask, refreshTasks } = useTasks();
  const { triggerLight, triggerMedium } = useHaptics();
  const { scrollPaddingBottom } = useScreenInsets();
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
    } catch (error) {
      console.error("Error loading routines:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRoutines();
    }, [loadRoutines])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRoutines();
    setRefreshing(false);
  }, [loadRoutines]);

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
            } catch (error) {
              console.error("Error deleting routine:", error);
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
    } catch (error) {
      console.error("Error resuming routine:", error);
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
    <HearthScreen style={styles.container}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          All reminders
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <AllRemindersList
        routines={routines}
        deletingIds={deletingTasks}
        resumingIds={resumingTasks}
        onResume={(id) => void handleResumeRoutine(id)}
        onDelete={(id, title) => void handleDeleteRoutine(id, title)}
        contentPaddingBottom={scrollPaddingBottom}
        refreshing={refreshing}
        onRefresh={() => void handleRefresh()}
      />
    </HearthScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: DesignSystem.spacing.sm,
    marginLeft: -DesignSystem.spacing.sm,
    minWidth: DesignSystem.components.minTouchTarget,
    minHeight: DesignSystem.components.minTouchTarget,
    justifyContent: "center",
  },
  headerTitle: {
    ...DesignSystem.typography.h4,
    flex: 1,
    textAlign: "center",
  },
  headerRightSpacer: {
    width: DesignSystem.components.minTouchTarget,
  },
});
