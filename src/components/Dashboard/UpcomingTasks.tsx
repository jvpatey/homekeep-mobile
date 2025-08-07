import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useSimpleAnimation, useHaptics } from "../../hooks";
import { useTasks } from "../../context/TasksContext";
import { AppStackParamList } from "../../navigation/types";
import { TaskDetailModal } from "./TaskDetailModal";
import { Task } from "../../types/task";
import { styles } from "./styles";

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

// UpcomingTasks Features proper touch targets, category indicators, and navigation

export function UpcomingTasks() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { triggerLight, triggerMedium } = useHaptics();
  const tasksHook = useTasks();
  const { upcomingTasks, loading, deleteTask } = tasksHook;
  const listAnimatedStyle = useSimpleAnimation(600, 600, 20);

  // Task detail modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailVisible, setTaskDetailVisible] = useState(false);

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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "alert-circle" as const;
      case "high":
        return "chevron-up" as const;
      case "medium":
        return "remove" as const;
      case "low":
        return "chevron-down" as const;
      default:
        return "remove" as const;
    }
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
    const task = upcomingTasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setTaskDetailVisible(true);
    }
  };

  const handleCloseTaskDetail = () => {
    setTaskDetailVisible(false);
    setSelectedTask(null);
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

  const SwipeableTaskItem = ({ task }: { task: Task }) => {
    const translateX = useSharedValue(0);
    const itemHeight = useSharedValue(1);
    const opacity = useSharedValue(1);

    const panGesture = Gesture.Pan()
      .activeOffsetX([-10, 10]) // Require 10px movement to activate
      .onUpdate((event) => {
        // Only allow left swipe (negative values)
        if (event.translationX < 0) {
          translateX.value = Math.max(event.translationX, -80);
        }
      })
      .onEnd((event) => {
        const shouldShowDelete = event.translationX < -30;

        if (shouldShowDelete) {
          // Keep delete button visible
          translateX.value = withTiming(-80);
        } else {
          // Reset position
          translateX.value = withTiming(0);
        }
      });

    const tapGesture = Gesture.Tap().onEnd(() => {
      // Handle tap on the main task item
      if (translateX.value < -10) {
        // If swiped out, reset position
        translateX.value = withTiming(0);
      } else {
        // Normal task press
        runOnJS(handleTaskPress)(task.id);
      }
    });

    const combinedGesture = Gesture.Exclusive(panGesture, tapGesture);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
      height: itemHeight.value === 1 ? undefined : withTiming(0),
      zIndex: 2, // Always above delete button
    }));

    const deleteButtonStyle = useAnimatedStyle(() => ({
      opacity: translateX.value < -20 ? withTiming(1) : withTiming(0),
      transform: [
        { scale: translateX.value < -20 ? withTiming(1) : withTiming(0.8) },
      ],
      zIndex: translateX.value < -10 ? 1 : -1, // Hide behind when not swiped
    }));

    return (
      <View style={styles.swipeContainer}>
        {/* Delete button background */}
        <Animated.View style={[styles.deleteBackground, deleteButtonStyle]}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              // Reset position first, then show delete confirmation
              translateX.value = withTiming(0);
              handleDeleteTask(task.id, task.title);
            }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#FF6B6B", "#E74C3C"]}
              style={{
                width: 72,
                height: 72,
                borderTopRightRadius: 16,
                borderBottomRightRadius: 16,
                justifyContent: "center",
                alignItems: "center",
              }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="trash-outline" size={16} color="white" />
              <Text style={[styles.deleteButtonText, { color: "white" }]}>
                Delete
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Main task item */}
        <GestureDetector gesture={combinedGesture}>
          <Animated.View style={animatedStyle}>
            <TouchableOpacity
              style={[styles.taskItem, { backgroundColor: colors.surface }]}
              onLongPress={() => handleDeleteTask(task.id, task.title)}
              activeOpacity={0.7}
            >
              <View style={styles.taskItemLeft}>
                <View
                  style={[
                    styles.categoryIndicator,
                    { backgroundColor: getCategoryColor(task.category) },
                  ]}
                />
                <View style={styles.taskInfo}>
                  <View style={styles.taskTitleRow}>
                    <Text
                      style={[styles.taskTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                    <Ionicons
                      name={getPriorityIcon(task.priority)}
                      size={16}
                      color={colors.textSecondary}
                      style={styles.priorityIcon}
                    />
                  </View>
                  <Text
                    style={[
                      styles.taskSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {task.category} • Due {formatDueDate(task.next_due_date)}
                    {task.estimated_duration &&
                      ` • ${task.estimated_duration}m`}
                  </Text>
                </View>
              </View>
              <View style={styles.taskItemRight}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      </View>
    );
  };

  const renderTaskItem = ({ item: task }: { item: Task }) => (
    <SwipeableTaskItem task={task} />
  );

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Upcoming Tasks
      </Text>
      <TouchableOpacity
        style={styles.seeAllButton}
        onPress={() => {
          triggerLight();
          // TODO: Navigate to all tasks
        }}
      >
        <Text style={[styles.seeAllText, { color: colors.primary }]}>
          See All
        </Text>
      </TouchableOpacity>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="clipboard-outline"
        size={48}
        color={colors.textSecondary}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        No upcoming tasks
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
        Tap the + button to create your first task
      </Text>
    </View>
  );

  return (
    <>
      <Animated.View style={[styles.upcomingContainer, listAnimatedStyle]}>
        <FlatList
          data={upcomingTasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyState}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        visible={taskDetailVisible}
        onClose={handleCloseTaskDetail}
        onEdit={handleEditTask}
      />
    </>
  );
}
