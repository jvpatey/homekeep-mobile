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
} from "react-native-reanimated";
import { DesignSystem } from "../../../theme/designSystem";
import {
  MaintenanceTask,
  HOME_MAINTENANCE_CATEGORIES,
  PRIORITIES,
} from "../../../types/maintenance";
import { useTheme } from "../../../context/ThemeContext";
import { useDevice, useGradients } from "../../../hooks";
import { GlassCard } from "../../ui/glass-card/GlassCard";
import { formControlFill } from "../modals/create-task-modal/formChrome";
import { hexWithAlpha } from "./popupChrome";
import { formatTaskDueDate } from "../../../utils/formatTaskDates";

interface DueSoonPopupProps {
  tasks: MaintenanceTask[];
  onClose: () => void;
}

// DueSoonPopup component for the Dashboard
export function DueSoonPopup({ tasks, onClose }: DueSoonPopupProps) {
  const { colors, isDark } = useTheme();
  const { haloGradient } = useGradients();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();

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

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: DesignSystem.motion.duration.fast,
      easing: DesignSystem.motion.easing.standard,
    });
    scale.value = withSpring(1, DesignSystem.motion.spring.snappy);
    translateY.value = withTiming(0, {
      duration: DesignSystem.motion.duration.fast,
      easing: DesignSystem.motion.easing.standard,
    });

    // Header icon animation - reduced delay
    headerIconScale.value = withDelay(
      DesignSystem.motion.stagger,
      withSpring(1, DesignSystem.motion.spring.smooth)
    );
    headerIconRotation.value = withDelay(
      DesignSystem.motion.stagger,
      withTiming(0, { duration: 0 })
    );

    // Content animation - faster
    contentOpacity.value = withDelay(
      DesignSystem.motion.stagger,
      withTiming(1, {
        duration: DesignSystem.motion.duration.base,
        easing: DesignSystem.motion.easing.standard,
      })
    );

    // Task card animation - faster
    taskCardScale.value = withDelay(
      DesignSystem.motion.stagger * 2,
      withSpring(1, DesignSystem.motion.spring.smooth)
    );

    // Navigation buttons animation - faster
    navButtonOpacity.value = withDelay(
      DesignSystem.motion.stagger * 2,
      withTiming(1, {
        duration: DesignSystem.motion.duration.base,
        easing: DesignSystem.motion.easing.standard,
      })
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
    opacity.value = withTiming(0, {
      duration: DesignSystem.motion.duration.fast,
      easing: DesignSystem.motion.easing.standard,
    });
    scale.value = withTiming(0.96, {
      duration: DesignSystem.motion.duration.fast,
      easing: DesignSystem.motion.easing.standard,
    });
    translateY.value = withTiming(20, {
      duration: DesignSystem.motion.duration.fast,
      easing: DesignSystem.motion.easing.standard,
    });

    // Close after animation
    setTimeout(onClose, DesignSystem.motion.duration.fast);
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
            backgroundColor: formControlFill(isDark),
            borderColor: colors.glassStroke,
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
                  color: colors.text,
                },
                isTablet && {
                  fontSize: ((styles.categoryText.fontSize || 12) * getFontMultiplier()),
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
            <View
              style={[
                styles.urgencyDot,
                { backgroundColor: colors.error, shadowColor: colors.error },
              ]}
            />
          </View>
        </View>

        {/* Task Title */}
        <Text
          style={[
            styles.taskTitle,
            { color: colors.text },
            isTablet && {
              fontSize: ((styles.taskTitle.fontSize || 18) * getFontMultiplier()),
              lineHeight: ((styles.taskTitle.fontSize || 18) * getFontMultiplier()) * 1.3,
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
                  backgroundColor: formControlFill(isDark),
                  borderColor: colors.glassStroke,
                },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={isTablet ? getResponsiveValue(18, 22, 24) : 18}
                color={colors.primary}
              />
            </View>
            <Text
              style={[
                styles.detailText,
                { color: colors.textSecondary },
                isTablet && {
                  fontSize: ((styles.detailText.fontSize || 14) * getFontMultiplier()),
                },
              ]}
            >
              Due {formatTaskDueDate(item.due_date)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: formControlFill(isDark),
                  borderColor: colors.glassStroke,
                },
              ]}
            >
              <Ionicons
                name="flag-outline"
                size={isTablet ? getResponsiveValue(18, 22, 24) : 18}
                color={colors.primary}
              />
            </View>
            <Text
              style={[
                styles.detailText,
                { color: colors.textSecondary },
                isTablet && {
                  fontSize: ((styles.detailText.fontSize || 14) * getFontMultiplier()),
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
      <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
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
            borderRadius: DesignSystem.borders.radius.glass,
            overflow: "hidden",
          },
          isTablet && {
            maxWidth: getResponsiveValue(420, 600, 700),
          },
        ]}
      >
        <GlassCard
          material="thick"
          radius={DesignSystem.borders.radius.glass}
          containerStyle={{ width: "100%" }}
          style={{ overflow: "hidden" }}
        >
          <LinearGradient
            colors={[...haloGradient]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[
              styles.gradientBackground,
              { position: "relative" },
              isTablet && {
                padding: getResponsiveValue(
                  DesignSystem.spacing.lg,
                  DesignSystem.spacing.xl,
                  DesignSystem.spacing.xl + DesignSystem.spacing.md,
                ),
              },
            ]}
          >
            <LinearGradient
              pointerEvents="none"
              colors={[
                hexWithAlpha(colors.secondary, isDark ? 0.3 : 0.2),
                hexWithAlpha(colors.secondary, isDark ? 0.17 : 0.11),
                hexWithAlpha(colors.secondary, isDark ? 0.1 : 0.06),
              ]}
              locations={[0, 0.48, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.popupAtmosphere}
            />
            {/* Close Button */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDark
                    ? "rgba(35, 37, 38, 0.55)"
                    : "rgba(255, 255, 255, 0.45)",
                  borderRadius: 20,
                  borderWidth: DesignSystem.borders.hairline,
                  borderColor: colors.glassStroke,
                },
              ]}
              onPress={handleClose}
            >
              <Ionicons
                name="close"
                size={isTablet ? getResponsiveValue(22, 26, 28) : 22}
                color={colors.text}
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
                    backgroundColor: hexWithAlpha(
                      colors.secondary,
                      isDark ? 0.2 : 0.12
                    ),
                    borderWidth: DesignSystem.borders.hairline,
                    borderColor: hexWithAlpha(
                      colors.secondary,
                      isDark ? 0.42 : 0.28
                    ),
                  },
                  headerIconAnimatedStyle,
                  isTablet && {
                    width: getResponsiveValue(64, 80, 96),
                    height: getResponsiveValue(64, 80, 96),
                    borderRadius: getResponsiveValue(32, 40, 48),
                  },
                ]}
              >
                <View style={styles.headerIcon}>
                  <Ionicons
                    name="time"
                    size={isTablet ? getResponsiveValue(32, 40, 48) : 32}
                    color={colors.secondary}
                  />
                </View>
              </Animated.View>
              <Text
                style={[
                  styles.headerTitle,
                  { color: colors.text },
                  isTablet && {
                    fontSize: ((styles.headerTitle.fontSize || DesignSystem.typography.h1.fontSize) * getFontMultiplier()),
                    lineHeight: ((styles.headerTitle.fontSize || DesignSystem.typography.h1.fontSize) * getFontMultiplier()) * 1.2,
                  },
                ]}
              >
                Due Soon
              </Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: colors.textSecondary },
                  isTablet && {
                    fontSize: ((styles.headerSubtitle.fontSize || DesignSystem.typography.bodySemiBold.fontSize) * getFontMultiplier()),
                    lineHeight: ((styles.headerSubtitle.fontSize || DesignSystem.typography.bodySemiBold.fontSize) * getFontMultiplier()) * 1.3,
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
                        backgroundColor: formControlFill(isDark),
                        borderColor: colors.glassStroke,
                        opacity: currentTaskIndex === 0 ? 0.45 : 1,
                      },
                      isTablet && {
                        width: getResponsiveValue(40, 48, 52),
                        height: getResponsiveValue(40, 48, 52),
                        borderRadius: getResponsiveValue(20, 24, 26),
                      },
                    ]}
                    onPress={goToPreviousTask}
                    disabled={currentTaskIndex === 0}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={isTablet ? getResponsiveValue(24, 28, 32) : 24}
                      color={
                        currentTaskIndex === 0
                          ? colors.textSecondary
                          : colors.text
                      }
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      {
                        backgroundColor: formControlFill(isDark),
                        borderColor: colors.glassStroke,
                        opacity:
                          currentTaskIndex === tasks.length - 1 ? 0.45 : 1,
                      },
                      isTablet && {
                        width: getResponsiveValue(40, 48, 52),
                        height: getResponsiveValue(40, 48, 52),
                        borderRadius: getResponsiveValue(20, 24, 26),
                      },
                    ]}
                    onPress={goToNextTask}
                    disabled={currentTaskIndex === tasks.length - 1}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={isTablet ? getResponsiveValue(24, 28, 32) : 24}
                      color={
                        currentTaskIndex === tasks.length - 1
                          ? colors.textSecondary
                          : colors.text
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
                      { color: colors.textSecondary },
                      isTablet && {
                        fontSize:
                          (styles.paginationText.fontSize || 14) *
                          getFontMultiplier(),
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
        </GlassCard>
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
    overflow: "hidden",
  },
  gradientBackground: {
    padding: DesignSystem.spacing.lg,
  },
  popupAtmosphere: {
    ...StyleSheet.absoluteFill,
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
    borderWidth: DesignSystem.borders.hairline,
    width: "100%",
    marginBottom: DesignSystem.spacing.md,
    ...DesignSystem.shadows.softKey,
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
  },
  urgencyDot: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
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
