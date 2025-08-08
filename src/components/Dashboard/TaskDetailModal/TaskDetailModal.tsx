import React from "react";
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
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
}

// TaskDetailModal - Features header, content, and actions for each task
export function TaskDetailModal({
  task,
  visible,
  onClose,
  onEdit,
}: TaskDetailModalProps) {
  const { colors } = useTheme();
  const { triggerLight, triggerMedium } = useHaptics();
  const { deleteTask, updateTask } = useTasks();

  if (!task) return null;

  const handleToggleComplete = async () => {
    triggerMedium();
    const { success, error } = await updateTask(task.id, {
      is_completed: !task.is_completed,
    });

    if (!success) {
      Alert.alert("Error", error || "Failed to update task");
    }
  };

  const handleDelete = () => {
    triggerMedium();
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${task.title}"?`,
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
            const { success, error } = await deleteTask(task.id);
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
    onEdit(task);
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
          task={task}
          onClose={onClose}
          getCategoryGradient={getCategoryGradient}
        />
        <TaskDetailContent task={task} formatDueDate={formatDueDate} />
        <TaskDetailActions
          task={task}
          onToggleComplete={handleToggleComplete}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </View>
    </Modal>
  );
}
