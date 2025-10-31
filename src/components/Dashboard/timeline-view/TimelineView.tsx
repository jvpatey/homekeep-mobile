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
}

// TimelineView component for the Dashboard
export function TimelineView({
  tasks,
  onCompleteTask,
  onTaskPress,
  visible = true,
}: TimelineViewProps) {
  const { colors, isDark } = useTheme();

  // Animation for timeline appearance and exit
  const opacity = useSharedValue(visible ? 1 : 0);
  const translateY = useSharedValue(visible ? 0 : -20);

  useEffect(() => {
    if (visible) {
      // Animate in
      opacity.value = withTiming(1, { duration: 400 });
      translateY.value = withTiming(0, { duration: 400 });
    } else {
      // Animate out
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(-20, { duration: 300 });
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
        <View style={timelineStyles.emptyIconContainer}>
          <View
            style={[
              timelineStyles.emptyIconBackground,
              {
                backgroundColor: colors.background,
                borderColor: colors.primary,
              },
            ]}
          >
            <View style={timelineStyles.emptyIcon}>
              <Ionicons name="calendar" size={32} color={colors.primary} />
            </View>
          </View>
        </View>
        <Text style={[timelineStyles.emptyTitle, { color: colors.text }]}>
          No Upcoming Tasks
        </Text>
        <Text
          style={[
            timelineStyles.emptySubtitle,
            { color: colors.textSecondary },
          ]}
        >
          You're all caught up!
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[timelineStyles.container, animatedStyle]}>
      <View style={timelineStyles.header}>
        <Text style={[timelineStyles.title, { color: colors.text }]}>
          Timeline
        </Text>
        <Text
          style={[timelineStyles.subtitle, { color: colors.textSecondary }]}
        >
          Upcoming tasks
        </Text>
      </View>

      <ScrollView
        style={timelineStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={timelineStyles.scrollContent}
      >
        {groupedTasks.map(({ date, tasks }, groupIndex) => (
          <View key={groupIndex} style={timelineStyles.dateGroup}>
            {/* Date Header */}
            <View style={timelineStyles.dateHeader}>
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
                ]}
              >
                <Text
                  style={[timelineStyles.dateNumber, { color: colors.primary }]}
                >
                  {date.getDate()}
                </Text>
                <Text
                  style={[timelineStyles.dateMonth, { color: colors.primary }]}
                >
                  {date.toLocaleDateString("en-US", { month: "short" })}
                </Text>
              </View>
              <View style={timelineStyles.dateInfo}>
                <Text style={[timelineStyles.dateText, { color: colors.text }]}>
                  {formatDate(date)}
                </Text>
                <Text
                  style={[
                    timelineStyles.taskCount,
                    { color: colors.textSecondary },
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
                ]}
                onPress={() => {
                  onTaskPress?.(task.instance_id);
                }}
                activeOpacity={0.7}
              >
                {/* Timeline Line */}
                <View style={timelineStyles.timelineLine}>
                  <View
                    style={[
                      timelineStyles.timelineDot,
                      {
                        backgroundColor: colors.primary,
                        borderColor: colors.surface,
                      },
                    ]}
                  />
                  {taskIndex !== tasks.length - 1 && (
                    <View
                      style={[
                        timelineStyles.timelineConnector,
                        { backgroundColor: colors.border },
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
                          ]}
                        >
                          <Ionicons
                            name="time-outline"
                            size={12}
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
                          borderColor: task.is_completed
                            ? isDark
                              ? "rgba(111, 207, 151, 0.4)"
                              : "rgba(39, 174, 96, 0.4)"
                            : isDark
                            ? "rgba(46, 196, 182, 0.4)"
                            : "rgba(46, 196, 182, 0.4)",
                          borderWidth: 1,
                        },
                      ]}
                      onPress={() => onCompleteTask(task.instance_id)}
                      activeOpacity={0.7}
                    >
                      {task.is_completed ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={
                            isDark
                              ? "rgba(111, 207, 151, 0.6)"
                              : "rgba(39, 174, 96, 0.6)"
                          }
                        />
                      ) : (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={
                            isDark
                              ? "rgba(46, 196, 182, 0.6)"
                              : "rgba(46, 196, 182, 0.6)"
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
