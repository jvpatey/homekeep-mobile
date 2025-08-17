import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Alert, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useSimpleAnimation, useHaptics } from "../../hooks";
import { useTasks } from "../../context/TasksContext";
import { useAuth } from "../../context/AuthContext";
import { AppStackParamList } from "../../navigation/types";
import { TaskDetailModal } from "./TaskDetailModal";
import { EditTaskModal } from "./CreateTaskModal/EditTaskModal";
import { PriorityBadge } from "./PriorityBadge";
import { TaskItem } from "./TaskItem";
import { FilterButton } from "./FilterButton";
import { PriorityFilterButton, PriorityFilter } from "./PriorityFilterButton";
import { Task } from "../../types/task";
import { groupTasksByKey } from "../Dashboard/grouping";
import { StackedTaskItem } from "../Dashboard/StackedTaskItem";
import { styles } from "./styles";

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

interface CompletedTasksProps {
  searchQuery?: string;
}

// CompletedTasks - Features completed tasks display with green styling
export function CompletedTasks({ searchQuery = "" }: CompletedTasksProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { triggerLight, triggerMedium } = useHaptics();
  const tasksHook = useTasks();
  const {
    completedTasks,
    loading,
    deleteTask,
    uncompleteTask,
    lookbackDays,
    setLookbackDays,
  } = tasksHook;
  const listAnimatedStyle = useSimpleAnimation(600, 600, 20);

  // Task detail modal state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailVisible, setTaskDetailVisible] = useState(false);

  // Edit task modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Priority filter state
  const [activePriority, setActivePriority] = useState<PriorityFilter>("all");

  // Bulk operations state
  const [isBulkOperationLoading, setIsBulkOperationLoading] = useState(false);

  // Loading animation
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (isBulkOperationLoading) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1
      );
    } else {
      rotation.value = withTiming(0);
    }
  }, [isBulkOperationLoading]);

  const loadingIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const getCategoryColor = (category: string): string => {
    const categoryColors: { [key: string]: string } = {
      hvac: "#FF6B6B",
      HVAC: "#FF6B6B",
      exterior: "#4ECDC4",
      Exterior: "#4ECDC4",
      safety: "#FFA726",
      Safety: "#FFA726",
      plumbing: "#9B59B6",
      Plumbing: "#9B59B6",
      electrical: "#3498DB",
      Electrical: "#3498DB",
      appliances: "#2ECC71",
      Appliances: "#2ECC71",
    };
    return categoryColors[category] || colors.primary;
  };

  const formatCompletedDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const handleTaskPress = (taskId: string) => {
    triggerLight();
    setSelectedTaskId(taskId);
    setTaskDetailVisible(true);
  };

  const handleCloseTaskDetail = () => {
    setTaskDetailVisible(false);
    setSelectedTaskId(null);
  };

  const handleEditTask = (task: Task) => {
    // Close the task detail modal first
    setTaskDetailVisible(false);
    setSelectedTaskId(null);

    // Then open the edit modal
    setEditingTask(task);
    setEditModalVisible(true);
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    triggerMedium();
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${taskTitle}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            triggerMedium();
            const { success, error } = await deleteTask(taskId);
            if (!success) {
              Alert.alert("Error", error || "Failed to delete task");
            }
          },
        },
      ]
    );
  };

  const handleMarkAllIncomplete = () => {
    if (filteredTasks.length === 0) return;

    triggerMedium();
    Alert.alert(
      "Reset All Tasks",
      `Are you sure you want to mark all ${filteredTasks.length} completed tasks as incomplete?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset All",
          style: "destructive",
          onPress: async () => {
            setIsBulkOperationLoading(true);
            triggerMedium();

            try {
              // Process all tasks in parallel for better performance
              const promises = filteredTasks.map((task) =>
                uncompleteTask(task.id)
              );
              const results = await Promise.allSettled(promises);

              // Check if any operations failed
              const failedCount = results.filter(
                (result) => result.status === "rejected"
              ).length;

              if (failedCount > 0) {
                Alert.alert(
                  "Partial Success",
                  `${
                    filteredTasks.length - failedCount
                  } tasks were reset successfully. ${failedCount} tasks failed to reset.`
                );
              }
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to reset some tasks. Please try again."
              );
            } finally {
              setIsBulkOperationLoading(false);
            }
          },
        },
      ]
    );
  };

  // Filter tasks based on search query and priority
  const getFilteredTasks = () => {
    let filtered = [...completedTasks];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((task) => {
        const titleMatch = task.title.toLowerCase().includes(query);
        const descriptionMatch =
          task.description?.toLowerCase().includes(query) || false;
        const categoryMatch = task.category.toLowerCase().includes(query);
        return titleMatch || descriptionMatch || categoryMatch;
      });
    }

    // Apply priority filter
    if (activePriority !== "all") {
      filtered = filtered.filter(
        (task) => task.priority.toLowerCase() === activePriority
      );
    }

    // Sort by completion date (most recent first)
    return filtered.sort(
      (a, b) =>
        new Date(b.completed_at || "").getTime() -
        new Date(a.completed_at || "").getTime()
    );
  };

  const filteredTasks = getFilteredTasks();
  const grouped = groupTasksByKey(filteredTasks);

  const renderTaskItem = (task: Task) => (
    <TaskItem
      task={task}
      onPress={handleTaskPress}
      onDelete={handleDeleteTask}
      onComplete={tasksHook.completeTask}
      onUncomplete={tasksHook.uncompleteTask}
      getCategoryColor={getCategoryColor}
      formatDueDate={formatCompletedDate}
      showDeleteButton={true}
    />
  );

  const ListHeader = () => (
    <View>
      <View style={styles.listHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Completed Tasks
        </Text>
        {filteredTasks.length > 0 && (
          <TouchableOpacity
            style={[
              styles.markAllIncompleteButton,
              {
                opacity: isBulkOperationLoading ? 0.6 : 1,
              },
            ]}
            onPress={handleMarkAllIncomplete}
            disabled={isBulkOperationLoading}
            activeOpacity={0.7}
            accessibilityLabel={
              isBulkOperationLoading
                ? "Resetting all tasks..."
                : "Reset all completed tasks"
            }
            accessibilityHint="Marks all completed tasks as incomplete"
          >
            {isBulkOperationLoading ? (
              <Animated.View style={styles.loadingSpinner}>
                <Ionicons
                  name="refresh"
                  size={20}
                  color={colors.primary}
                  style={loadingIconStyle}
                />
              </Animated.View>
            ) : (
              <Ionicons
                name="refresh-outline"
                size={20}
                color={colors.primary}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
      {!searchQuery.trim() && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <PriorityFilterButton
              selectedPriority={activePriority}
              onPriorityChange={setActivePriority}
              style={styles.filterButton}
            />
          </View>
          <TouchableOpacity
            onPress={() => setLookbackDays(lookbackDays === "all" ? 14 : "all")}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 10,
              backgroundColor: colors.surface,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.primary, fontWeight: "600" }}>
              {lookbackDays === "all"
                ? "Show last 14 days"
                : "View all history"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <Text
        style={{
          marginBottom: 6,
          color: colors.textSecondary,
        }}
      >
        {lookbackDays === "all"
          ? "Showing all history"
          : `Showing last ${lookbackDays} days`}
      </Text>
      {/* Removed completed count subtitle for cleaner spacing */}
    </View>
  );

  const EmptyState = () => {
    const getEmptyMessage = () => {
      if (searchQuery.trim()) {
        return {
          title: "No completed tasks found",
          subtitle: `No completed tasks match "${searchQuery}"`,
        };
      }

      if (activePriority === "all") {
        return {
          title: "No completed tasks yet",
          subtitle: "Complete some tasks to see them here",
        };
      } else {
        const priorityLabel =
          activePriority.charAt(0).toUpperCase() + activePriority.slice(1);
        return {
          title: `No ${priorityLabel} priority tasks completed`,
          subtitle: `Complete some ${activePriority} priority tasks to see them here`,
        };
      }
    };

    const message = getEmptyMessage();

    return (
      <View style={styles.emptyState}>
        <Ionicons
          name="checkmark-circle-outline"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {message.title}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {message.subtitle}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading completed tasks...
        </Text>
      </View>
    );
  }

  return (
    <>
      <Animated.View style={[styles.upcomingContainer, listAnimatedStyle]}>
        <View style={{ paddingHorizontal: 4, paddingBottom: 8 }}>
          <ListHeader />
          {grouped.length > 0 ? (
            <View>
              {grouped.map((group, index) => (
                <View key={group.key}>
                  {group.items.length > 1 ? (
                    <StackedTaskItem
                      groupKey={group.key}
                      items={group.items}
                      onPressTask={handleTaskPress}
                      onDeleteTask={handleDeleteTask}
                      onComplete={tasksHook.completeTask}
                      onUncomplete={tasksHook.uncompleteTask}
                      getCategoryColor={getCategoryColor}
                      formatDueDate={formatCompletedDate}
                    />
                  ) : (
                    renderTaskItem(group.items[0])
                  )}
                  {index < grouped.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <EmptyState />
          )}
        </View>
      </Animated.View>

      <TaskDetailModal
        taskId={selectedTaskId}
        visible={taskDetailVisible}
        onClose={handleCloseTaskDetail}
        onEdit={handleEditTask}
      />

      {/* Edit Task Modal - Rendered at root level */}
      {editingTask && (
        <Modal
          visible={editModalVisible}
          onRequestClose={() => {
            setEditModalVisible(false);
            setEditingTask(null);
          }}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <EditTaskModal
            task={editingTask}
            onClose={() => {
              setEditModalVisible(false);
              setEditingTask(null);
            }}
            onTaskUpdated={() => {
              setEditModalVisible(false);
              setEditingTask(null);
              // Refresh tasks to show updated data
              // The useTasks hook should automatically refresh
            }}
          />
        </Modal>
      )}
    </>
  );
}
