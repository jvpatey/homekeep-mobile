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
import { getPlanTheme } from "../../data/maintenancePlans/planThemes";
import { formatTaskDueLabel } from "../../utils/formatTaskDates";

interface ScheduleTaskRowProps {
  task: MaintenanceTask;
  showConnectorBelow: boolean;
  /** Section variant for row styling */
  variant?: "default" | "overdue";
  onCompleteTask: (instanceId: string) => void;
  isCompleting?: boolean;
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
  isCompleting = false,
  onTaskPress,
  onSkipOccurrence,
}: ScheduleTaskRowProps) {
  const { colors, isDark } = useTheme();
  const isOverdue = variant === "overdue";
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const fontMultiplier = getFontMultiplier();
  const swipeableRef = useRef<Swipeable>(null);

  const planTheme = getPlanTheme(task.source_plan_id ?? undefined);

  const timelineDotFill = isOverdue ? colors.error : colors.primary;
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
      accessibilityLabel={`${isOverdue ? "Overdue. " : ""}${task.title}. ${
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
            backgroundColor: colors.surface,
            borderColor: isOverdue ? colors.error + "55" : colors.border,
            borderWidth: 1,
            borderRadius: DesignSystem.borders.radius.xlarge,
            ...(planTheme && {
              borderLeftWidth: 4,
              borderLeftColor: planTheme.primary,
            }),
          },
          DesignSystem.shadows.softAmbient,
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
              { color: colors.text },
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
                { backgroundColor: colors.fieldFill },
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
                ]}
              />
              <Text
                style={[
                  timelineStyles.priorityText,
                  { color: colors.textSecondary },
                ]}
              >
                {task.priority}
              </Text>
            </View>
            {task.estimated_duration_minutes ? (
              <View
                style={[
                  timelineStyles.durationBadge,
                  { backgroundColor: colors.fieldFill },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    timelineStyles.durationText,
                    { color: colors.textSecondary },
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
                    color: isDueToday ? colors.primary : colors.textSecondary,
                    fontWeight: isDueToday ? "600" : "400",
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
                backgroundColor: colors.primary,
                opacity: isCompleting ? 0.5 : 1,
              },
              isTablet && {
                width: 44 * fontMultiplier,
                height: 44 * fontMultiplier,
                borderRadius: 22 * fontMultiplier,
              },
            ]}
            onPress={() => {
              if (isCompleting || task.is_completed) return;
              onCompleteTask(task.instance_id);
            }}
            disabled={isCompleting || task.is_completed}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ disabled: isCompleting || task.is_completed }}
            accessibilityLabel={
              isCompleting
                ? "Completing"
                : task.is_completed
                  ? "Completed"
                  : "Mark complete"
            }
          >
            {task.is_completed ? (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color="#FFFFFF"
              />
            ) : (
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
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
