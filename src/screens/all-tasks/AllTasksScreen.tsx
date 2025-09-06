import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { useHaptics } from "../../hooks";
import { PriorityBadge } from "../../components/Dashboard";
import { MaintenanceTask } from "../../types/maintenance";
import { AllTasksScreenProps } from "./types";

export function AllTasksScreen({ navigation }: AllTasksScreenProps) {
  const { colors, isDark } = useTheme();
  const { tasks, deleteTask, refreshTasks } = useTasks();
  const { triggerLight, triggerMedium } = useHaptics();
  const [deletingTasks, setDeletingTasks] = useState<Set<string>>(new Set());

  // Refresh tasks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 AllTasksScreen - Screen focused, refreshing tasks");
      refreshTasks();
    }, [refreshTasks])
  );

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (deletingTasks.has(taskId)) return; // Prevent multiple deletes

    await triggerMedium();
    Alert.alert(
      "Delete Task",
      `Are you sure you want to permanently delete "${taskTitle}"? This will remove the task and all its history.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingTasks((prev) => new Set(prev).add(taskId));

            try {
              const result = await deleteTask(taskId);

              if (result.success) {
                await triggerLight();
                // Task is automatically removed from local state by deleteTask
              } else {
                Alert.alert(
                  "Delete Failed",
                  result.error || "Failed to delete the task. Please try again."
                );
              }
            } catch (error) {
              console.error("Error deleting task:", error);
              Alert.alert(
                "Delete Failed",
                "An unexpected error occurred. Please try again."
              );
            } finally {
              setDeletingTasks((prev) => {
                const newSet = new Set(prev);
                newSet.delete(taskId);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const formatCategory = (category: string) => {
    if (category === "HVAC") {
      return "HVAC";
    }
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  };

  const formatInterval = (intervalDays: number) => {
    if (intervalDays < 7) {
      return `Every ${intervalDays} day${intervalDays !== 1 ? "s" : ""}`;
    } else if (intervalDays === 7) {
      return "Weekly";
    } else if (intervalDays === 14) {
      return "Bi-weekly";
    } else if (intervalDays === 30) {
      return "Monthly";
    } else if (intervalDays === 90) {
      return "Quarterly";
    } else if (intervalDays === 365) {
      return "Yearly";
    } else {
      const weeks = Math.round(intervalDays / 7);
      const months = Math.round(intervalDays / 30);

      if (intervalDays % 7 === 0 && weeks <= 8) {
        return `Every ${weeks} week${weeks !== 1 ? "s" : ""}`;
      } else if (intervalDays % 30 === 0 && months <= 12) {
        return `Every ${months} month${months !== 1 ? "s" : ""}`;
      } else {
        return `Every ${intervalDays} days`;
      }
    }
  };

  const renderTaskItem = ({ item }: { item: MaintenanceTask }) => {
    const isDeleting = deletingTasks.has(item.id);

    return (
      <View style={[styles.taskItem, { backgroundColor: colors.surface }]}>
        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Text
              style={[styles.taskTitle, { color: colors.text }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <PriorityBadge priority={item.priority} />
          </View>

          <View style={styles.taskDetails}>
            <Text
              style={[styles.taskCategory, { color: colors.textSecondary }]}
            >
              {formatCategory(item.category)}
            </Text>
            <Text
              style={[styles.taskInterval, { color: colors.textSecondary }]}
            >
              {formatInterval(item.interval_days)}
            </Text>
          </View>

          {item.estimated_duration_minutes && (
            <Text
              style={[styles.taskDuration, { color: colors.textSecondary }]}
            >
              ~{item.estimated_duration_minutes} min
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.deleteButton,
            { backgroundColor: colors.error + "15" },
            isDeleting && styles.deletingButton,
          ]}
          onPress={() => handleDeleteTask(item.id, item.title)}
          disabled={isDeleting}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isDeleting ? "hourglass-outline" : "trash-outline"}
            size={20}
            color={colors.error}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="checkmark-circle-outline"
        size={64}
        color={colors.textSecondary}
      />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        No tasks found
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
        Create your first maintenance task to get started!
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          All Tasks ({tasks.length})
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Task List */}
      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  headerRightSpacer: {
    width: 40,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskContent: {
    flex: 1,
    marginRight: 12,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  taskDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  taskCategory: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 12,
  },
  taskInterval: {
    fontSize: 14,
  },
  taskDuration: {
    fontSize: 12,
    fontStyle: "italic",
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  deletingButton: {
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
