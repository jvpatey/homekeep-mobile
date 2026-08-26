import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { AppStackParamList } from "../../navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { TasksLoadErrorBanner } from "../../components/Dashboard/TasksLoadErrorBanner";
import { useScreenInsets, useDevice } from "../../hooks";
import { Button } from "../../components/ui/Button";
import { HearthScreen } from "../../components/ui";
import { completionHistoryStyles } from "./styles";
import { DesignSystem } from "../../theme/designSystem";
import { colors as palette } from "../../theme/colors";
import {
  GroupedRoutine,
  groupTasksByRoutine,
  formatDate,
  formatDateTime,
} from "./utils";

type ThemePalette = typeof palette.light;

export function CompletionHistoryScreen() {
  const { colors } = useTheme();
  const {
    completedTasks,
    overdueTasks,
    completeTask,
    refreshTasks,
    error: tasksError,
  } = useTasks();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const { scrollPaddingBottom } = useScreenInsets();
  const [groupedRoutines, setGroupedRoutines] = useState<GroupedRoutine[]>([]);
  const [expandedRoutines, setExpandedRoutines] = useState<Set<string>>(
    new Set()
  );
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(
    new Set()
  );
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        try {
          await refreshTasks();
        } finally {
          if (!cancelled) {
            setHasLoadedOnce(true);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [refreshTasks])
  );

  useEffect(() => {
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
    if (completingTasks.has(instanceId)) return;

    setCompletingTasks((prev) => new Set(prev).add(instanceId));

    try {
      const result = await completeTask(instanceId);

      if (result.success) {
        Alert.alert(
          "Task Completed!",
          `"${taskTitle}" has been marked as completed.`,
          [{ text: "OK" }]
        );
      } else {
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

  const renderRoutineSummary = (routine: GroupedRoutine) => {
    const fontMultiplier = getFontMultiplier();
    return (
      <View style={completionHistoryStyles.routineSummary}>
        <View style={completionHistoryStyles.routineSummaryStats}>
          <View style={completionHistoryStyles.routineSummaryStat}>
            <Ionicons
              name="checkmark-circle"
              size={isTablet ? getResponsiveValue(16, 20, 22) : 16}
              color={colors.success}
            />
            <Text
              style={[
                completionHistoryStyles.routineSummaryText,
                { color: colors.textSecondary },
                isTablet && {
                  fontSize:
                    (completionHistoryStyles.routineSummaryText.fontSize || 12) *
                    fontMultiplier,
                },
              ]}
            >
              {routine.completedInstances.length} completed
            </Text>
          </View>
          {routine.pastDueInstances.length > 0 && (
            <View style={completionHistoryStyles.routineSummaryStat}>
              <Ionicons
                name="close-circle"
                size={isTablet ? getResponsiveValue(16, 20, 22) : 16}
                color={colors.error}
              />
              <Text
                style={[
                  completionHistoryStyles.routineSummaryText,
                  { color: colors.error },
                  isTablet && {
                    fontSize:
                      (completionHistoryStyles.routineSummaryText.fontSize ||
                        12) * fontMultiplier,
                  },
                ]}
              >
                {routine.pastDueInstances.length} overdue
              </Text>
            </View>
          )}
          {routine.intervalDays > 0 && (
            <View style={completionHistoryStyles.routineSummaryStat}>
              <Ionicons
                name="refresh"
                size={isTablet ? getResponsiveValue(16, 20, 22) : 16}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  completionHistoryStyles.routineSummaryText,
                  { color: colors.textSecondary },
                  isTablet && {
                    fontSize:
                      (completionHistoryStyles.routineSummaryText.fontSize ||
                        12) * fontMultiplier,
                  },
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

  const renderRoutineSummaryForItem = (routine: GroupedRoutine) => {
    return renderRoutineSummary(routine);
  };

  const RoutineItem = React.memo(
    ({
      item,
      isExpanded,
      onToggle,
      onCompleteOverdueTask,
      completingTasks,
      colors,
      renderSummary,
      isTablet,
      getFontMultiplier,
      getResponsiveValue,
    }: {
      item: GroupedRoutine;
      isExpanded: boolean;
      onToggle: () => void;
      onCompleteOverdueTask: (instanceId: string, taskTitle: string) => void;
      completingTasks: Set<string>;
      colors: ThemePalette;
      renderSummary: (routine: GroupedRoutine) => React.ReactNode;
      isTablet: boolean;
      getFontMultiplier: () => number;
      getResponsiveValue: (
        phone: number,
        tablet: number,
        largeTablet: number
      ) => number;
    }) => {
      const fontMultiplier = getFontMultiplier();
      return (
        <View
          style={[
            completionHistoryStyles.routineItem,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={completionHistoryStyles.routineHeader}
            onPress={onToggle}
            activeOpacity={0.7}
          >
            <View style={completionHistoryStyles.routineHeaderLeft}>
              <Text
                style={[
                  completionHistoryStyles.routineTitle,
                  { color: colors.text },
                  isTablet && {
                    fontSize:
                      (completionHistoryStyles.routineTitle.fontSize || 18) *
                      fontMultiplier,
                    lineHeight:
                      (completionHistoryStyles.routineTitle.fontSize || 18) *
                      fontMultiplier *
                      1.3,
                  },
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <View
                style={[
                  completionHistoryStyles.categoryBadge,
                  {
                    backgroundColor: colors.primary + "15",
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    completionHistoryStyles.categoryText,
                    { color: colors.primary },
                    isTablet && {
                      fontSize:
                        (completionHistoryStyles.categoryText.fontSize || 12) *
                        fontMultiplier,
                    },
                  ]}
                >
                  {item.category}
                </Text>
              </View>
            </View>

            <View style={completionHistoryStyles.routineHeaderRight}>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>

          {renderSummary(item)}

          <View style={completionHistoryStyles.lastCompletion}>
            <Ionicons
              name="calendar-outline"
              size={isTablet ? getResponsiveValue(16, 20, 22) : 16}
              color={colors.textSecondary}
            />
            <Text
              style={[
                completionHistoryStyles.lastCompletionText,
                { color: colors.textSecondary },
                isTablet && {
                  fontSize:
                    (completionHistoryStyles.lastCompletionText.fontSize ||
                      12) * fontMultiplier,
                },
              ]}
            >
              Last completed:{" "}
              {item.latestCompletion
                ? formatDateTime(item.latestCompletion)
                : "N/A"}
            </Text>
          </View>

          {isExpanded && (
            <View
              style={[
                completionHistoryStyles.instanceDetails,
                { borderTopColor: colors.border },
              ]}
            >
              <Text
                style={[
                  completionHistoryStyles.instanceTitle,
                  { color: colors.text },
                  isTablet && {
                    fontSize:
                      (completionHistoryStyles.instanceTitle.fontSize || 14) *
                      fontMultiplier,
                    lineHeight:
                      (completionHistoryStyles.instanceTitle.fontSize || 14) *
                      fontMultiplier *
                      1.3,
                  },
                ]}
              >
                Task History
              </Text>
              {item.completedInstances.map((instance) => (
                <View
                  key={instance.instance_id}
                  style={[
                    completionHistoryStyles.instanceItem,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <View style={completionHistoryStyles.instanceHeader}>
                    <Text
                      style={[
                        completionHistoryStyles.instanceDate,
                        { color: colors.textSecondary },
                        isTablet && {
                          fontSize:
                            (completionHistoryStyles.instanceDate.fontSize ||
                              12) * fontMultiplier,
                        },
                      ]}
                    >
                      Completed:{" "}
                      {instance.completed_at
                        ? formatDateTime(instance.completed_at)
                        : "Date unknown"}
                    </Text>
                    <View style={completionHistoryStyles.instancePriority}>
                      <Ionicons
                        name="checkmark-circle"
                        size={isTablet ? getResponsiveValue(16, 20, 22) : 16}
                        color={colors.success}
                      />
                    </View>
                  </View>
                </View>
              ))}
              {item.pastDueInstances.map((instance) => {
                const isCompleting = completingTasks.has(instance.instance_id);
                return (
                  <View
                    key={instance.instance_id}
                    style={[
                      completionHistoryStyles.instanceItem,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <View style={completionHistoryStyles.instanceHeader}>
                      <Text
                        style={[
                          completionHistoryStyles.instanceDate,
                          { color: colors.textSecondary },
                          isTablet && {
                            fontSize:
                              (completionHistoryStyles.instanceDate.fontSize ||
                                12) * fontMultiplier,
                          },
                        ]}
                      >
                        Past Due: {formatDate(instance.due_date)}
                      </Text>
                      <View style={completionHistoryStyles.instancePriority}>
                        <Ionicons
                          name="close-circle"
                          size={isTablet ? getResponsiveValue(16, 20, 22) : 16}
                          color={colors.error}
                        />
                      </View>
                    </View>

                    <View style={completionHistoryStyles.completeButton}>
                      <Button
                        label={isCompleting ? "Completing…" : "Complete now"}
                        onPress={() =>
                          onCompleteOverdueTask(
                            instance.instance_id,
                            instance.title
                          )
                        }
                        loading={isCompleting}
                        disabled={isCompleting}
                        accessibilityLabel={`Complete overdue task ${instance.title}`}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      );
    }
  );

  const renderRoutineItem = ({
    item,
  }: {
    item: GroupedRoutine;
    index: number;
  }) => {
    const isExpanded = expandedRoutines.has(item.routineId);

    return (
      <RoutineItem
        item={item}
        isExpanded={isExpanded}
        onToggle={() => toggleRoutineExpansion(item.routineId)}
        onCompleteOverdueTask={handleCompleteOverdueTask}
        completingTasks={completingTasks}
        colors={colors}
        renderSummary={renderRoutineSummaryForItem}
        isTablet={isTablet}
        getFontMultiplier={getFontMultiplier}
        getResponsiveValue={getResponsiveValue}
      />
    );
  };

  const renderListEmpty = () => {
    if (!hasLoadedOnce) {
      return (
        <View style={completionHistoryStyles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              completionHistoryStyles.loadingText,
              { color: colors.textSecondary },
            ]}
          >
            Loading history…
          </Text>
        </View>
      );
    }
    const fontMultiplier = getFontMultiplier();
    return (
      <View style={completionHistoryStyles.emptyState}>
        <Ionicons
          name="checkmark-circle-outline"
          size={isTablet ? getResponsiveValue(64, 80, 90) : 64}
          color={colors.textSecondary}
        />
        <Text
          style={[
            completionHistoryStyles.emptyStateTitle,
            { color: colors.text },
            isTablet && {
              fontSize:
                (completionHistoryStyles.emptyStateTitle.fontSize ||
                  DesignSystem.typography.h2.fontSize) * fontMultiplier,
              lineHeight:
                (completionHistoryStyles.emptyStateTitle.fontSize ||
                  DesignSystem.typography.h2.fontSize) *
                fontMultiplier *
                1.2,
            },
          ]}
        >
          No completed tasks yet
        </Text>
        <Text
          style={[
            completionHistoryStyles.emptyStateSubtitle,
            { color: colors.textSecondary },
            isTablet && {
              fontSize:
                (completionHistoryStyles.emptyStateSubtitle.fontSize ||
                  DesignSystem.typography.body.fontSize) * fontMultiplier,
              lineHeight:
                (completionHistoryStyles.emptyStateSubtitle.fontSize ||
                  DesignSystem.typography.body.fontSize) *
                fontMultiplier *
                1.4,
            },
          ]}
        >
          Complete your first task to see it here!
        </Text>
      </View>
    );
  };

  const subtitleText = !hasLoadedOnce
    ? "Loading…"
    : `${completedTasks.length} task${
        completedTasks.length === 1 ? "" : "s"
      } completed`;

  return (
    <HearthScreen style={completionHistoryStyles.container}>
      <View
        style={[
          completionHistoryStyles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={completionHistoryStyles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={completionHistoryStyles.headerTitleBlock}>
          <Text
            style={[completionHistoryStyles.headerTitle, { color: colors.text }]}
          >
            Completion History
          </Text>
          <Text
            style={[
              completionHistoryStyles.headerSubtitle,
              { color: colors.textSecondary },
            ]}
          >
            {subtitleText}
          </Text>
        </View>
        <TouchableOpacity
          style={completionHistoryStyles.headerAction}
          onPress={() => navigation.navigate("HomeSummaryPreview")}
          accessibilityRole="button"
          accessibilityLabel="Export home maintenance summary"
        >
          <Ionicons
            name="document-text-outline"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {tasksError ? (
        <TasksLoadErrorBanner
          message={tasksError}
          onRetry={refreshTasks}
        />
      ) : null}

      <View style={{ flex: 1 }}>
        <FlatList
          data={groupedRoutines}
          renderItem={renderRoutineItem}
          keyExtractor={(item) => item.routineId}
          contentContainerStyle={[
            completionHistoryStyles.routinesList,
            { paddingBottom: scrollPaddingBottom },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderListEmpty}
        />
      </View>
    </HearthScreen>
  );
}
