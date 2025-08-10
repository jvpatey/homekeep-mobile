import React, { useMemo } from "react";
import { View, Modal, Alert } from "react-native";
import { useSimpleAnimation, useHaptics } from "../../../hooks";
import { useTasks } from "../../../context/TasksContext";
import { useTheme } from "../../../context/ThemeContext";
import { Task } from "../../../types/task";
import { TaskDetailHeader } from "./TaskDetailHeader";
import { TaskDetailContent } from "./TaskDetailContent";
import { TaskDetailActions } from "./TaskDetailActions";
import { getCategoryGradient, formatDueDate } from "./utils";

interface TaskDetailModalProps {
  taskId: string | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
}

// TaskDetailModal - Features header, content, and actions for each task
export function TaskDetailModal({
  taskId,
  visible,
  onClose,
  onEdit,
}: TaskDetailModalProps) {
  const { colors } = useTheme();
  const { triggerLight, triggerMedium } = useHaptics();
  const {
    deleteTask,
    completeTask,
    uncompleteTask,
    tasks,
    upcomingTasks,
    completedTasks,
  } = useTasks();

  // Get the current task from the tasks context to ensure we have the latest state
  const currentTask = useMemo(() => {
    if (!taskId) return null;
    // Check all task arrays to find the most up-to-date version
    const foundTask =
      tasks.find((t) => t.id === taskId) ||
      upcomingTasks.find((t) => t.id === taskId) ||
      completedTasks.find((t) => t.id === taskId);

    return foundTask;
  }, [taskId, tasks, upcomingTasks, completedTasks]);

  if (!currentTask) return null;

  const handleToggleComplete = async () => {
    triggerMedium();

    console.log("🎯 Modal toggle complete called:", {
      taskId: currentTask.id,
      taskTitle: currentTask.title,
      currentlyCompleted: currentTask.is_completed,
      action: currentTask.is_completed
        ? "marking incomplete"
        : "marking complete",
    });

    if (currentTask.is_completed) {
      // Mark as incomplete
      console.log("🔄 Calling uncompleteTask...");
      const { success, error } = await uncompleteTask(currentTask.id);
      console.log("🔄 UncompleteTask result:", { success, error });
      if (!success) {
        Alert.alert("Error", error || "Failed to mark task as incomplete");
      }
    } else {
      // Mark as complete
      console.log("✅ Calling completeTask...");
      const { success, error } = await completeTask(currentTask.id);
      console.log("✅ CompleteTask result:", { success, error });
      if (!success) {
        Alert.alert("Error", error || "Failed to complete task");
      }
    }
  };

  const handleDelete = () => {
    triggerMedium();
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${currentTask.title}"?`,
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
            const { success, error } = await deleteTask(currentTask.id);
            if (success) {
              onClose();
            } else {
              Alert.alert("Error", error || "Failed to delete task");
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    triggerLight();
    onEdit(currentTask);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TaskDetailHeader
          task={currentTask}
          onClose={onClose}
          getCategoryGradient={getCategoryGradient}
        />
        <View style={{ backgroundColor: colors.background }}>
          <TaskDetailContent task={currentTask} formatDueDate={formatDueDate} />
          <TaskDetailActions
            task={currentTask}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </View>
      </View>
    </Modal>
  );
}
