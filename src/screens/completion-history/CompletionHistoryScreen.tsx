import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../navigation/types";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { TasksLoadErrorBanner } from "../../components/Dashboard/TasksLoadErrorBanner";
import { useHaptics, useScreenInsets } from "../../hooks";
import { HearthScreen, HearthSurfaceCard } from "../../components/ui";
import { completionHistoryStyles } from "./styles";
import { DesignSystem } from "../../theme/designSystem";
import { HOME_MAINTENANCE_CATEGORIES } from "../../types/maintenance";
import type { MaintenanceTask } from "../../types/maintenance";
import { TASK_LIST_LIMIT } from "../../services/MaintenanceTaskService";
import {
  HistoryLookback,
  filterCompletionsByLookback,
  formatCompletionTime,
  groupCompletionsByDay,
  getCompletionHistoryStatus,
  completionHistoryStatusMeta,
  COMPLETION_HISTORY_LEGEND,
} from "./utils";

const LOOKBACK_OPTIONS: { value: HistoryLookback; label: string }[] = [
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: "all", label: "All" },
];

function categoryLabel(category: MaintenanceTask["category"]): string {
  return (
    HOME_MAINTENANCE_CATEGORIES[
      category as keyof typeof HOME_MAINTENANCE_CATEGORIES
    ]?.displayName ?? category
  );
}

