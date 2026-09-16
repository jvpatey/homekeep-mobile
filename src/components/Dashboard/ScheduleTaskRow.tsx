import React, { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import { useTheme } from "../../context/ThemeContext";
import { useDevice } from "../../hooks";
import {
  HOME_MAINTENANCE_CATEGORIES,
  CategoryKey,
  MaintenanceTask,
} from "../../types/maintenance";
import { DesignSystem } from "../../theme/designSystem";
import { timelineStyles } from "./timeline-view/styles";
import { PriorityMark } from "../ui/PriorityMark";
import { hexWithAlpha } from "./popups/popupChrome";
import {
  formatTaskDueLabel,
  formatTaskLatenessLabel,
} from "../../utils/formatTaskDates";
import { isToday, parseISO, isValid } from "date-fns";

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
  const { colors } = useTheme();
  const isOverdue = variant === "overdue";
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const fontMultiplier = getFontMultiplier();
  const swipeableRef = useRef<Swipeable>(null);

  const timelineDotFill = isOverdue ? colors.error : colors.primary;
  const timelineDotRing = colors.surface;
  const category =
    HOME_MAINTENANCE_CATEGORIES[task.category as CategoryKey] ??
    HOME_MAINTENANCE_CATEGORIES.GENERAL;
  const showPriority =
    task.priority === "high" || task.priority === "urgent";
  const dueLabel = isOverdue
    ? formatTaskLatenessLabel(task.due_date)
    : formatTaskDueLabel(task.due_date);
  const dueDate = (() => {
    const parsed = parseISO(task.due_date);
    return isValid(parsed) ? parsed : new Date(task.due_date);
  })();
  const dueIsToday = isValid(dueDate) && isToday(dueDate);

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
        category.displayName
      }. ${dueLabel}.${showPriority ? ` ${task.priority} priority.` : ""}`}
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
            backgroundColor: isOverdue
              ? hexWithAlpha(colors.error, 0.06)
              : colors.surface,
            borderColor: isOverdue
              ? hexWithAlpha(colors.error, 0.38)
              : colors.border,
            borderWidth: 1,
            borderRadius: DesignSystem.borders.radius.xlarge,
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
                  timelineStyles.taskTitle.fontSize * fontMultiplier * 1.3,
              },
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          <View style={rowStyles.metaRow}>
            <View
              style={[
                rowStyles.chip,
                { backgroundColor: hexWithAlpha(category.color, 0.14) },
              ]}
            >
              <View
                style={[
                  rowStyles.chipIcon,
                  { backgroundColor: hexWithAlpha(category.color, 0.22) },
                ]}
              >
                <Ionicons
                  name={category.icon as keyof typeof Ionicons.glyphMap}
                  size={12}
                  color={category.color}
                />
              </View>
              <Text
                style={[rowStyles.chipLabel, { color: colors.text }]}
                numberOfLines={1}
              >
                {category.displayName}
              </Text>
            </View>
            {task.estimated_duration_minutes ? (
              <View
                style={[
                  rowStyles.chip,
                  rowStyles.chipPlain,
                  { backgroundColor: colors.fieldFill },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={13}
                  color={colors.textSecondary}
                />
                <Text
                  style={[rowStyles.chipLabel, { color: colors.textSecondary }]}
                >
                  {task.estimated_duration_minutes}m
                </Text>
              </View>
            ) : null}
            {showPriority ? (
              <View
                style={[
                  rowStyles.chip,
                  rowStyles.chipPlain,
                  { backgroundColor: colors.fieldFill },
                ]}
              >
                <PriorityMark
                  priority={task.priority}
                  showLabel
                  size={6}
                />
              </View>
            ) : null}
          </View>
        </View>

        <View style={timelineStyles.taskFooter}>
          <Text
            style={[
              timelineStyles.taskTime,
              {
                color: isOverdue
                  ? colors.error
                  : dueIsToday
                    ? colors.primary
                    : colors.textSecondary,
                fontWeight: isOverdue || dueIsToday ? "600" : "400",
              },
            ]}
          >
            {dueLabel}
          </Text>

          <TouchableOpacity
            style={[
              timelineStyles.completeButton,
              {
                backgroundColor: colors.primary,
                opacity: isCompleting ? 0.5 : 1,
              },
              rowStyles.completeButton,
              isTablet && {
                width: 40 * fontMultiplier,
                height: 40 * fontMultiplier,
                borderRadius: 20 * fontMultiplier,
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
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 4,
    paddingRight: DesignSystem.spacing.sm,
    paddingVertical: 3,
    borderRadius: DesignSystem.borders.radius.round,
  },
  chipIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  chipPlain: {
    paddingLeft: DesignSystem.spacing.sm,
    paddingVertical: 5,
  },
  chipLabel: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
  },
  completeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
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
