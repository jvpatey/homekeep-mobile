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
import {
  groupTasksByDate,
  formatDate,
  formatTime,
  getPriorityColor,
} from "./utils";

// TimelineViewProps interface for the TimelineView component
interface TimelineViewProps {
  tasks: MaintenanceTask[];
  onCompleteTask: (instanceId: string) => void;
  onTaskPress?: (instanceId: string) => void;
}

// TimelineView component for the Dashboard
export function TimelineView({
  tasks,
  onCompleteTask,
  onTaskPress,
}: TimelineViewProps) {
  const { colors } = useTheme();

  // Animation for empty state
  const iconScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);

  // useEffect hook to animate the empty state
  useEffect(() => {
    if (tasks.length === 0) {
      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 2000 }),
          withTiming(1, { duration: 2000 })
        ),
        -1,
        true
      );

      // Gentle rotation
      iconRotation.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 3000 }),
          withTiming(-5, { duration: 3000 })
        ),
        -1,
        true
      );
    }
  }, [tasks.length]);

  // iconAnimatedStyle function to animate the icon
  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  // groupedTasks function to group the tasks by date
  const groupedTasks = groupTasksByDate(tasks);

  if (tasks.length === 0) {
    return (
      <View style={timelineStyles.emptyContainer}>
        <LinearGradient
          colors={["#F0F8FF", "#E6F3FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={timelineStyles.emptyGradient}
        >
          <View style={timelineStyles.emptyIconContainer}>
            <LinearGradient
              colors={["#2563EB", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={timelineStyles.emptyIconBackground}
            >
              <Animated.View
                style={[timelineStyles.emptyIcon, iconAnimatedStyle]}
              >
                <Ionicons name="calendar" size={32} color="white" />
              </Animated.View>
            </LinearGradient>
          </View>
          <Text style={[timelineStyles.emptyTitle, { color: colors.primary }]}>
            No Upcoming Tasks
          </Text>
          <Text
            style={[timelineStyles.emptySubtitle, { color: colors.secondary }]}
          >
            You're all caught up!
          </Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={timelineStyles.container}>
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
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={timelineStyles.dateNumber}>{date.getDate()}</Text>
                <Text style={timelineStyles.dateMonth}>
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
                key={task.id}
                style={[
                  timelineStyles.taskItem,
                  taskIndex === tasks.length - 1 && timelineStyles.lastTaskItem,
                ]}
                onPress={() => onTaskPress?.(task.id)}
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
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <View style={timelineStyles.taskHeader}>
                    <Text
                      style={[timelineStyles.taskTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                    <View style={timelineStyles.taskMeta}>
                      <View
                        style={[
                          timelineStyles.priorityBadge,
                          { backgroundColor: colors.background },
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
                            { color: colors.textSecondary },
                          ]}
                        >
                          {task.priority}
                        </Text>
                      </View>
                      {task.estimated_duration_minutes && (
                        <View
                          style={[
                            timelineStyles.durationBadge,
                            { backgroundColor: colors.background },
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
                      )}
                    </View>
                  </View>

                  <View style={timelineStyles.taskFooter}>
                    <Text
                      style={[
                        timelineStyles.taskTime,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {formatTime(task.due_date)}
                    </Text>

                    <TouchableOpacity
                      style={[
                        timelineStyles.completeButton,
                        task.is_completed && timelineStyles.completedButton,
                      ]}
                      onPress={() => onCompleteTask(task.instance_id)}
                      activeOpacity={0.8}
                    >
                      {task.is_completed ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.success}
                        />
                      ) : (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={colors.surface}
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
    </View>
  );
}
