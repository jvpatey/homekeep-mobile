import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useSimpleAnimation, useHaptics } from "../../hooks";
import { useTasks } from "../../context/TasksContext";
import { AppStackParamList } from "../../navigation/types";
import { TaskDetailModal } from "./TaskDetailModal";
import { PriorityBadge } from "./PriorityBadge";
import { TaskItem } from "./TaskItem";
import { FilterButton } from "./FilterButton";
import { PriorityFilterButton, PriorityFilter } from "./PriorityFilterButton";
import { Task } from "../../types/task";
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
  const { completedTasks, loading, deleteTask } = tasksHook;
  const listAnimatedStyle = useSimpleAnimation(600, 600, 20);

  // Task detail modal state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailVisible, setTaskDetailVisible] = useState(false);

  // Priority filter state
  const [activePriority, setActivePriority] = useState<PriorityFilter>("all");

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
    // TODO: Implement edit functionality
    console.log("Edit task:", task.id);
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

  const renderTaskItem = (task: Task) => (
    <TaskItem
      task={task}
      onPress={handleTaskPress}
      onDelete={handleDeleteTask}
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
      <Text
        style={[
          styles.sectionSubtitle,
          { color: colors.textSecondary, marginBottom: 8 },
        ]}
      >
        {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}{" "}
        completed
      </Text>
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
          {filteredTasks.length > 0 ? (
            <View>
              {filteredTasks.map((task, index) => (
                <View key={task.id}>
                  {renderTaskItem(task)}
                  {index < filteredTasks.length - 1 && (
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
    </>
  );
}
