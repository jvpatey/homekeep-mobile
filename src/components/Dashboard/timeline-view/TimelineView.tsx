import React, { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { useDevice } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import { MaintenanceTask } from "../../../types/maintenance";
import { Ionicons } from "@expo/vector-icons";
import { timelineStyles } from "./styles";
import { groupTasksByDate, formatDate, getPriorityColor } from "./utils";
import { HOME_MAINTENANCE_CATEGORIES } from "../../../types/maintenance";

// TimelineViewProps interface for the TimelineView component
interface TimelineViewProps {
  tasks: MaintenanceTask[];
  onCompleteTask: (instanceId: string) => void;
  onTaskPress?: (instanceId: string) => void;
  visible?: boolean;
  onContentSizeChange?: (height: number) => void;
}

// TimelineView component for the Dashboard
export function TimelineView({
  tasks,
  onCompleteTask,
  onTaskPress,
  visible = true,
  onContentSizeChange,
}: TimelineViewProps) {
  const { colors, isDark } = useTheme();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  
  const fontMultiplier = getFontMultiplier();

  // Animation for timeline appearance and exit
  const opacity = useSharedValue(visible ? 1 : 0);
  const translateY = useSharedValue(visible ? 0 : -20);

  useEffect(() => {
    if (visible) {
      // Animate in
      opacity.value = withTiming(1, {
        duration: DesignSystem.motion.duration.base,
        easing: DesignSystem.motion.easing.standard,
      });
      translateY.value = withTiming(0, {
        duration: DesignSystem.motion.duration.base,
        easing: DesignSystem.motion.easing.standard,
      });
    } else {
      // Animate out
      opacity.value = withTiming(0, {
        duration: DesignSystem.motion.duration.fast,
        easing: DesignSystem.motion.easing.standard,
      });
      translateY.value = withTiming(-20, {
        duration: DesignSystem.motion.duration.fast,
        easing: DesignSystem.motion.easing.standard,
      });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // groupedTasks function to group the tasks by date
  const groupedTasks = groupTasksByDate(tasks);

  if (tasks.length === 0) {
    return (
      <Animated.View
        style={[
          timelineStyles.emptyContainer,
          { backgroundColor: colors.glass, borderColor: colors.glassBorder },
          animatedStyle,
        ]}
      >
        <View style={[
          timelineStyles.emptyIconContainer,
          isTablet && {
            width: 64 * fontMultiplier,
            height: 64 * fontMultiplier,
            borderRadius: 32 * fontMultiplier,
          },
        ]}>
          <View
            style={[
              timelineStyles.emptyIconBackground,
              {
                backgroundColor: colors.background,
                borderColor: colors.primary,
              },
              isTablet && {
                borderRadius: 30 * fontMultiplier,
                borderWidth: 2 * fontMultiplier,
              },
            ]}
          >
            <View style={[
              timelineStyles.emptyIcon,
              isTablet && {
                width: 60 * fontMultiplier,
                height: 60 * fontMultiplier,
                borderRadius: 30 * fontMultiplier,
              },
            ]}>
              <Ionicons name="calendar" size={isTablet ? 32 * fontMultiplier : 32} color={colors.primary} />
            </View>
          </View>
        </View>
        <Text style={[
          timelineStyles.emptyTitle,
          { color: colors.text },
          isTablet && {
            fontSize: timelineStyles.emptyTitle.fontSize * fontMultiplier,
            lineHeight: (timelineStyles.emptyTitle.fontSize * fontMultiplier) * 1.3,
          },
        ]}>
          No Upcoming Tasks
        </Text>
        <Text
          style={[
            timelineStyles.emptySubtitle,
            { color: colors.textSecondary },
            isTablet && {
              fontSize: (timelineStyles.emptySubtitle.fontSize || 16) * fontMultiplier,
              lineHeight: ((timelineStyles.emptySubtitle.fontSize || 16) * fontMultiplier) * 1.4,
            },
          ]}
        >
          You're all caught up!
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[timelineStyles.container, animatedStyle]}>
      <View style={[
        timelineStyles.header,
        isTablet && {
          paddingHorizontal: getResponsiveValue(
            DesignSystem.spacing.md,
            DesignSystem.spacing.lg,
            DesignSystem.spacing.xl,
          ),
        },
      ]}>
        <Text style={[
          timelineStyles.title,
          { color: colors.text },
          isTablet && {
            fontSize: timelineStyles.title.fontSize * fontMultiplier,
            lineHeight: (timelineStyles.title.fontSize * fontMultiplier) * 1.3,
          },
        ]}>
          Timeline
        </Text>
        <Text
          style={[
            timelineStyles.subtitle,
            { color: colors.textSecondary },
            isTablet && {
              fontSize: (timelineStyles.subtitle.fontSize || 16) * fontMultiplier,
              lineHeight: ((timelineStyles.subtitle.fontSize || 16) * fontMultiplier) * 1.4,
            },
          ]}
        >
          Upcoming tasks
        </Text>
      </View>

      <ScrollView
        style={timelineStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          timelineStyles.scrollContent,
          isTablet && {
            paddingBottom: getResponsiveValue(
              DesignSystem.spacing.xxxl + DesignSystem.spacing.xl,
              DesignSystem.spacing.xxxl + DesignSystem.spacing.xl + DesignSystem.spacing.md,
              DesignSystem.spacing.xxxl + DesignSystem.spacing.xl + DesignSystem.spacing.lg,
            ),
          },
        ]}
        scrollEnabled={false}
        onContentSizeChange={(width, height) => {
          onContentSizeChange?.(height);
        }}
      >
        {groupedTasks.map(({ date, tasks }, groupIndex) => (
          <View key={groupIndex} style={[
            timelineStyles.dateGroup,
            groupIndex === groupedTasks.length - 1 && isTablet && {
              marginBottom: getResponsiveValue(
                DesignSystem.spacing.xl,
                DesignSystem.spacing.xl + DesignSystem.spacing.md,
                DesignSystem.spacing.xl + DesignSystem.spacing.lg,
              ),
            },
          ]}>
            {/* Date Header */}
            <View style={[
              timelineStyles.dateHeader,
              isTablet && {
                paddingHorizontal: getResponsiveValue(
                  DesignSystem.spacing.md,
                  DesignSystem.spacing.lg,
                  DesignSystem.spacing.xl,
                ),
              },
            ]}>
              <View
                style={[
                  timelineStyles.dateIndicator,
                  {
                    backgroundColor: isDark
                      ? "rgba(35, 37, 38, 0.4)"
                      : "rgba(255, 255, 255, 0.4)",
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(255, 255, 255, 0.6)",
                    borderWidth: 1,
                  },
                  isTablet && {
                    width: getResponsiveValue(50, 60, 70),
                    height: getResponsiveValue(50, 60, 70),
                    borderRadius: getResponsiveValue(25, 30, 35),
                  },
                ]}
              >
                <Text
                  style={[
                    timelineStyles.dateNumber,
                    { color: colors.primary },
                    isTablet && {
                      fontSize: timelineStyles.dateNumber.fontSize * fontMultiplier,
                    },
                  ]}
                >
                  {date.getDate()}
                </Text>
                <Text
                  style={[
                    timelineStyles.dateMonth,
                    { color: colors.primary },
                    isTablet && {
                      fontSize: (timelineStyles.dateMonth.fontSize || 12) * fontMultiplier,
                    },
                  ]}
                >
                  {date.toLocaleDateString("en-US", { month: "short" })}
                </Text>
              </View>
              <View style={timelineStyles.dateInfo}>
                <Text style={[
                  timelineStyles.dateText,
                  { color: colors.text },
                  isTablet && {
                    fontSize: timelineStyles.dateText.fontSize * fontMultiplier,
                  },
                ]}>
                  {formatDate(date)}
                </Text>
                <Text
                  style={[
                    timelineStyles.taskCount,
                    { color: colors.textSecondary },
                    isTablet && {
                      fontSize: (timelineStyles.taskCount.fontSize || 14) * fontMultiplier,
                    },
                  ]}
                >
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>

            {/* Tasks for this date */}
            {tasks.map((task, taskIndex) => (
              <TouchableOpacity
                key={task.instance_id}
                style={[
                  timelineStyles.taskItem,
                  taskIndex === tasks.length - 1 && timelineStyles.lastTaskItem,
                  isTablet && {
                    paddingHorizontal: getResponsiveValue(
                      DesignSystem.spacing.md,
                      DesignSystem.spacing.lg,
                      DesignSystem.spacing.xl,
                    ),
                  },
                ]}
                onPress={() => {
                  onTaskPress?.(task.instance_id);
                }}
                activeOpacity={0.7}
              >
                {/* Timeline Line */}
                <View style={[
                  timelineStyles.timelineLine,
                  isTablet && {
                    width: getResponsiveValue(50, 60, 70),
                  },
                ]}>
                  <View
                    style={[
                      timelineStyles.timelineDot,
                      {
                        backgroundColor: colors.primary,
                        borderColor: colors.surface,
                      },
                      isTablet && {
                        width: getResponsiveValue(12, 14, 16),
                        height: getResponsiveValue(12, 14, 16),
                        borderRadius: getResponsiveValue(6, 7, 8),
                        borderWidth: 2 * fontMultiplier,
                      },
                    ]}
                  />
                  {taskIndex !== tasks.length - 1 && (
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

                {/* Task Content */}
                <View
                  style={[
                    timelineStyles.taskContent,
                    {
                      backgroundColor: isDark
                        ? "rgba(35, 37, 38, 0.4)"
                        : "rgba(255, 255, 255, 0.4)",
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(255, 255, 255, 0.6)",
                      borderWidth: 1,
                    },
                    isTablet && {
                      padding: getResponsiveValue(
                        DesignSystem.spacing.md,
                        DesignSystem.spacing.lg,
                        DesignSystem.spacing.xl,
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
                          lineHeight: (timelineStyles.taskTitle.fontSize * fontMultiplier) * 1.3,
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
                              DesignSystem.spacing.md,
                            ),
                            paddingVertical: getResponsiveValue(4, 6, 8),
                          },
                        ]}
                      >
                        <View
                          style={[
                            timelineStyles.priorityDot,
                            {
                              backgroundColor: getPriorityColor(
                                task.priority,
                                colors
                              ),
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
                              fontSize: (timelineStyles.priorityText.fontSize || 12) * fontMultiplier,
                            },
                          ]}
                        >
                          {task.priority}
                        </Text>
                      </View>
                      {task.estimated_duration_minutes && (
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
                                DesignSystem.spacing.md,
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
                                fontSize: (timelineStyles.durationText.fontSize || 12) * fontMultiplier,
                              },
                            ]}
                          >
                            {task.estimated_duration_minutes}m
                          </Text>
                        </View>
                      )}
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

                      let displayText;
                      if (isDueToday) {
                        displayText = "Due today";
                      } else if (isDueTomorrow) {
                        displayText = "Due tomorrow";
                      } else {
                        displayText = `Due ${dueDate.toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}`;
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
                              fontSize: (timelineStyles.taskTime.fontSize || 14) * fontMultiplier,
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
            ))}
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}
