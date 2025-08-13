import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Alert, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
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
import { groupTasksByKey } from "../Dashboard/grouping";
import { StackedTaskItem } from "../Dashboard/StackedTaskItem";
import { FilterButton } from "./FilterButton";
import { PriorityFilterButton, PriorityFilter } from "./PriorityFilterButton";
import { Task } from "../../types/task";
import { styles } from "./styles";

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

interface UpcomingTasksProps {
  searchQuery?: string;
}

// UpcomingTasks Features proper touch targets, category indicators, and navigation

export function UpcomingTasks({ searchQuery = "" }: UpcomingTasksProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { triggerLight, triggerMedium, triggerSuccess } = useHaptics();
  const tasksHook = useTasks();
  const { upcomingTasks, loading, deleteTask, bulkCompleteTasks } = tasksHook;
  const listAnimatedStyle = useSimpleAnimation(600, 600, 20);

  // Task detail modal state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailVisible, setTaskDetailVisible] = useState(false);

  // Edit task modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Priority filter state
  const [activePriority, setActivePriority] = useState<PriorityFilter>("all");

  const getCategoryColor = (category: string): string => {
    const categoryColors: { [key: string]: string } = {
      // Handle both lowercase (stored in DB) and uppercase (display) versions
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

  const formatDueDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
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
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => triggerLight(),
        },
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

  const handleMarkAllComplete = () => {
    if (filteredTasks.length === 0) return;

    triggerMedium();
    Alert.alert(
      "Mark All Complete",
      `Are you sure you want to mark all ${filteredTasks.length} tasks as complete?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete All",
          onPress: async () => {
            triggerMedium();
            const { success, error } = await bulkCompleteTasks(
              filteredTasks.map((task) => task.id)
            );
            if (!success) {
              Alert.alert("Error", error || "Failed to complete all tasks");
            } else {
              // Show success message and stay on the page
              triggerSuccess();
              Alert.alert(
                "Success!",
                `All ${filteredTasks.length} tasks have been marked as complete.`,
                [{ text: "OK", style: "default" }]
              );
            }
          },
        },
      ]
    );
  };

  // Filter tasks based on active tab and search query
  const getFilteredTasks = () => {
    let filtered = [...upcomingTasks];

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

    // Sort by due date (earliest first)
    const sorted = filtered.sort(
      (a, b) =>
        new Date(a.next_due_date).getTime() -
        new Date(b.next_due_date).getTime()
    );

    return sorted;
  };

  const filteredTasks = getFilteredTasks();
  const grouped = groupTasksByKey(filteredTasks);

  // Tab configuration

  const renderTaskItem = (task: Task) => (
    <TaskItem
      task={task}
      onPress={handleTaskPress}
      onDelete={handleDeleteTask}
      onComplete={tasksHook.completeTask}
      onUncomplete={tasksHook.uncompleteTask}
      getCategoryColor={getCategoryColor}
      formatDueDate={formatDueDate}
      showDeleteButton={true}
    />
  );

  const ListHeader = () => (
    <View>
      <View style={styles.listHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {searchQuery.trim() ? "Search Results" : "Upcoming Tasks"}
        </Text>
        {filteredTasks.length > 0 && !searchQuery.trim() && (
          <TouchableOpacity
            style={styles.completeAllButton}
            onPress={handleMarkAllComplete}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-done" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      {!searchQuery.trim() && (
        <View style={styles.filterButtonsContainer}>
          <PriorityFilterButton
            selectedPriority={activePriority}
            onPriorityChange={setActivePriority}
            style={styles.filterButton}
          />
          <FilterButton style={styles.filterButton} />
        </View>
      )}
    </View>
  );

  const EmptyState = () => {
    const getEmptyMessage = () => {
      if (searchQuery.trim()) {
        return {
          title: "No tasks found",
          subtitle: `No tasks match "${searchQuery}"`,
        };
      }

      if (activePriority === "all") {
        return {
          title: "No upcoming tasks",
          subtitle: "Tap the + button to create your first task",
        };
      } else {
        const priorityLabel =
          activePriority.charAt(0).toUpperCase() + activePriority.slice(1);
        return {
          title: `No ${priorityLabel} priority tasks`,
          subtitle:
            tasksHook.timeRange === "all"
              ? `No ${activePriority} priority tasks scheduled`
              : `No ${activePriority} priority tasks due in the next ${tasksHook.timeRange} days`,
        };
      }
    };

    const message = getEmptyMessage();

    return (
      <View
        style={{
          alignItems: "center",
          paddingVertical: 40,
          paddingHorizontal: 20,
        }}
      >
        <Ionicons
          name={searchQuery.trim() ? "search-outline" : "clipboard-outline"}
          size={48}
          color={colors.textSecondary}
          style={{
            marginBottom: 16,
            opacity: 0.6,
          }}
        />
        <Text
          style={[
            {
              fontSize: 18,
              fontWeight: "600",
              marginBottom: 8,
              textAlign: "center",
            },
            { color: colors.textSecondary },
          ]}
        >
          {message.title}
        </Text>
        <Text
          style={[
            {
              fontSize: 16,
              fontWeight: "400",
              textAlign: "center",
              opacity: 0.8,
            },
            { color: colors.textSecondary },
          ]}
        >
          {message.subtitle}
        </Text>
      </View>
    );
  };

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
                      formatDueDate={formatDueDate}
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

      {/* Task Detail Modal */}
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
