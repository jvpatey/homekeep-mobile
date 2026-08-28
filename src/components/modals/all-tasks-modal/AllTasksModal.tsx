import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useTasks } from "../../../context/TasksContext";
import { useHaptics, useDevice } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import { HearthSheet } from "../../ui/HearthSheet";
import { PriorityMark } from "../../ui/PriorityMark";
import { MaintenanceRoutine } from "../../../types/maintenance";
import { MaintenanceService } from "../../../services/maintenanceService";
import { styles } from "./styles";
import { getPlanTheme } from "../../../data/maintenancePlans/planThemes";

interface AllTasksModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AllTasksModal({ visible, onClose }: AllTasksModalProps) {
  const { colors } = useTheme();
  const { deleteTask, refreshTasks } = useTasks();
  const { triggerLight, triggerMedium } = useHaptics();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const fontMultiplier = getFontMultiplier();
  const [routines, setRoutines] = useState<MaintenanceRoutine[]>([]);
  const [, setLoading] = useState(false);
  const [deletingTasks, setDeletingTasks] = useState<Set<string>>(new Set());

  const loadRoutines = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await MaintenanceService.getMaintenanceRoutines();
      if (error) throw error;
      setRoutines(data || []);
    } catch (err) {
      console.error("Error loading routines:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadRoutines();
    }
  }, [visible, loadRoutines]);

  const handleClose = async () => {
    await triggerLight();
    onClose();
  };

  const handleDeleteRoutine = async (
    routineId: string,
    routineTitle: string
  ) => {
    if (deletingTasks.has(routineId)) return;

    await triggerMedium();
    Alert.alert(
      "Delete Task Series",
      `Are you sure you want to permanently delete "${routineTitle}"? This will remove the entire task series and all its instances.`,
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
                    "Failed to delete the task series. Please try again."
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

  const formatCategory = (category: string) => {
    if (category === "HVAC") return "HVAC";
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  };

  const formatInterval = (intervalDays: number) => {
    if (intervalDays < 7)
      return `Every ${intervalDays} day${intervalDays !== 1 ? "s" : ""}`;
    if (intervalDays === 7) return "Weekly";
    if (intervalDays === 14) return "Bi-weekly";
    if (intervalDays === 30) return "Monthly";
    if (intervalDays === 90) return "Quarterly";
    if (intervalDays === 365) return "Yearly";
    const weeks = Math.round(intervalDays / 7);
    const months = Math.round(intervalDays / 30);
    if (intervalDays % 7 === 0 && weeks <= 8) {
      return `Every ${weeks} week${weeks !== 1 ? "s" : ""}`;
    }
    if (intervalDays % 30 === 0 && months <= 12) {
      return `Every ${months} month${months !== 1 ? "s" : ""}`;
    }
    return `Every ${intervalDays} days`;
  };

  const renderRoutineItem = ({ item }: { item: MaintenanceRoutine }) => {
    const isDeleting = deletingTasks.has(item.id);
    const planTheme = getPlanTheme(item.source_plan_id ?? undefined);

    return (
      <View
        key={item.id}
        style={[
          styles.taskItem,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            ...(planTheme && {
              borderLeftWidth: 4,
              borderLeftColor: planTheme.primary,
            }),
          },
          DesignSystem.shadows.softKey,
          isTablet && {
            padding: getResponsiveValue(16, 20, 24),
            marginBottom: getResponsiveValue(12, 16, 20),
            borderRadius: getResponsiveValue(20, 22, 24),
          },
        ]}
      >
        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Text
              style={[
                styles.taskTitle,
                { color: colors.text },
                isTablet && {
                  fontSize: (styles.taskTitle.fontSize || 16) * fontMultiplier,
                },
              ]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <PriorityMark priority={item.priority} size={8} />
          </View>

          <View style={styles.taskDetails}>
            <Text
              style={[
                styles.taskCategory,
                { color: colors.textSecondary },
                isTablet && {
                  fontSize:
                    (styles.taskCategory.fontSize || 14) * fontMultiplier,
                },
              ]}
            >
              {formatCategory(item.category)}
            </Text>
            <Text
              style={[
                styles.taskInterval,
                { color: colors.textSecondary },
                isTablet && {
                  fontSize:
                    (styles.taskInterval.fontSize || 14) * fontMultiplier,
                },
              ]}
            >
              {formatInterval(item.interval_days)}
            </Text>
          </View>

          {item.estimated_duration_minutes ? (
            <Text
              style={[
                styles.taskDuration,
                { color: colors.textSecondary },
                isTablet && {
                  fontSize:
                    (styles.taskDuration.fontSize || 12) * fontMultiplier,
                },
              ]}
            >
              ~{item.estimated_duration_minutes} min
            </Text>
          ) : null}

          <View style={styles.routineStatus}>
            <Text
              style={[
                styles.statusText,
                { color: colors.textSecondary },
                isTablet && {
                  fontSize: (styles.statusText.fontSize || 12) * fontMultiplier,
                },
              ]}
            >
              {item.is_active ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.deleteButton,
            { backgroundColor: colors.error + "15" },
            isDeleting && styles.deletingButton,
            isTablet && {
              width: getResponsiveValue(40, 48, 52),
              height: getResponsiveValue(40, 48, 52),
              borderRadius: getResponsiveValue(20, 24, 26),
            },
          ]}
          onPress={() => handleDeleteRoutine(item.id, item.title)}
          disabled={isDeleting}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Delete task series ${item.title}`}
        >
          <Ionicons
            name={isDeleting ? "hourglass-outline" : "trash-outline"}
            size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
            color={colors.error}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View
      style={[
        styles.emptyState,
        isTablet && {
          paddingHorizontal: getResponsiveValue(32, 40, 48),
          paddingVertical: getResponsiveValue(64, 80, 96),
        },
      ]}
    >
      <Ionicons
        name="checkmark-circle-outline"
        size={isTablet ? getResponsiveValue(64, 80, 90) : 64}
        color={colors.textSecondary}
      />
      <Text
        style={[
          styles.emptyText,
          { color: colors.text },
          isTablet && {
            fontSize: (styles.emptyText.fontSize || 18) * fontMultiplier,
          },
        ]}
      >
        No task series yet
      </Text>
      <Text
        style={[
          styles.emptySubtext,
          { color: colors.textSecondary },
          isTablet && {
            fontSize: (styles.emptySubtext.fontSize || 14) * fontMultiplier,
          },
        ]}
      >
        Create your first maintenance task series to get started!
      </Text>
    </View>
  );

  return (
    <HearthSheet
      visible={visible}
      onClose={handleClose}
      title={`All task series (${routines.length})`}
      maxHeightRatio={0.92}
      fillMaxHeight
      contentStyle={{ paddingHorizontal: 0 }}
    >
      <FlatList
        style={styles.list}
        data={routines}
        keyExtractor={(item) => item.id}
        renderItem={renderRoutineItem}
        contentContainerStyle={[
          styles.listContent,
          isTablet && { padding: getResponsiveValue(20, 28, 32) },
        ]}
        showsVerticalScrollIndicator
        ListEmptyComponent={renderEmptyState}
      />
    </HearthSheet>
  );
}
