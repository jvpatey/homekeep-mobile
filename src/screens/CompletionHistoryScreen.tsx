import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { useTasks } from "../hooks/useTasks";
import { MaintenanceTask } from "../types/maintenance";
import { DesignSystem } from "../theme/designSystem";
import { useNavigation } from "@react-navigation/native";
import { AppStackParamList } from "../navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

interface GroupedRoutine {
  routineId: string;
  title: string;
  category: string;
  priority: string;
  estimatedDuration: number;
  intervalDays: number;
  completedInstances: MaintenanceTask[];
  totalInstances: number;
  completionRate: number;
  latestCompletion?: string;
  nextDueDate?: string;
}

export function CompletionHistoryScreen() {
  const { colors } = useTheme();
  const { completedTasks, tasks } = useTasks();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [groupedRoutines, setGroupedRoutines] = useState<GroupedRoutine[]>([]);
  const [expandedRoutines, setExpandedRoutines] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    setGroupedRoutines(groupTasksByRoutine());
  }, [completedTasks]);

  const groupTasksByRoutine = () => {
    const groups: { [key: string]: GroupedRoutine } = {};

    // Group completed tasks by routine
    completedTasks.forEach((task) => {
      const routineId = task.id;
      if (!groups[routineId]) {
        groups[routineId] = {
          routineId,
          title: task.title,
          category: task.category,
          priority: task.priority,
          estimatedDuration: task.estimated_duration_minutes,
          intervalDays: task.interval_days,
          completedInstances: [],
          totalInstances: 0,
          completionRate: 0,
        };
      }
      groups[routineId].completedInstances.push(task);
    });

    // Calculate statistics for each routine
    Object.values(groups).forEach((routine) => {
      // Sort instances by completion date (newest first)
      routine.completedInstances.sort(
        (a, b) =>
          new Date(b.completed_at || "").getTime() -
          new Date(a.completed_at || "").getTime()
      );

      // Calculate completion rate and find latest completion
      routine.totalInstances = routine.completedInstances.length;
      routine.completionRate = 100; // All instances are completed
      routine.latestCompletion = routine.completedInstances[0]?.completed_at;

      // Calculate next due date based on latest completion and interval
      if (routine.latestCompletion && routine.intervalDays > 0) {
        const lastCompletion = new Date(routine.latestCompletion);
        const nextDue = new Date(lastCompletion);
        nextDue.setDate(nextDue.getDate() + routine.intervalDays);
        routine.nextDueDate = nextDue.toISOString();
      }
    });

    return Object.values(groups);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleRoutineExpansion = (routineId: string) => {
    const newExpanded = new Set(expandedRoutines);
    if (newExpanded.has(routineId)) {
      newExpanded.delete(routineId);
    } else {
      newExpanded.add(routineId);
    }
    setExpandedRoutines(newExpanded);
  };

  const renderProgressIndicator = (routine: GroupedRoutine) => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(routine.totalInstances * 5, 100)}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        </View>
        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text
              style={[styles.progressText, { color: colors.textSecondary }]}
            >
              {routine.totalInstances} completed
            </Text>
          </View>
          {routine.intervalDays > 0 && (
            <View style={styles.progressStat}>
              <Ionicons name="refresh" size={16} color={colors.textSecondary} />
              <Text
                style={[styles.progressText, { color: colors.textSecondary }]}
              >
                Every {routine.intervalDays} days
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderRoutineItem = ({ item }: { item: GroupedRoutine }) => {
    const isExpanded = expandedRoutines.has(item.routineId);

    return (
      <View style={[styles.routineItem, { backgroundColor: colors.surface }]}>
        {/* Routine Header */}
        <TouchableOpacity
          style={styles.routineHeader}
          onPress={() => toggleRoutineExpansion(item.routineId)}
          activeOpacity={0.7}
        >
          <View style={styles.routineHeaderLeft}>
            <Text style={[styles.routineTitle, { color: colors.text }]}>
              {item.title}
            </Text>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text style={[styles.categoryText, { color: colors.primary }]}>
                {item.category}
              </Text>
            </View>
          </View>

          <View style={styles.routineHeaderRight}>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Progress Indicator */}
        {renderProgressIndicator(item)}

        {/* Last Completion */}
        <View style={styles.lastCompletion}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text
            style={[styles.lastCompletionText, { color: colors.textSecondary }]}
          >
            Last completed:{" "}
            {item.latestCompletion ? formatDate(item.latestCompletion) : "N/A"}
          </Text>
        </View>

        {/* Expandable Instance Details */}
        {isExpanded && (
          <View style={styles.instanceDetails}>
            <Text style={[styles.instanceTitle, { color: colors.text }]}>
              Completion History
            </Text>
            {item.completedInstances.map((instance, index) => (
              <View key={instance.instance_id} style={styles.instanceItem}>
                <View style={styles.instanceHeader}>
                  <Text
                    style={[
                      styles.instanceDate,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {formatDate(instance.completed_at || "")}
                  </Text>
                  <View style={styles.instancePriority}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#10B981"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="checkmark-circle-outline"
        size={64}
        color={colors.textSecondary}
      />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        No completed tasks yet
      </Text>
      <Text
        style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}
      >
        Complete your first task to see it here!
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Hero Header */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color={colors.surface} />
          </TouchableOpacity>

          {/* Header Content */}
          <View style={styles.heroContent}>
            <Text style={[styles.heroTitle, { color: colors.surface }]}>
              Completion History
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.surface }]}>
              {groupedRoutines.length} routines completed
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Routines List */}
      <FlatList
        data={groupedRoutines}
        renderItem={renderRoutineItem}
        keyExtractor={(item) => item.routineId}
        contentContainerStyle={styles.routinesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    marginBottom: DesignSystem.spacing.lg,
  },
  heroGradient: {
    paddingTop: 52,
    paddingBottom: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.md,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: DesignSystem.spacing.md,
    left: DesignSystem.spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  heroContent: {
    alignItems: "center",
    paddingTop: DesignSystem.spacing.md,
  },
  heroTitle: {
    ...DesignSystem.typography.h1,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: DesignSystem.spacing.sm,
  },
  heroSubtitle: {
    ...DesignSystem.typography.body,
    textAlign: "center",
    opacity: 0.9,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  routinesList: {
    padding: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md,
  },

  routineItem: {
    borderRadius: DesignSystem.borders.radius.medium,
    padding: DesignSystem.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    ...DesignSystem.shadows.small,
    marginBottom: DesignSystem.spacing.md,
    backgroundColor: "white",
  },
  routineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  routineHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  routineHeaderRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  routineTitle: {
    ...DesignSystem.typography.bodySemiBold,
    fontSize: 18,
    lineHeight: 24,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borders.radius.small,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  categoryText: {
    ...DesignSystem.typography.captionSemiBold,
    fontSize: 12,
    fontWeight: "600",
  },
  progressContainer: {
    marginBottom: DesignSystem.spacing.md,
  },
  progressBar: {
    marginBottom: DesignSystem.spacing.sm,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
  },
  progressText: {
    ...DesignSystem.typography.caption,
    fontSize: 12,
  },
  lastCompletion: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.sm,
  },
  lastCompletionText: {
    ...DesignSystem.typography.caption,
    fontSize: 12,
  },
  instanceDetails: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
    paddingTop: DesignSystem.spacing.md,
  },
  instanceTitle: {
    ...DesignSystem.typography.bodySemiBold,
    marginBottom: DesignSystem.spacing.sm,
    fontSize: 14,
  },
  instanceItem: {
    paddingVertical: DesignSystem.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  instanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  instanceDate: {
    ...DesignSystem.typography.caption,
    fontSize: 12,
  },
  instancePriority: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
  },
  priorityText: {
    ...DesignSystem.typography.caption,
    fontSize: 11,
    textTransform: "capitalize",
  },
  detailText: {
    ...DesignSystem.typography.body,
    fontSize: 14,
  },
  priorityIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: DesignSystem.spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.xxl,
  },
  emptyStateTitle: {
    ...DesignSystem.typography.h2,
    marginTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  emptyStateSubtitle: {
    ...DesignSystem.typography.body,
    textAlign: "center",
    opacity: 0.7,
  },
});
