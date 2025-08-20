import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";
import { DesignSystem } from "../../theme/designSystem";
import { Task } from "../../types/task";
import { Ionicons } from "@expo/vector-icons";

interface TimelineViewProps {
  tasks: Task[];
  onCompleteTask: (taskId: string) => void;
  onTaskPress?: (taskId: string) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  tasks,
  onCompleteTask,
  onTaskPress,
}) => {
  const groupTasksByDate = (tasks: Task[]) => {
    const groups: { [key: string]: Task[] } = {};

    tasks.forEach((task) => {
      const date = new Date(task.next_due_date);
      const dateKey = date.toDateString();

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(task);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([dateKey, tasks]) => ({
        date: new Date(dateKey),
        tasks: tasks.sort((a, b) => {
          // Sort by priority first, then by due time
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          const priorityDiff =
            priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;

          return (
            new Date(a.next_due_date).getTime() -
            new Date(b.next_due_date).getTime()
          );
        }),
      }));
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return colors.light.error;
      case "high":
        return "#FF6B35";
      case "medium":
        return colors.light.warning;
      case "low":
        return colors.light.success;
      default:
        return colors.light.textSecondary;
    }
  };

  const groupedTasks = groupTasksByDate(tasks);

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient
          colors={["#F8F9FA", "#E9ECEF"]}
          style={styles.emptyGradient}
        >
          <Ionicons
            name="calendar-outline"
            size={48}
            color={colors.light.textSecondary}
          />
          <Text style={styles.emptyTitle}>No Upcoming Tasks</Text>
          <Text style={styles.emptySubtitle}>You're all caught up!</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Timeline</Text>
        <Text style={styles.subtitle}>Upcoming tasks</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {groupedTasks.map(({ date, tasks }, groupIndex) => (
          <View key={groupIndex} style={styles.dateGroup}>
            {/* Date Header */}
            <View style={styles.dateHeader}>
              <View style={styles.dateIndicator}>
                <Text style={styles.dateNumber}>{date.getDate()}</Text>
                <Text style={styles.dateMonth}>
                  {date.toLocaleDateString("en-US", { month: "short" })}
                </Text>
              </View>
              <View style={styles.dateInfo}>
                <Text style={styles.dateText}>{formatDate(date)}</Text>
                <Text style={styles.taskCount}>
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>

            {/* Tasks for this date */}
            {tasks.map((task, taskIndex) => (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.taskItem,
                  taskIndex === tasks.length - 1 && styles.lastTaskItem,
                ]}
                onPress={() => onTaskPress?.(task.id)}
                activeOpacity={0.7}
              >
                {/* Timeline Line */}
                <View style={styles.timelineLine}>
                  <View style={styles.timelineDot} />
                  {taskIndex !== tasks.length - 1 && (
                    <View style={styles.timelineConnector} />
                  )}
                </View>

                {/* Task Content */}
                <View style={styles.taskContent}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <View style={styles.taskMeta}>
                      <View style={styles.priorityBadge}>
                        <View
                          style={[
                            styles.priorityDot,
                            {
                              backgroundColor: getPriorityColor(task.priority),
                            },
                          ]}
                        />
                        <Text style={styles.priorityText}>{task.priority}</Text>
                      </View>
                      {task.estimated_duration && (
                        <View style={styles.durationBadge}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color={colors.light.textSecondary}
                          />
                          <Text style={styles.durationText}>
                            {task.estimated_duration}m
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.taskFooter}>
                    <Text style={styles.taskTime}>
                      {formatTime(task.next_due_date)}
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.completeButton,
                        task.is_completed && styles.completedButton,
                      ]}
                      onPress={() => onCompleteTask(task.id)}
                      activeOpacity={0.8}
                    >
                      {task.is_completed ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.light.success}
                        />
                      ) : (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={colors.light.surface}
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: DesignSystem.spacing.lg,
  },
  header: {
    paddingHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
  },
  title: {
    ...DesignSystem.typography.h2,
    color: colors.light.text,
  },
  subtitle: {
    ...DesignSystem.typography.body,
    color: colors.light.textSecondary,
    marginTop: DesignSystem.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: DesignSystem.spacing.xxl,
  },
  dateGroup: {
    marginBottom: DesignSystem.spacing.xl,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
  },
  dateIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: DesignSystem.spacing.md,
    ...DesignSystem.shadows.small,
  },
  dateNumber: {
    ...DesignSystem.typography.h4,
    color: colors.light.surface,
    fontWeight: "700",
  },
  dateMonth: {
    ...DesignSystem.typography.caption,
    color: colors.light.surface,
    fontWeight: "600",
  },
  dateInfo: {
    flex: 1,
  },
  dateText: {
    ...DesignSystem.typography.bodySemiBold,
    color: colors.light.text,
  },
  taskCount: {
    ...DesignSystem.typography.small,
    color: colors.light.textSecondary,
    marginTop: 2,
  },
  taskItem: {
    flexDirection: "row",
    paddingHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  lastTaskItem: {
    marginBottom: 0,
  },
  timelineLine: {
    width: 50,
    alignItems: "center",
    marginRight: DesignSystem.spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.light.primary,
    borderWidth: 2,
    borderColor: colors.light.surface,
    ...DesignSystem.shadows.small,
  },
  timelineConnector: {
    width: 2,
    height: 40,
    backgroundColor: colors.light.border,
    marginTop: DesignSystem.spacing.xs,
  },
  taskContent: {
    flex: 1,
    backgroundColor: colors.light.surface,
    borderRadius: DesignSystem.borders.radius.medium,
    padding: DesignSystem.spacing.md,
    ...DesignSystem.shadows.small,
  },
  taskHeader: {
    marginBottom: DesignSystem.spacing.sm,
  },
  taskTitle: {
    ...DesignSystem.typography.bodySemiBold,
    color: colors.light.text,
    marginBottom: DesignSystem.spacing.xs,
  },
  taskMeta: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.background,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 4,
    borderRadius: DesignSystem.borders.radius.small,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: DesignSystem.spacing.xs,
  },
  priorityText: {
    ...DesignSystem.typography.caption,
    color: colors.light.textSecondary,
    textTransform: "capitalize",
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.background,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 4,
    borderRadius: DesignSystem.borders.radius.small,
  },
  durationText: {
    ...DesignSystem.typography.caption,
    color: colors.light.textSecondary,
    marginLeft: DesignSystem.spacing.xs,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskTime: {
    ...DesignSystem.typography.small,
    color: colors.light.textSecondary,
  },
  completeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  completedButton: {
    backgroundColor: colors.light.success,
  },
  emptyContainer: {
    flex: 1,
    marginTop: DesignSystem.spacing.xl,
    marginHorizontal: DesignSystem.spacing.md,
  },
  emptyGradient: {
    flex: 1,
    borderRadius: DesignSystem.borders.radius.large,
    justifyContent: "center",
    alignItems: "center",
    ...DesignSystem.shadows.medium,
  },
  emptyTitle: {
    ...DesignSystem.typography.h3,
    color: colors.light.text,
    marginTop: DesignSystem.spacing.md,
  },
  emptySubtitle: {
    ...DesignSystem.typography.body,
    color: colors.light.textSecondary,
    marginTop: DesignSystem.spacing.xs,
  },
});

export default TimelineView;
