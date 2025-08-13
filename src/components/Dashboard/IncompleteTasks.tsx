import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useSimpleAnimation, useHaptics } from "../../hooks";
import { useTasks } from "../../context/TasksContext";
import { TaskDetailModal } from "./TaskDetailModal";
import { EditTaskModal } from "./CreateTaskModal/EditTaskModal";
import { PriorityFilterButton, PriorityFilter } from "./PriorityFilterButton";
import { FilterButton } from "./FilterButton";
import { TaskItem } from "./TaskItem";
import { Task } from "../../types/task";
import { groupTasksByKey } from "./grouping";
import { StackedTaskItem } from "./StackedTaskItem";
import { styles } from "./styles";

interface IncompleteTasksProps {
  searchQuery?: string;
}

// IncompleteTasks - shows overdue, incomplete tasks only
export function IncompleteTasks({ searchQuery = "" }: IncompleteTasksProps) {
  const { colors } = useTheme();
  const { triggerLight, triggerMedium, triggerSuccess } = useHaptics();
  const tasksHook = useTasks();
  const { overdueTasks, deleteTask, lookbackDays, setLookbackDays } = tasksHook;
  const listAnimatedStyle = useSimpleAnimation(600, 600, 20);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailVisible, setTaskDetailVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
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

  const formatOverdueDate = (dateString: string): string => {
    const due = new Date(dateString);
    return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
    setTaskDetailVisible(false);
    setSelectedTaskId(null);
    setEditingTask(task);
    setEditModalVisible(true);
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    triggerMedium();
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${taskTitle}"?`,
      [
        { text: "Cancel", style: "cancel", onPress: () => triggerLight() },
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

  const handleMarkAllComplete = () => {};

  const getFilteredTasks = () => {
    let filtered = [...overdueTasks];

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

    if (activePriority !== "all") {
      filtered = filtered.filter(
        (task) => task.priority.toLowerCase() === activePriority
      );
    }

    // Sort by due date (oldest first)
    return filtered.sort(
      (a, b) =>
        new Date(a.next_due_date).getTime() -
        new Date(b.next_due_date).getTime()
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
      formatDueDate={formatOverdueDate}
      showDeleteButton={true}
      variant="incomplete"
    />
  );

  const ListHeader = () => (
    <View>
      <View style={styles.listHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Incomplete Tasks
        </Text>
        {/* No bulk complete for overdue tasks */}
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
          ? "Showing all overdue history"
          : `Showing last ${lookbackDays} days`}
      </Text>
    </View>
  );

  const EmptyState = () => (
    <View
      style={{
        alignItems: "center",
        paddingVertical: 40,
        paddingHorizontal: 20,
      }}
    >
      <Ionicons
        name={searchQuery.trim() ? "search-outline" : "time-outline"}
        size={48}
        color={colors.textSecondary}
        style={{ marginBottom: 16, opacity: 0.6 }}
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
        {searchQuery.trim() ? "No tasks found" : "No incomplete tasks"}
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
        {searchQuery.trim()
          ? `No tasks match "${searchQuery}"`
          : "Great job! You're all caught up."}
      </Text>
    </View>
  );

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
                      formatDueDate={formatOverdueDate}
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
            }}
          />
        </Modal>
      )}
    </>
  );
}
