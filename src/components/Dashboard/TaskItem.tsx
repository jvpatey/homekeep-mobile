import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { MaintenanceTask } from "../../types/maintenance";

interface TaskItemProps {
  task: MaintenanceTask;
  onPress: (instanceId: string) => void;
  onDelete?: (taskId: string, taskTitle: string) => void;
  onComplete?: (instanceId: string) => void;
  onUncomplete?: (instanceId: string) => void;
  getCategoryColor: (category: string) => string;
  formatDueDate: (dateString: string) => string;
  showDeleteButton?: boolean;
  variant?: "default" | "incomplete" | "completed";
}

export function TaskItem({
  task,
  onPress,
  onDelete,
  onComplete,
  onUncomplete,
  getCategoryColor,
  formatDueDate,
  showDeleteButton = false,
  variant = "default",
}: TaskItemProps) {
  const { colors } = useTheme();
  const isCompleted = task.is_completed;
  const isIncompleteView = variant === "incomplete" && !isCompleted;

  const handlePress = () => {
    onPress(task.instance_id);
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(task.instance_id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(task.id, task.title);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.taskItem,
          isCompleted && styles.completedTaskItem,
          isIncompleteView && styles.incompleteTaskItem,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.taskItemLeft}>
          {!isCompleted && !isIncompleteView && (
            <View
              style={[
                styles.categoryIndicator,
                { backgroundColor: getCategoryColor(task.category) },
              ]}
            />
          )}
          <View style={styles.taskInfo}>
            <Text
              style={[
                styles.taskTitle,
                {
                  color: isCompleted
                    ? colors.success
                    : isIncompleteView
                    ? colors.error
                    : colors.text,
                  opacity: isCompleted ? 0.8 : 1,
                  textDecorationLine: isCompleted ? "line-through" : "none",
                },
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            <Text
              style={[
                styles.taskSubtitle,
                {
                  color: isCompleted
                    ? colors.textSecondary
                    : isIncompleteView
                    ? colors.error
                    : colors.textSecondary,
                },
              ]}
              numberOfLines={1}
            >
              {formatDueDate(task.due_date)}
            </Text>
          </View>
        </View>

        <View style={styles.taskItemRight}>
          {!isCompleted && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={handleComplete}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={20} color="white" />
            </TouchableOpacity>
          )}

          {isCompleted && onUncomplete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.uncompleteButton]}
              onPress={() => onUncomplete(task.instance_id)}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={20} color="white" />
            </TouchableOpacity>
          )}

          {showDeleteButton && onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    minHeight: 72,
    backgroundColor: "white",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  completedTaskItem: {
    opacity: 0.7,
  },
  incompleteTaskItem: {
    borderWidth: 2,
    borderColor: "#E74C3C",
  },
  taskItemLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: 16,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  taskSubtitle: {
    fontSize: 15,
    fontWeight: "400",
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  taskItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  completeButton: {
    backgroundColor: "#27AE60",
  },
  uncompleteButton: {
    backgroundColor: "#3498DB",
  },
  deleteButton: {
    backgroundColor: "#E74C3C",
  },
});
