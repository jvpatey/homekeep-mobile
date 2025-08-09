import React, { useState, useMemo } from "react";
import { View, FlatList, Alert } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import Animated from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { useSimpleAnimation, useHaptics } from "../hooks";
import { useTasks } from "../context/TasksContext";
import { AppStackParamList } from "../navigation/types";
import { TaskDetailModal } from "../components/Dashboard/TaskDetailModal";
import { TaskItem } from "../components/Dashboard/TaskItem";
import {
  FilteredTasksHeader,
  EmptyState,
  useCategoryColors,
  formatDueDate,
  sortTasksByPriorityAndDate,
} from "../components/Dashboard/FilteredTasks";
import { Task } from "../types/task";

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;
type FilteredTasksRouteProp = RouteProp<AppStackParamList, "FilteredTasks">;

// FilteredTasksScreen - Displays filtered tasks based on summary card selection
export function FilteredTasksScreen() {
  const { colors, isDark } = useTheme();
  const route = useRoute<FilteredTasksRouteProp>();
  const { triggerMedium } = useHaptics();
  const { upcomingTasks, deleteTask } = useTasks();
  const listAnimatedStyle = useSimpleAnimation(400, 400, 20);
  const { getCategoryColor } = useCategoryColors();

  // Task detail modal state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailVisible, setTaskDetailVisible] = useState(false);

  const { filterType, title } = route.params;

  // Filter tasks based on filter type
  const filteredTasks = useMemo(() => {
    // Use the same logic as TaskService.getTaskStats() for consistency
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    if (filterType === "dueToday") {
      return upcomingTasks.filter((task) => {
        const taskDate = new Date(task.next_due_date);
        return taskDate >= today && taskDate < tomorrow;
      });
    } else if (filterType === "thisWeek") {
      return upcomingTasks.filter((task) => {
        const taskDate = new Date(task.next_due_date);
        return taskDate >= today && taskDate < nextWeek;
      });
    } else if (filterType === "overdue") {
      return upcomingTasks.filter((task) => {
        const taskDate = new Date(task.next_due_date);
        return taskDate < today;
      });
    } else {
      return upcomingTasks;
    }
  }, [upcomingTasks, filterType]);

  // Sort tasks by priority and due date
  const sortedTasks = useMemo(() => {
    return sortTasksByPriorityAndDate(filteredTasks);
  }, [filteredTasks]);

  const handleTaskPress = (taskId: string) => {
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

  const handleMarkAllComplete = () => {
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
            // TODO: Implement bulk update
            console.log("Mark all complete for", filterType);
          },
        },
      ]
    );
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

  const renderTaskItem = ({ item: task }: { item: Task }) => (
    <TaskItem
      task={task}
      onPress={handleTaskPress}
      onDelete={handleDeleteTask}
      getCategoryColor={getCategoryColor}
      formatDueDate={formatDueDate}
      showDeleteButton={true}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "auto"} />

      {/* Header */}
      <FilteredTasksHeader
        title={title}
        taskCount={sortedTasks.length}
        onMarkAllComplete={handleMarkAllComplete}
      />

      {/* Task List */}
      <Animated.View style={[styles.content, listAnimatedStyle]}>
        <FlatList
          data={sortedTasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={() => (
            <EmptyState filterType={filterType} title={title} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </Animated.View>

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        visible={taskDetailVisible}
        onClose={handleCloseTaskDetail}
        onEdit={handleEditTask}
      />
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    overflow: "visible" as const,
  },
  listContent: {
    paddingHorizontal: 20, // Increased for shadow space
    paddingTop: 16,
    paddingBottom: 8, // Bottom padding for shadows
  },
};
