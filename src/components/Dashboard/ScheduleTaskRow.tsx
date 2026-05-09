import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useDevice } from "../../hooks";
import { MaintenanceTask } from "../../types/maintenance";
import { DesignSystem } from "../../theme/designSystem";
import { timelineStyles } from "./timeline-view/styles";
import { getPriorityColor } from "./timeline-view/utils";
import { hexWithAlpha } from "./popups/popupChrome";
import {
  getPlanTheme,
  getPlanTaskSurfaceStyle,
} from "../../data/maintenancePlans/planThemes";

interface ScheduleTaskRowProps {
  task: MaintenanceTask;
  showConnectorBelow: boolean;
  /** Slightly stronger glass + primary accent for the Due soon section. */
  variant?: "default" | "dueSoon";
  onCompleteTask: (instanceId: string) => void;
  onTaskPress?: (instanceId: string) => void;
}

/** Timeline-style row reused by the unified dashboard schedule list. */
export function ScheduleTaskRow({
  task,
  showConnectorBelow,
  variant = "default",
  onCompleteTask,
  onTaskPress,
}: ScheduleTaskRowProps) {
  const { colors, isDark } = useTheme();
  const isDueSoon = variant === "dueSoon";
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const fontMultiplier = getFontMultiplier();

  const planTheme = getPlanTheme(task.source_plan_id ?? undefined);
  const planSurface = planTheme
    ? getPlanTaskSurfaceStyle(planTheme, isDark)
    : null;

  const defaultGlassBg = isDark
    ? "rgba(35, 37, 38, 0.4)"
    : "rgba(255, 255, 255, 0.4)";
  const defaultGlassBorder = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(255, 255, 255, 0.6)";

  const cardBackground = isDueSoon
    ? isDark
      ? hexWithAlpha(colors.primary, 0.07)
      : hexWithAlpha(colors.primary, 0.05)
    : planSurface
      ? planSurface.backgroundColor
      : defaultGlassBg;

  const cardBorderColor = isDueSoon
    ? hexWithAlpha(colors.primary, isDark ? 0.22 : 0.32)
    : planSurface
      ? planSurface.borderColor
      : defaultGlassBorder;

  const timelineDotFill = isDueSoon
    ? colors.primary
    : planTheme?.primary ?? colors.primary;

  const timelineDotRing = isDueSoon
    ? hexWithAlpha(colors.primary, isDark ? 0.45 : 0.35)
    : colors.surface;

  return (
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
            backgroundColor: cardBackground,
            borderColor: cardBorderColor,
            borderWidth: 1,
            ...(planTheme && !isDueSoon && {
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
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const isDueToday =
              dueDate.toDateString() === today.toDateString();
            const isDueTomorrow =
              dueDate.toDateString() === tomorrow.toDateString();

            let displayText: string;
            if (isDueToday) {
              displayText = "Due today";
            } else if (isDueTomorrow) {
              displayText = "Due tomorrow";
            } else {
              displayText = `Due ${dueDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}`;
            }

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
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.05)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.2)"
                  : "rgba(0, 0, 0, 0.2)",
                borderWidth: 1,
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
                color={
                  isDark
                    ? "rgba(255, 255, 255, 0.7)"
                    : "rgba(15, 23, 42, 0.7)"
                }
              />
            ) : (
              <Ionicons
                name="checkmark"
                size={isTablet ? 20 * fontMultiplier : 20}
                color={
                  isDark
                    ? "rgba(255, 255, 255, 0.6)"
                    : "rgba(15, 23, 42, 0.65)"
                }
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
