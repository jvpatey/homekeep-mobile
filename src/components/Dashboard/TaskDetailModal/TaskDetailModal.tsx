import React, { useMemo, useState } from "react";
import { View, Modal, Alert, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSimpleAnimation, useHaptics } from "../../../hooks";
import { useTasks } from "../../../context/TasksContext";
import { useTheme } from "../../../context/ThemeContext";
import { Task } from "../../../types/task";
import { TaskDetailHeader } from "./TaskDetailHeader";
import { TaskDetailContent } from "./TaskDetailContent";
import { TaskDetailActions } from "./TaskDetailActions";
import { getCategoryGradient, formatDueDate } from "./utils";
import { TaskService } from "../../../services/taskService";

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
    overdueTasks,
    refreshTasks,
  } = useTasks();

  // Get the current task from the tasks context to ensure we have the latest state
  const currentTask = useMemo(() => {
    if (!taskId) return null;
    // Check all task arrays to find the most up-to-date version
    const foundTask =
      tasks.find((t) => t.id === taskId || t.instance_id === taskId) ||
      upcomingTasks.find((t) => t.id === taskId || t.instance_id === taskId) ||
      overdueTasks.find((t) => t.id === taskId || t.instance_id === taskId) ||
      completedTasks.find((t) => t.id === taskId || t.instance_id === taskId);

    return foundTask;
  }, [taskId, tasks, upcomingTasks, overdueTasks, completedTasks]);

  const [editMode, setEditMode] = useState<"occurrence" | "series" | null>(
    null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date>(new Date());

  if (!currentTask) return null;

  const handleToggleComplete = async () => {
    triggerMedium();

    if (currentTask.is_completed) {
      // Mark as incomplete
      const { success, error } = await uncompleteTask(currentTask.id);
      if (!success) {
        Alert.alert("Error", error || "Failed to mark task as incomplete");
      }
    } else {
      // Mark as complete
      const { success, error } = await completeTask(currentTask.id);
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
    if (currentTask.instance_id) {
      Alert.alert("Edit Recurring Task", "Choose what to edit", [
        {
          text: "This occurrence",
          onPress: () => {
            setEditMode("occurrence");
            setPendingDate(new Date(currentTask.next_due_date));
            setShowDatePicker(true);
          },
        },
        {
          text: "This and future",
          onPress: () => {
            setEditMode("series");
            setPendingDate(new Date(currentTask.next_due_date));
            setShowDatePicker(true);
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      onEdit(currentTask);
      onClose();
    }
  };

  const handleConfirmDate = async (selected: Date | undefined) => {
    setShowDatePicker(false);
    if (!selected || !editMode) return;
    try {
      if (editMode === "occurrence" && currentTask.instance_id) {
        const { error } = await TaskService.updateInstanceDueDate(
          currentTask.instance_id,
          selected.toISOString()
        );
        if (error) throw error;
      } else if (editMode === "series") {
        const deltaMs =
          selected.getTime() - new Date(currentTask.next_due_date).getTime();
        const { error } = await TaskService.shiftFutureInstances(
          currentTask.id,
          new Date(currentTask.next_due_date).toISOString(),
          deltaMs
        );
        if (error) throw error;
      }
      await refreshTasks();
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update recurrence");
    } finally {
      setEditMode(null);
    }
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
        {showDatePicker && (
          <DateTimePicker
            value={pendingDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              if (Platform.OS !== "ios") {
                handleConfirmDate(selectedDate || pendingDate);
              } else if (selectedDate) {
                setPendingDate(selectedDate);
              }
            }}
            style={{ backgroundColor: colors.surface }}
          />
        )}
      </View>
    </Modal>
  );
}
