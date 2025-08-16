import React, { useMemo, useState } from "react";
import {
  View,
  Modal,
  Alert,
  Platform,
  Text,
  TouchableOpacity,
} from "react-native";
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
import { startOfDay } from "date-fns";

interface TaskDetailModalProps {
  taskId: string | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDeleted?: () => void;
}

// TaskDetailModal - Features header, content, and actions for each task
export function TaskDetailModal({
  taskId,
  visible,
  onClose,
  onEdit,
  onDeleted,
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
    if (currentTask.instance_id) {
      Alert.alert(
        "Delete Recurring Task",
        `Do you want to delete just this occurrence of "${currentTask.title}" or the entire series?`,
        [
          { text: "Cancel", style: "cancel", onPress: () => triggerLight() },
          {
            text: "This occurrence",
            style: "destructive",
            onPress: async () => {
              triggerMedium();
              const { success, error } = await deleteTask(
                currentTask.instance_id!
              );
              if (success) {
                Alert.alert("Deleted", "This occurrence has been deleted.");
                onClose();
                onDeleted?.();
              } else {
                Alert.alert("Error", error || "Failed to delete occurrence");
              }
            },
          },
          {
            text: "Entire series",
            style: "destructive",
            onPress: async () => {
              triggerMedium();
              const { success, error } = await deleteTask(currentTask.id);
              if (success) {
                Alert.alert("Deleted", "The entire series has been deleted.");
                onClose();
                onDeleted?.();
              } else {
                Alert.alert("Error", error || "Failed to delete series");
              }
            },
          },
        ]
      );
    } else {
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
                Alert.alert("Deleted", "The task has been deleted.");
                onClose();
                onDeleted?.();
              } else {
                Alert.alert("Error", error || "Failed to delete task");
              }
            },
          },
        ]
      );
    }
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
            onEdit(currentTask);
            onClose();
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
          startOfDay(selected).toISOString()
        );
        if (error) throw error;
      } else if (editMode === "series") {
        const deltaMs =
          startOfDay(selected).getTime() -
          startOfDay(new Date(currentTask.next_due_date)).getTime();
        const { error } = await TaskService.shiftFutureInstances(
          currentTask.id,
          startOfDay(new Date(currentTask.next_due_date)).toISOString(),
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
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              paddingTop: 8,
              paddingBottom: 16,
              backgroundColor: colors.surface,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderTopWidth: 1,
              borderColor: colors.border,
            }}
          >
            <DateTimePicker
              value={pendingDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event: any, selectedDate?: Date) => {
                if (Platform.OS !== "ios") {
                  if (event?.type === "dismissed") {
                    setShowDatePicker(false);
                    setEditMode(null);
                  } else {
                    handleConfirmDate(selectedDate || pendingDate);
                  }
                } else if (selectedDate) {
                  setPendingDate(selectedDate);
                }
              }}
              style={{ backgroundColor: colors.surface }}
            />
            {Platform.OS === "ios" && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  marginTop: 8,
                }}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <View
                    style={{
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    }}
                  >
                    <View
                      style={{
                        alignItems: "center",
                        paddingVertical: 12,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          width: "100%",
                          paddingHorizontal: 12,
                        }}
                      >
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <View
                            style={{
                              backgroundColor: colors.surface,
                              borderRadius: 10,
                              borderWidth: 1,
                              borderColor: colors.border,
                            }}
                          >
                            <View
                              style={{
                                alignItems: "center",
                                paddingVertical: 10,
                              }}
                            >
                              <></>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ marginRight: 8 }}>
                    <View
                      style={{
                        borderRadius: 12,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <View
                        style={{ paddingVertical: 10, paddingHorizontal: 16 }}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            setShowDatePicker(false);
                            setEditMode(null);
                          }}
                        >
                          <Text style={{ color: colors.textSecondary }}>
                            Cancel
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  <View>
                    <View
                      style={{
                        borderRadius: 12,
                        backgroundColor: colors.primary,
                      }}
                    >
                      <View
                        style={{ paddingVertical: 10, paddingHorizontal: 16 }}
                      >
                        <TouchableOpacity
                          onPress={() => handleConfirmDate(pendingDate)}
                        >
                          <Text style={{ color: "#ffffff", fontWeight: "700" }}>
                            Save
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}
