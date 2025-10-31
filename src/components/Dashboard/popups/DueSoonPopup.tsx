import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
} from "react-native-reanimated";
import { DesignSystem } from "../../../theme/designSystem";
import {
  MaintenanceTask,
  HOME_MAINTENANCE_CATEGORIES,
  PRIORITIES,
} from "../../../types/maintenance";
import { useTheme } from "../../../context/ThemeContext";

interface DueSoonPopupProps {
  tasks: MaintenanceTask[];
  onClose: () => void;
}

// DueSoonPopup component for the Dashboard
export function DueSoonPopup({ tasks, onClose }: DueSoonPopupProps) {
  const { isDark } = useTheme();

  // Animation values
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const contentOpacity = useSharedValue(0);
  const headerIconScale = useSharedValue(0.5);
  const headerIconRotation = useSharedValue(0);
  const taskCardScale = useSharedValue(0.8);
  const navButtonOpacity = useSharedValue(0);

  // Carousel state
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  // Glass-like blue gradient with subtle transparency
  const glassGradient = isDark
    ? [
        "rgba(59, 130, 246, 0.15)",
        "rgba(29, 78, 216, 0.25)",
        "rgba(15, 23, 42, 0.85)",
      ]
    : [
        "rgba(59, 130, 246, 0.12)",
        "rgba(147, 197, 253, 0.18)",
        "rgba(255, 255, 255, 0.85)",
      ];

  useEffect(() => {
    // Entrance animation - faster and more responsive
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, { damping: 20, stiffness: 180 });
    translateY.value = withTiming(0, { duration: 200 });

    // Header icon animation - reduced delay
    headerIconScale.value = withDelay(
      50,
      withSpring(1, {
        damping: 15,
        stiffness: 150,
      })
    );
    headerIconRotation.value = withDelay(
      50,
      withTiming(360, { duration: 400 })
    );

    // Content animation - faster
    contentOpacity.value = withDelay(
      100,
      withTiming(1, { duration: 200 })
    );

    // Task card animation - faster
    taskCardScale.value = withDelay(
      150,
      withSpring(1, {
        damping: 18,
        stiffness: 180,
      })
    );

    // Navigation buttons animation - faster
    navButtonOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 200 })
    );
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const headerIconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: headerIconScale.value },
      { rotate: `${headerIconRotation.value}deg` },
    ],
  }));

  const taskCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: taskCardScale.value }],
  }));

  const navButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: navButtonOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleClose = () => {
    // Exit animation - faster
    opacity.value = withTiming(0, { duration: 150 });
    scale.value = withTiming(0.95, { duration: 150 });
    translateY.value = withTiming(20, { duration: 150 });

    // Close after animation
    setTimeout(onClose, 150);
  };

  const goToNextTask = () => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    }
  };

  const goToPreviousTask = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1);
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return "Overdue";

    // Show actual date for all other cases
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const renderTaskItem = ({
    item,
    isDark,
  }: {
    item: MaintenanceTask;
    isDark: boolean;
  }) => {
    const categoryInfo = HOME_MAINTENANCE_CATEGORIES[item.category];
    const priorityInfo = PRIORITIES[item.priority];

    return (
      <View
        style={[
          styles.taskItem,
          {
            backgroundColor: isDark
              ? "rgba(59, 130, 246, 0.1)"
              : "rgba(147, 197, 253, 0.12)",
            borderColor: isDark
              ? "rgba(59, 130, 246, 0.2)"
              : "rgba(59, 130, 246, 0.2)",
          },
        ]}
      >
        {/* Task Header with Category Badge */}
        <View style={styles.taskHeader}>
          <View
            style={[
              styles.categoryBadge,
              {
                backgroundColor: isDark
                  ? `${categoryInfo.color}20`
                  : `${categoryInfo.color}15`,
                borderColor: `${categoryInfo.color}40`,
              },
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                {
                  color: isDark
                    ? "rgba(255, 255, 255, 0.95)"
                    : categoryInfo.color,
                },
              ]}
            >
              {item.category === "HVAC"
                ? "HVAC"
                : item.category.charAt(0).toUpperCase() +
                  item.category.slice(1).toLowerCase()}
            </Text>
          </View>
          <View style={styles.urgencyIndicator}>
            <View style={styles.urgencyDot} />
          </View>
        </View>

        {/* Task Title */}
        <Text
          style={[
            styles.taskTitle,
            {
              color: isDark
                ? "rgba(255, 255, 255, 0.95)"
                : "rgba(15, 23, 42, 0.9)",
            },
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        {/* Task Details with Enhanced Layout */}
        <View style={styles.taskDetails}>
          <View style={styles.detailRow}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isDark
                    ? "rgba(59, 130, 246, 0.15)"
                    : "rgba(147, 197, 253, 0.18)",
                  borderColor: isDark
                    ? "rgba(59, 130, 246, 0.25)"
                    : "rgba(59, 130, 246, 0.22)",
                },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={
                  isDark
                    ? "rgba(255, 255, 255, 0.8)"
                    : "rgba(59, 130, 246, 0.85)"
                }
              />
            </View>
            <Text
              style={[
                styles.detailText,
                {
                  color: isDark
                    ? "rgba(255, 255, 255, 0.85)"
                    : "rgba(15, 23, 42, 0.75)",
                },
              ]}
            >
              Due {formatDueDate(item.due_date)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isDark
                    ? "rgba(59, 130, 246, 0.15)"
                    : "rgba(147, 197, 253, 0.18)",
                  borderColor: isDark
                    ? "rgba(59, 130, 246, 0.25)"
                    : "rgba(59, 130, 246, 0.22)",
                },
              ]}
            >
              <Ionicons
                name="flag-outline"
                size={18}
                color={
                  isDark
                    ? "rgba(255, 255, 255, 0.8)"
                    : "rgba(59, 130, 246, 0.85)"
                }
              />
            </View>
            <Text
              style={[
                styles.detailText,
                {
                  color: isDark
                    ? "rgba(255, 255, 255, 0.85)"
                    : "rgba(15, 23, 42, 0.75)",
                },
              ]}
            >
              {priorityInfo.name}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="checkmark-circle"
        size={48}
        color={isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(59, 130, 246, 0.85)"}
      />
      <Text
        style={[
          styles.emptyStateTitle,
          {
            color: isDark
              ? "rgba(255, 255, 255, 0.95)"
              : "rgba(15, 23, 42, 0.9)",
          },
        ]}
      >
        All Caught Up!
      </Text>
    </View>
  );

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.overlayTouchable}
        onPress={handleClose}
        activeOpacity={1}
      />
      <Animated.View
        style={[
          styles.container,
          containerAnimatedStyle,
          {
            backgroundColor: isDark
              ? "rgba(15, 23, 42, 0.85)"
              : "rgba(255, 255, 255, 0.85)",
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(59, 130, 246, 0.3)"
              : "rgba(59, 130, 246, 0.2)",
          },
        ]}
      >
        <LinearGradient
          colors={glassGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          {/* Close Button */}
          <TouchableOpacity
            style={[
              styles.closeButton,
              {
                backgroundColor: isDark
                  ? "rgba(59, 130, 246, 0.15)"
                  : "rgba(59, 130, 246, 0.12)",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(59, 130, 246, 0.3)"
                  : "rgba(59, 130, 246, 0.25)",
              },
            ]}
            onPress={handleClose}
          >
            <Ionicons
              name="close"
              size={22}
              color={
                isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(15, 23, 42, 0.85)"
              }
            />
          </TouchableOpacity>

          {/* Content */}
          <Animated.View style={[styles.content, contentAnimatedStyle]}>
            {/* Header */}
            <View style={styles.header}>
              <Animated.View
                style={[
                  styles.headerIconContainer,
                  {
                    backgroundColor: isDark
                      ? "rgba(59, 130, 246, 0.2)"
                      : "rgba(147, 197, 253, 0.25)",
                    borderWidth: 1,
                    borderColor: isDark
                      ? "rgba(59, 130, 246, 0.4)"
                      : "rgba(59, 130, 246, 0.3)",
                  },
                  headerIconAnimatedStyle,
                ]}
              >
                <View style={styles.headerIcon}>
                  <Ionicons
                    name="time"
                    size={32}
                    color={isDark ? "#60A5FA" : "#2563EB"}
                  />
                </View>
              </Animated.View>
              <Text
                style={[
                  styles.headerTitle,
                  {
                    color: isDark
                      ? "rgba(255, 255, 255, 0.95)"
                      : "rgba(15, 23, 42, 0.9)",
                  },
                ]}
              >
                Due Soon
              </Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  {
                    color: isDark
                      ? "rgba(255, 255, 255, 0.8)"
                      : "rgba(59, 130, 246, 0.85)",
                  },
                ]}
              >
                {tasks.length} task{tasks.length !== 1 ? "s" : ""} coming up
              </Text>
            </View>

            {/* Tasks Display */}
            {tasks.length > 0 ? (
              <View style={styles.tasksContainer}>
                {/* Navigation Arrows */}
                <Animated.View
                  style={[styles.navigationContainer, navButtonAnimatedStyle]}
                >
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      {
                        backgroundColor:
                          currentTaskIndex === 0
                            ? isDark
                              ? "rgba(59, 130, 246, 0.08)"
                              : "rgba(59, 130, 246, 0.06)"
                            : isDark
                            ? "rgba(59, 130, 246, 0.18)"
                            : "rgba(59, 130, 246, 0.15)",
                        borderColor:
                          currentTaskIndex === 0
                            ? isDark
                              ? "rgba(59, 130, 246, 0.15)"
                              : "rgba(59, 130, 246, 0.12)"
                            : isDark
                            ? "rgba(59, 130, 246, 0.3)"
                            : "rgba(59, 130, 246, 0.25)",
                      },
                      currentTaskIndex === 0 && styles.navButtonDisabled,
                    ]}
                    onPress={goToPreviousTask}
                    disabled={currentTaskIndex === 0}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={24}
                      color={
                        currentTaskIndex === 0
                          ? isDark
                            ? "rgba(255, 255, 255, 0.25)"
                            : "rgba(15, 23, 42, 0.3)"
                          : isDark
                          ? "rgba(255, 255, 255, 0.9)"
                          : "rgba(59, 130, 246, 0.9)"
                      }
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      {
                        backgroundColor:
                          currentTaskIndex === tasks.length - 1
                            ? isDark
                              ? "rgba(59, 130, 246, 0.08)"
                              : "rgba(59, 130, 246, 0.06)"
                            : isDark
                            ? "rgba(59, 130, 246, 0.18)"
                            : "rgba(59, 130, 246,ันท 0.15)",
                        borderColor:
                          currentTaskIndex === tasks.length - 1
                            ? isDark
                              ? "rgba(59, 130,位数 246, 0.15)"
                              : "rgba(59, 130, 246, 0.12)"
                            : isDark
                            ? "rgba(59, 130, 246, 0.3)"
                            : "rgba(59, 130, 246, 0.25)",
                      },
                      currentTaskIndex === tasks.length - 1 &&
                        styles.navButtonDisabled,
                    ]}
                    onPress={goToNextTask}
                    disabled={currentTaskIndex === tasks.length - 1}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={
                        currentTaskIndex === tasks.length - 1
                          ? isDark
                            ? "rgba(255, 255, 255, 0.25)"
                            : "rgba(15, 23, 42, 0.3)"
                          : isDark
                          ? "rgba(255, 255, 255, 0.9)"
                          : "rgba(59, 130, 246, 0.9)"
                      }
                    />
                  </TouchableOpacity>
                </Animated.View>

                {/* Current Task */}
                <Animated.View
                  style={[styles.currentTaskContainer, taskCardAnimatedStyle]}
                >
                  {renderTaskItem({ item: tasks[currentTaskIndex], isDark })}
                </Animated.View>

                {/* Pagination Indicator */}
                <View style={styles.paginationContainer}>
                  <Text
                    style={[
                      styles.paginationText,
                      {
                        color: isDark
                          ? "rgba(255, 255, 255, 0.7)"
                          : "rgba(59, 130, 246, 0.75)",
                      },
                    ]}
                  >
                    {currentTaskIndex + 1} of {tasks.length}
                  </Text>
                </View>
              </View>
            ) : (
              renderEmptyState()
            )}
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  overlayTouchable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: "92%",
    maxWidth: 420,
    maxHeight: "85%",
    borderRadius: DesignSystem.borders.radius.xlarge,
    overflow: "hidden",
    ...DesignSystem.shadows.large,
  },
  gradientBackground: {
    padding: DesignSystem.spacing.lg,
  },
  closeButton: {
    position: "absolute",
    top: DesignSystem.spacing.md,
    right: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.xs,
    zIndex: 10,
  },
  content: {
    alignItems: "center",
    paddingTop: DesignSystem.spacing.md,
  },
  header: {
    alignItems: "center",
    marginBottom: DesignSystem.spacing.xl,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...DesignSystem.typography.h1,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.sm,
  },
  headerSubtitle: {
    ...DesignSystem.typography.bodySemiBold,
    textAlign: "center",
  },
  tasksContainer: {
    width: "100%",
    alignItems: "center",
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.sm,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  currentTaskContainer: {
    width: "100%",
    marginBottom: DesignSystem.spacing.md,
  },
  paginationContainer: {
    alignItems: "center",
    marginTop: DesignSystem.spacing.sm,
  },
  paginationText: {
    ...DesignSystem.typography.caption,
    fontSize: 14,
    fontWeight: "500",
  },
  taskItem: {
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.lg,
    borderWidth: 1,
    width: "100%",
    marginBottom: DesignSystem.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  categoryBadge: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borders.radius.small,
    borderWidth: 1,
  },
  categoryText: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    fontSize: 12,
  },
  urgencyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  urgencyDot: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  taskTitle: {
    ...DesignSystem.typography.bodySemiBold,
    fontSize: 18,
    marginBottom: DesignSystem.spacing.md,
    textAlign: "left",
    lineHeight: 24,
  },
  taskDetails: {
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  detailText: {
    ...DesignSystem.typography.caption,
    fontSize: 14,
    fontWeight: "500",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.xl,
  },
  emptyStateTitle: {
    ...DesignSystem.typography.bodySemiBold,
    textAlign: "center",
    marginTop: DesignSystem.spacing.sm,
  },
});
