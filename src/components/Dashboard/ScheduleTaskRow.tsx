import React, { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import { useTheme } from "../../context/ThemeContext";
import { useDevice } from "../../hooks";
import { MaintenanceTask } from "../../types/maintenance";
import { DesignSystem } from "../../theme/designSystem";
import { timelineStyles } from "./timeline-view/styles";
import { getPriorityColor } from "./timeline-view/utils";
import { hexWithAlpha } from "./popups/popupChrome";
import { getPlanTheme } from "../../data/maintenancePlans/planThemes";
import { formatTaskDueLabel } from "../../utils/formatTaskDates";

interface ScheduleTaskRowProps {
  task: MaintenanceTask;
  showConnectorBelow: boolean;
  /** Section variant (Due soon vs timeline); tile styling matches dashboard glass for both. */
  variant?: "default" | "dueSoon";
  onCompleteTask: (instanceId: string) => void;
  onTaskPress?: (instanceId: string) => void;
  onSkipOccurrence?: (
    task: MaintenanceTask,
    closeSwipe: () => void
  ) => void | Promise<void>;
}

/** Timeline-style row reused by the unified dashboard schedule list. */
export function ScheduleTaskRow({
  task,
  showConnectorBelow,
  variant = "default",
  onCompleteTask,
  onTaskPress,
  onSkipOccurrence,
}: ScheduleTaskRowProps) {
  const { colors, isDark } = useTheme();
  const isDueSoon = variant === "dueSoon";
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const fontMultiplier = getFontMultiplier();
  const swipeableRef = useRef<Swipeable>(null);

  const planTheme = getPlanTheme(task.source_plan_id ?? undefined);

  const defaultGlassBg = isDark
    ? "rgba(35, 37, 38, 0.4)"
    : "rgba(255, 255, 255, 0.4)";
  const defaultGlassBorder = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(255, 255, 255, 0.6)";

  const timelineDotFill = colors.primary;
  const timelineDotRing = colors.surface;

  const canSkip =
    !!onSkipOccurrence && !task.is_completed && task.interval_days > 0;

  const closeSwipe = () => {
    swipeableRef.current?.close();
  };

  const handleSkipPress = () => {
    closeSwipe();
    void onSkipOccurrence?.(task, closeSwipe);
  };

  const renderRightActions = () => (
    <View style={rowStyles.rightActionsContainer}>
      <TouchableOpacity
        style={[rowStyles.skipAction, { backgroundColor: colors.error }]}
        onPress={handleSkipPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Skip this occurrence"
      >
        <Ionicons name="play-skip-forward" size={22} color="#fff" />
        <Text style={rowStyles.skipActionText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );

  const rowContent = (
    <TouchableOpacity
      style={[
        timelineStyles.taskItem,
        !showConnectorBelow && timelineStyles.lastTaskItem,
        isTablet && {
          paddingHorizontal: getResponsiveValue(
            DesignSystem.spacing.md,
            DesignSystem.spacing.lg,
            DesignSystem.spacing.xl
          ),
        },
      ]}
      onPress={() => onTaskPress?.(task.instance_id)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${isDueSoon ? "Due soon. " : ""}${task.title}. ${
        task.priority
      } priority.`}
    >
      <View
        style={[
          timelineStyles.timelineLine,
          isTablet && {
            width: getResponsiveValue(50, 60, 70),
          },
        ]}
      >
        <View
          style={[
            timelineStyles.timelineDot,
            {
              backgroundColor: timelineDotFill,
              borderColor: timelineDotRing,
            },
            isTablet && {
              width: getResponsiveValue(12, 14, 16),
              height: getResponsiveValue(12, 14, 16),
              borderRadius: getResponsiveValue(6, 7, 8),
              borderWidth: 2 * fontMultiplier,
            },
          ]}
        />
        {showConnectorBelow && (
          <View
            style={[
              timelineStyles.timelineConnector,
              { backgroundColor: colors.border },
              isTablet && {
                height: getResponsiveValue(40, 50, 60),
              },
            ]}
          />
        )}
      </View>

      <View
        style={[
          timelineStyles.taskContent,
          {
            backgroundColor: defaultGlassBg,
            borderColor: defaultGlassBorder,
            borderWidth: 1,
            ...(planTheme && {
              borderLeftWidth: 4,
              borderLeftColor: planTheme.primary,
            }),
          },
          isTablet && {
            padding: getResponsiveValue(
              DesignSystem.spacing.md,
              DesignSystem.spacing.lg,
              DesignSystem.spacing.xl
            ),
          },
        ]}
      >
        <View style={timelineStyles.taskHeader}>
          <Text
            style={[
              timelineStyles.taskTitle,
              {
                color: isDark
                  ? "rgba(255, 255, 255, 0.7)"
                  : "rgba(0, 0, 0, 0.6)",
              },
              isTablet && {
                fontSize: timelineStyles.taskTitle.fontSize * fontMultiplier,
                lineHeight:
                  timelineStyles.taskTitle.fontSize *
                  fontMultiplier *
                  1.3,
              },
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          <View style={timelineStyles.taskMeta}>
            <View
              style={[
                timelineStyles.priorityBadge,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.05)",
                },
                isTablet && {
                  paddingHorizontal: getResponsiveValue(
                    DesignSystem.spacing.sm,
                    DesignSystem.spacing.md,
                    DesignSystem.spacing.md
                  ),
                  paddingVertical: getResponsiveValue(4, 6, 8),
                },
              ]}
            >
              <View
                style={[
                  timelineStyles.priorityDot,
                  {
                    backgroundColor: getPriorityColor(task.priority, colors),
                  },
                  isTablet && {
                    width: 6 * fontMultiplier,
                    height: 6 * fontMultiplier,
                    borderRadius: 3 * fontMultiplier,
                  },
                ]}
              />
              <Text
                style={[
                  timelineStyles.priorityText,
                  {
                    color: isDark
                      ? "rgba(255, 255, 255, 0.65)"
                      : "rgba(15, 23, 42, 0.7)",
                  },
                  isTablet && {
                    fontSize:
                      (timelineStyles.priorityText.fontSize || 12) *
                      fontMultiplier,
                  },
                ]}
              >
                {task.priority}
              </Text>
            </View>
            {task.estimated_duration_minutes ? (
              <View
                style={[
                  timelineStyles.durationBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.05)",
                  },
                  isTablet && {
                    paddingHorizontal: getResponsiveValue(
                      DesignSystem.spacing.sm,
                      DesignSystem.spacing.md,
                      DesignSystem.spacing.md
                    ),
                    paddingVertical: getResponsiveValue(4, 6, 8),
                  },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={isTablet ? 12 * fontMultiplier : 12}
                  color={
                    isDark
                      ? "rgba(255, 255, 255, 0.6)"
                      : "rgba(15, 23, 42, 0.65)"
                  }
                />
                <Text
                  style={[
                    timelineStyles.durationText,
                    {
                      color: isDark
                        ? "rgba(255, 255, 255, 0.6)"
                        : "rgba(15, 23, 42, 0.65)",
                    },
                    isTablet && {
                      fontSize:
                        (timelineStyles.durationText.fontSize || 12) *
                        fontMultiplier,
                    },
                  ]}
                >
                  {task.estimated_duration_minutes}m
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={timelineStyles.taskFooter}>
          {(() => {
            const dueDate = new Date(task.due_date);
            const today = new Date();
            const displayText = formatTaskDueLabel(task.due_date);
            const isDueToday =
              dueDate.toDateString() === today.toDateString();

            return (
              <Text
                style={[
                  timelineStyles.taskTime,
                  {
                    color: isDueToday
                      ? isDark
                        ? "rgba(255, 107, 107, 0.7)"
                        : "rgba(235, 87, 87, 0.9)"
                      : isDark
                      ? "rgba(255, 255, 255, 0.6)"
                      : "rgba(15, 23, 42, 0.65)",
                    fontWeight: isDueToday ? "600" : "normal",
                  },
                  isTablet && {
                    fontSize:
                      (timelineStyles.taskTime.fontSize || 14) *
                      fontMultiplier,
                  },
                ]}
              >
                {displayText}
              </Text>
            );
          })()}

          <TouchableOpacity
            style={[
              timelineStyles.completeButton,
              {
                backgroundColor: hexWithAlpha(
                  colors.primary,
                  isDark ? 0.14 : 0.1
                ),
                borderColor: colors.primary,
                borderWidth: 1.5,
              },
              isTablet && {
                width: 48 * fontMultiplier,
                height: 48 * fontMultiplier,
                borderRadius: 24 * fontMultiplier,
              },
            ]}
            onPress={() => onCompleteTask(task.instance_id)}
            activeOpacity={0.8}
            accessibilityLabel={
              task.is_completed ? "Completed" : "Mark complete"
            }
          >
            {task.is_completed ? (
              <Ionicons
                name="checkmark-circle"
                size={isTablet ? 24 * fontMultiplier : 24}
                color={colors.primary}
              />
            ) : (
              <Ionicons
                name="checkmark"
                size={isTablet ? 20 * fontMultiplier : 20}
                color={colors.primary}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!canSkip) {
    return rowContent;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={SKIP_ACTION_WIDTH / 2}
    >
      <View
        style={[rowStyles.swipeForeground, { backgroundColor: colors.background }]}
      >
        {rowContent}
      </View>
    </Swipeable>
  );
}

const SKIP_ACTION_WIDTH = 88;

const rowStyles = StyleSheet.create({
  swipeForeground: {
    width: "100%",
  },
  rightActionsContainer: {
    width: SKIP_ACTION_WIDTH + DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  skipAction: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: DesignSystem.spacing.xs,
    marginRight: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    gap: DesignSystem.spacing.xs,
  },
  skipActionText: {
    ...DesignSystem.typography.smallSemiBold,
    color: "#FFFFFF",
  },
});
