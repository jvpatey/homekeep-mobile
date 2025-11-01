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
import { useHaptics, useDevice } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
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
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const fontMultiplier = getFontMultiplier();
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

  // Animate modal - faster and more responsive
  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 20, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
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
          isTablet && {
            padding: getResponsiveValue(16, 20, 24),
            marginBottom: getResponsiveValue(12, 16, 20),
            borderRadius: getResponsiveValue(12, 16, 20),
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
                  fontSize: ((styles.taskTitle.fontSize || 16) * fontMultiplier),
                  lineHeight: ((styles.taskTitle.fontSize || 16) * fontMultiplier) * 1.3,
                },
              ]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <PriorityBadge priority={item.priority} />
          </View>

          <View style={styles.taskDetails}>
            <Text
              style={[
                styles.taskCategory, 
                { color: colors.textSecondary },
                isTablet && {
                  fontSize: ((styles.taskCategory.fontSize || 14) * fontMultiplier),
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
                  fontSize: ((styles.taskInterval.fontSize || 14) * fontMultiplier),
                },
              ]}
            >
              {formatInterval(item.interval_days)}
            </Text>
          </View>

          {item.estimated_duration_minutes && (
            <Text
              style={[
                styles.taskDuration, 
                { color: colors.textSecondary },
                isTablet && {
                  fontSize: ((styles.taskDuration.fontSize || 12) * fontMultiplier),
                },
              ]}
            >
              ~{item.estimated_duration_minutes} min
            </Text>
          )}

          <View style={styles.routineStatus}>
            <Text style={[
              styles.statusText, 
              { color: colors.textSecondary },
              isTablet && {
                fontSize: ((styles.statusText.fontSize || 12) * fontMultiplier),
              },
            ]}>
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
    <View style={[
      styles.emptyState,
      isTablet && {
        paddingHorizontal: getResponsiveValue(32, 40, 48),
        paddingVertical: getResponsiveValue(80, 100, 120),
      },
    ]}>
      <Ionicons
        name="checkmark-circle-outline"
        size={isTablet ? getResponsiveValue(64, 80, 90) : 64}
        color={colors.textSecondary}
      />
      <Text style={[
        styles.emptyText, 
        { color: colors.textSecondary },
        isTablet && {
          fontSize: ((styles.emptyText.fontSize || 18) * fontMultiplier),
          lineHeight: ((styles.emptyText.fontSize || 18) * fontMultiplier) * 1.2,
          marginTop: getResponsiveValue(16, 20, 24),
          marginBottom: getResponsiveValue(8, 12, 16),
        },
      ]}>
        Mitt : No task series found
      </Text>
      <Text style={[
        styles.emptySubtext, 
        { color: colors.textSecondary },
        isTablet && {
          fontSize: ((styles.emptySubtext.fontSize || 14) * fontMultiplier),
          lineHeight: ((styles.emptySubtext.fontSize || 14) * fontMultiplier) * 1.4,
        },
      ]}>
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
              isTablet && {
                maxWidth: getResponsiveValue(420, 600, 700),
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
                isTablet && {
                  paddingTop: getResponsiveValue(20, 28, 32),
                  paddingHorizontal: getResponsiveValue(20, 28, 32),
                  paddingBottom: getResponsiveValue(16, 20, 24),
                },
              ]}
            >
              <Text style={[
                styles.headerTitle, 
                { color: colors.text },
                isTablet && {
                  fontSize: ((styles.headerTitle.fontSize || 22) * fontMultiplier),
                  lineHeight: ((styles.headerTitle.fontSize || 22) * fontMultiplier) * 1.2,
                },
              ]}>
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
                  isTablet && {
                    width: getResponsiveValue(36, 44, 48),
                    height: getResponsiveValue(36, 44, 48),
                    borderRadius: getResponsiveValue(18, 22, 24),
                  },
                ]}
                onPress={handleClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons 
                  name="close" 
                  size={isTablet ? getResponsiveValue(20, 24, 26) : 20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.flatList}
              contentContainerStyle={[
                styles.listContainer,
                isTablet && {
                  padding: getResponsiveValue(20, 28, 32),
                },
              ]}
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
