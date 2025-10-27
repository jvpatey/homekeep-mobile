import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useTasks } from "../../../context/TasksContext";
import { useHaptics } from "../../../hooks";
import { PriorityBadge } from "../../Dashboard";
import { MaintenanceRoutine } from "../../../types/maintenance";
import { MaintenanceService } from "../../../services/maintenanceService";
import { styles } from "./styles";

const { height: screenHeight } = Dimensions.get("window");

interface AllTasksModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AllTasksModal({ visible, onClose }: AllTasksModalProps) {
  const { colors, isDark } = useTheme();
  const { deleteTask } = useTasks();
  const { triggerLight, triggerMedium } = useHaptics();
  const [routines, setRoutines] = useState<MaintenanceRoutine[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingTasks, setDeletingTasks] = useState<Set<string>>(new Set());

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Load routines when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadRoutines();
    }
  }, [visible]);

  // Animate modal
  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withTiming(0, { duration: 250 });
      opacity.value = withTiming(0, { duration: 250 });
    }
  }, [visible]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scale.value, [0, 1], [0.9, 1]) }],
    opacity: opacity.value,
  }));

  const loadRoutines = async () => {
    setLoading(true);
    try {
      const { data, error } = await MaintenanceService.getMaintenanceRoutines();
      if (error) throw error;
      setRoutines(data || []);
    } catch (error) {
      console.error("Error loading routines:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    await triggerLight();
    onClose();
  };

  const handleBackdropPress = () => {
    handleClose();
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
        {
          text: "Cancel",
          style: "cancel",
        },
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
                const newSet = new Set(prev);
                newSet.delete(routineId);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const formatCategory = (category: string) => {
    if (category === "HVAC") {
      return "HVAC";
    }
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  };

  const formatInterval = (intervalDays: number) => {
    if (intervalDays < 7) {
      return `Every ${intervalDays} day${intervalDays !== 1 ? "s" : ""}`;
    } else if (intervalDays === 7) {
      return "Weekly";
    } else if (intervalDays === 14) {
      return "Bi-weekly";
    } else if (intervalDays === 30) {
      return "Monthly";
    } else if (intervalDays === 90) {
      return "Quarterly";
    } else if (intervalDays === 365) {
      return "Yearly";
    } else {
      const weeks = Math.round(intervalDays / 7);
      const months = Math.round(intervalDays / 30);

      if (intervalDays % 7 === 0 && weeks <= 8) {
        return `Every ${weeks} week${weeks !== 1 ? "s" : ""}`;
      } else if (intervalDays % 30 === 0 && months <= 12) {
        return `Every ${months} month${months !== 1 ? "s" : ""}`;
      } else {
        return `Every ${intervalDays} days`;
      }
    }
  };

  const renderRoutineItem = ({ item }: { item: MaintenanceRoutine }) => {
    const isDeleting = deletingTasks.has(item.id);

    return (
      <View
        key={item.id}
        style={[
          styles.taskItem,
          {
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.02)",
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.05)",
          },
        ]}
      >
        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Text
              style={[styles.taskTitle, { color: colors.text }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <PriorityBadge priority={item.priority} />
          </View>

          <View style={styles.taskDetails}>
            <Text
              style={[styles.taskCategory, { color: colors.textSecondary }]}
            >
              {formatCategory(item.category)}
            </Text>
            <Text
              style={[styles.taskInterval, { color: colors.textSecondary }]}
            >
              {formatInterval(item.interval_days)}
            </Text>
          </View>

          {item.estimated_duration_minutes && (
            <Text
              style={[styles.taskDuration, { color: colors.textSecondary }]}
            >
              ~{item.estimated_duration_minutes} min
            </Text>
          )}

          <View style={styles.routineStatus}>
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              {item.is_active ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.deleteButton,
            { backgroundColor: colors.error + "15" },
            isDeleting && styles.deletingButton,
          ]}
          onPress={() => handleDeleteRoutine(item.id, item.title)}
          disabled={isDeleting}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isDeleting ? "hourglass-outline" : "trash-outline"}
            size={20}
            color={colors.error}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="checkmark-circle-outline"
        size={64}
        color={colors.textSecondary}
      />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Mitt : No task series found
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
        Create your first maintenance task series to get started!
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <Pressable
          style={styles.backdropPressable}
          onPress={handleBackdropPress}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor: isDark
                  ? "rgba(35, 37, 38, 0.85)"
                  : "rgba(255, 255, 255, 0.85)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.25)"
                  : "rgba(255, 255, 255, 0.9)",
              },
              animatedModalStyle,
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.08)",
                },
              ]}
            >
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                All Task Series ({routines.length})
              </Text>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.05)",
                  },
                ]}
                onPress={handleClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.flatList}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            >
              {routines.length === 0
                ? renderEmptyState()
                : routines.map((routine) =>
                    renderRoutineItem({ item: routine })
                  )}
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}
