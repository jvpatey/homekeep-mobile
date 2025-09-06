import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../hooks/useTasks";
import { useNavigation } from "@react-navigation/native";
import { AppStackParamList } from "../../navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { completionHistoryStyles } from "./styles";
import {
  GroupedRoutine,
  groupTasksByRoutine,
  formatDate,
  formatDateTime,
} from "./utils";

export function CompletionHistoryScreen() {
  const { colors, isDark } = useTheme();
  const { completedTasks, overdueTasks, completeTask, refreshTasks } =
    useTasks();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [groupedRoutines, setGroupedRoutines] = useState<GroupedRoutine[]>([]);
  const [expandedRoutines, setExpandedRoutines] = useState<Set<string>>(
    new Set()
  );
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    // Use the already-filtered overdue tasks from useTasks instead of re-filtering
    setGroupedRoutines(groupTasksByRoutine(completedTasks, overdueTasks));
  }, [completedTasks, overdueTasks]);

  const toggleRoutineExpansion = (routineId: string) => {
    const newExpanded = new Set(expandedRoutines);
    if (newExpanded.has(routineId)) {
      newExpanded.delete(routineId);
    } else {
      newExpanded.add(routineId);
    }
    setExpandedRoutines(newExpanded);
  };

  const handleCompleteOverdueTask = async (
    instanceId: string,
    taskTitle: string
  ) => {
    if (completingTasks.has(instanceId)) return; // Prevent multiple clicks

    setCompletingTasks((prev) => new Set(prev).add(instanceId));

    try {
      const result = await completeTask(instanceId);

      if (result.success) {
        // Refresh all task data to ensure consistency
        await refreshTasks();

        // Show success feedback
        Alert.alert(
          "Task Completed!",
          `"${taskTitle}" has been marked as completed.`,
          [{ text: "OK" }]
        );
      } else {
        // Show error feedback
        Alert.alert(
          "Completion Failed",
          result.error || "Failed to complete the task. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error completing overdue task:", error);
      Alert.alert(
        "Completion Failed",
        "An unexpected error occurred. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setCompletingTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(instanceId);
        return newSet;
      });
    }
  };

  const renderProgressIndicator = (routine: GroupedRoutine) => {
    return (
      <View style={completionHistoryStyles.progressContainer}>
        <View style={completionHistoryStyles.progressBar}>
          <View style={completionHistoryStyles.progressBarBackground}>
            <View
              style={[
                completionHistoryStyles.progressBarFill,
                {
                  width: `${Math.min(routine.totalInstances * 5, 100)}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        </View>
        <View style={completionHistoryStyles.progressStats}>
          <View style={completionHistoryStyles.progressStat}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text
              style={[
                completionHistoryStyles.progressText,
                { color: colors.textSecondary },
              ]}
            >
              {routine.completedInstances.length} completed
            </Text>
          </View>
          {routine.pastDueInstances.length > 0 && (
            <View style={completionHistoryStyles.progressStat}>
              <Ionicons name="close-circle" size={16} color="#EF4444" />
              <Text
                style={[
                  completionHistoryStyles.progressText,
                  { color: "#EF4444" },
                ]}
              >
                {routine.pastDueInstances.length} overdue
              </Text>
            </View>
          )}
          {routine.intervalDays > 0 && (
            <View style={completionHistoryStyles.progressStat}>
              <Ionicons name="refresh" size={16} color={colors.textSecondary} />
              <Text
                style={[
                  completionHistoryStyles.progressText,
                  { color: colors.textSecondary },
                ]}
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
      <View
        style={[
          completionHistoryStyles.routineItem,
          { backgroundColor: colors.surface },
        ]}
      >
        {/* Routine Header */}
        <TouchableOpacity
          style={completionHistoryStyles.routineHeader}
          onPress={() => toggleRoutineExpansion(item.routineId)}
          activeOpacity={0.7}
        >
          <View style={completionHistoryStyles.routineHeaderLeft}>
            <Text
              style={[
                completionHistoryStyles.routineTitle,
                { color: colors.text },
              ]}
            >
              {item.title}
            </Text>
            <View
              style={[
                completionHistoryStyles.categoryBadge,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text
                style={[
                  completionHistoryStyles.categoryText,
                  { color: colors.primary },
                ]}
              >
                {item.category}
              </Text>
            </View>
          </View>

          <View style={completionHistoryStyles.routineHeaderRight}>
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
        <View style={completionHistoryStyles.lastCompletion}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text
            style={[
              completionHistoryStyles.lastCompletionText,
              { color: colors.textSecondary },
            ]}
          >
            Last completed:{" "}
            {item.latestCompletion
              ? formatDateTime(item.latestCompletion)
              : "N/A"}
          </Text>
        </View>

        {/* Expandable Instance Details */}
        {isExpanded && (
          <View style={completionHistoryStyles.instanceDetails}>
            <Text
              style={[
                completionHistoryStyles.instanceTitle,
                { color: colors.text },
              ]}
            >
              Task History
            </Text>
            {item.completedInstances.map((instance, index) => (
              <View
                key={instance.instance_id}
                style={completionHistoryStyles.instanceItem}
              >
                <View style={completionHistoryStyles.instanceHeader}>
                  <Text
                    style={[
                      completionHistoryStyles.instanceDate,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Completed: {formatDateTime(instance.completed_at || "")}
                  </Text>
                  <View style={completionHistoryStyles.instancePriority}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#10B981"
                    />
                  </View>
                </View>
              </View>
            ))}
            {item.pastDueInstances.map((instance, index) => {
              const isCompleting = completingTasks.has(instance.instance_id);
              return (
                <View
                  key={instance.instance_id}
                  style={completionHistoryStyles.instanceItem}
                >
                  <View style={completionHistoryStyles.instanceHeader}>
                    <Text
                      style={[
                        completionHistoryStyles.instanceDate,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Past Due: {formatDate(instance.due_date)}
                    </Text>
                    <View style={completionHistoryStyles.instancePriority}>
                      <Ionicons name="close-circle" size={16} color="#EF4444" />
                    </View>
                  </View>

                  {/* Completion Button for Overdue Tasks */}
                  <TouchableOpacity
                    style={[
                      completionHistoryStyles.completeButton,
                      {
                        backgroundColor: isCompleting
                          ? colors.surface
                          : colors.primary + "10",
                        borderColor: colors.primary,
                        borderWidth: 2,
                        opacity: isCompleting ? 0.6 : 1,
                      },
                    ]}
                    onPress={() =>
                      handleCompleteOverdueTask(
                        instance.instance_id,
                        instance.title
                      )
                    }
                    disabled={isCompleting}
                    activeOpacity={0.8}
                  >
                    {isCompleting ? (
                      <Ionicons
                        name="hourglass"
                        size={16}
                        color={colors.primary}
                      />
                    ) : (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.primary}
                      />
                    )}
                    <Text
                      style={[
                        completionHistoryStyles.completeButtonText,
                        { color: colors.primary },
                      ]}
                    >
                      {isCompleting ? "Completing..." : "Complete Now"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={completionHistoryStyles.emptyState}>
      <Ionicons
        name="checkmark-circle-outline"
        size={64}
        color={colors.textSecondary}
      />
      <Text
        style={[
          completionHistoryStyles.emptyStateTitle,
          { color: colors.text },
        ]}
      >
        No completed tasks yet
      </Text>
      <Text
        style={[
          completionHistoryStyles.emptyStateSubtitle,
          { color: colors.textSecondary },
        ]}
      >
        Complete your first task to see it here!
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        completionHistoryStyles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      {/* Minimalist Header */}
      <View
        style={[
          completionHistoryStyles.heroSection,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={[
            completionHistoryStyles.backButton,
            { backgroundColor: colors.background },
          ]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Header Content */}
        <View style={completionHistoryStyles.heroContent}>
          <Text
            style={[completionHistoryStyles.heroTitle, { color: colors.text }]}
          >
            Completion History
          </Text>
          <Text
            style={[
              completionHistoryStyles.heroSubtitle,
              { color: colors.textSecondary },
            ]}
          >
            {completedTasks.length} tasks completed
          </Text>
        </View>
      </View>

      {/* Routines List */}
      <FlatList
        data={groupedRoutines}
        renderItem={renderRoutineItem}
        keyExtractor={(item) => item.routineId}
        contentContainerStyle={completionHistoryStyles.routinesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}