export function CompletionHistoryScreen() {
  const { colors } = useTheme();
  const {
    completedTasks,
    uncompleteTask,
    refreshTasks,
    error: tasksError,
  } = useTasks();
  const { triggerLight, triggerMedium } = useHaptics();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { scrollPaddingBottom } = useScreenInsets();

  const [lookback, setLookback] = useState<HistoryLookback>("all");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [undoingIds, setUndoingIds] = useState<Set<string>>(new Set());
  const undoingRef = useRef<Set<string>>(new Set());
  const [undoErrors, setUndoErrors] = useState<Record<string, string>>({});

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

  const filteredTasks = useMemo(
    () => filterCompletionsByLookback(completedTasks, lookback),
    [completedTasks, lookback]
  );

  const sections = useMemo(
    () => groupCompletionsByDay(filteredTasks),
    [filteredTasks]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshTasks();
    } finally {
      setRefreshing(false);
      setHasLoadedOnce(true);
    }
  }, [refreshTasks]);

  const handleLookback = useCallback(
    (value: HistoryLookback) => {
      void triggerLight();
      setLookback(value);
    },
    [triggerLight]
  );

  const handleUndo = useCallback(
    async (task: MaintenanceTask) => {
      if (undoingRef.current.has(task.instance_id)) return;

      undoingRef.current.add(task.instance_id);
      setUndoingIds(new Set(undoingRef.current));
      setUndoErrors((prev) => {
        const next = { ...prev };
        delete next[task.instance_id];
        return next;
      });
      await triggerMedium();

      try {
        const result = await uncompleteTask(task.instance_id);
        if (!result.success) {
          setUndoErrors((prev) => ({
            ...prev,
            [task.instance_id]:
              result.error || "Could not undo. Please try again.",
          }));
        }
      } catch (error) {
        console.error("Error undoing completion:", error);
        setUndoErrors((prev) => ({
          ...prev,
          [task.instance_id]: "Could not undo. Please try again.",
        }));
      } finally {
        undoingRef.current.delete(task.instance_id);
        setUndoingIds(new Set(undoingRef.current));
      }
    },
    [triggerMedium, uncompleteTask]
  );

  const renderRow = (
    task: MaintenanceTask,
    isLast: boolean
  ) => {
    const undoing = undoingIds.has(task.instance_id);
    const error = undoErrors[task.instance_id];
    const notes = task.notes?.trim();
    const timeLabel = formatCompletionTime(
      task.completed_at || task.due_date
    );
    const statusMeta = completionHistoryStatusMeta(
      getCompletionHistoryStatus(task)
    );
    const statusColor = colors[statusMeta.colorKey];
    const meta = `${statusMeta.label} · ${categoryLabel(task.category)} · ${timeLabel}`;

    return (
      <View
        key={task.instance_id}
        style={[
          completionHistoryStyles.row,
          !isLast && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            completionHistoryStyles.rowIcon,
            { backgroundColor: statusColor + "22" },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons name={statusMeta.icon} size={18} color={statusColor} />
        </View>
        <View style={completionHistoryStyles.rowMain}>
          <Text
            style={[
              completionHistoryStyles.rowTitle,
              { color: colors.text },
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          <Text
            style={[
              completionHistoryStyles.rowMeta,
              { color: colors.textSecondary },
            ]}
          >
            {meta}
          </Text>
          {notes ? (
            <Text
              style={[
                completionHistoryStyles.rowNotes,
                { color: colors.textSecondary },
              ]}
            >
              {notes}
            </Text>
          ) : null}
          {error ? (
            <Text
              style={[
                completionHistoryStyles.rowError,
                { color: colors.error },
              ]}
              accessibilityLiveRegion="polite"
            >
              {error}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={completionHistoryStyles.undoButton}
          onPress={() => void handleUndo(task)}
          disabled={undoing}
          accessibilityRole="button"
          accessibilityLabel={`Undo ${statusMeta.label.toLowerCase()} of ${task.title}`}
          accessibilityState={{ disabled: undoing }}
        >
          <Text
            style={[
              completionHistoryStyles.undoText,
              { color: colors.primary, opacity: undoing ? 0.5 : 1 },
            ]}
          >
            {undoing ? "Undoing…" : "Undo"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSection = ({
    item: section,
    index,
  }: {
    item: ReturnType<typeof groupCompletionsByDay>[number];
    index: number;
  }) => (
    <View>
      <Text
        style={[
          completionHistoryStyles.sectionHeader,
          { color: colors.textSecondary, marginTop: index === 0 ? 0 : undefined },
        ]}
        accessibilityRole="header"
      >
        {section.title}
      </Text>
      <HearthSurfaceCard
        containerStyle={completionHistoryStyles.cardContainer}
        style={completionHistoryStyles.cardSurface}
      >
        {section.data.map((task, rowIndex) =>
          renderRow(task, rowIndex === section.data.length - 1)
        )}
      </HearthSurfaceCard>
    </View>
  );

  const listHeader = (
    <View style={completionHistoryStyles.listHeader}>
      <View style={completionHistoryStyles.chipRow}>
        {LOOKBACK_OPTIONS.map((option) => {
          const selected = lookback === option.value;
          return (
            <TouchableOpacity
              key={String(option.value)}
              onPress={() => handleLookback(option.value)}
              style={[
                completionHistoryStyles.chip,
                {
                  backgroundColor: selected
                    ? colors.primary + "18"
                    : colors.fieldFill,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Show ${option.label}`}
            >
              <Text
                style={[
                  completionHistoryStyles.chipText,
                  {
                    color: selected ? colors.primary : colors.textSecondary,
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {hasLoadedOnce ? (
        <Text
          style={[
            completionHistoryStyles.subtitle,
            { color: colors.textSecondary },
          ]}
        >
          {filteredTasks.length === 0
            ? lookback === "all"
              ? "No completions yet"
              : "No completions in this range"
            : `${filteredTasks.length} completion${
                filteredTasks.length === 1 ? "" : "s"
              }`}
        </Text>
      ) : null}
      {filteredTasks.length > 0 ? (
        <View style={completionHistoryStyles.legendRow}>
          {COMPLETION_HISTORY_LEGEND.map((item) => (
            <View key={item.status} style={completionHistoryStyles.legendItem}>
              <Ionicons
                name={item.icon}
                size={14}
                color={colors[item.colorKey]}
              />
              <Text
                style={[
                  completionHistoryStyles.legendText,
                  { color: colors.textSecondary },
                ]}
              >
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {completedTasks.length >= TASK_LIST_LIMIT ? (
        <Text
          style={[
            completionHistoryStyles.truncationNote,
            { color: colors.textSecondary },
          ]}
        >
          Showing the {TASK_LIST_LIMIT} most recent. Older entries are in
          Export.
        </Text>
      ) : null}
    </View>
  );

  const renderEmpty = () => {
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

    return (
      <View style={completionHistoryStyles.emptyState}>
        <View
          style={[
            completionHistoryStyles.emptyIconCircle,
            { backgroundColor: colors.primary + "14" },
          ]}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={32}
            color={colors.primary}
          />
        </View>
        <Text
          style={[completionHistoryStyles.emptyTitle, { color: colors.text }]}
        >
          {lookback === "all" ? "No completions yet" : "Nothing in this range"}
        </Text>
        <Text
          style={[
            completionHistoryStyles.emptySubtext,
            { color: colors.textSecondary },
          ]}
        >
          {lookback === "all"
            ? "Finished tasks will show up here as a journal of what you’ve kept up with."
            : "Try a wider date range, or complete a task from the dashboard."}
        </Text>
      </View>
    );
  };

  return (
    <HearthScreen style={completionHistoryStyles.container}>
      <View style={completionHistoryStyles.header}>
        <TouchableOpacity
          style={completionHistoryStyles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[completionHistoryStyles.headerTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          Completion history
        </Text>
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
        <TasksLoadErrorBanner message={tasksError} onRetry={refreshTasks} />
      ) : null}

      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        renderItem={renderSection}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          completionHistoryStyles.listContent,
          { paddingBottom: scrollPaddingBottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </HearthScreen>
  );
}
