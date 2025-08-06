import React from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
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
import { styles } from "./styles";

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

interface Task {
  id: string;
  title: string;
  category: string;
  next_due_date: string;
  priority: "low" | "medium" | "high" | "urgent";
  estimated_duration?: number;
}

// UpcomingTasks Features proper touch targets, category indicators, and navigation

export function UpcomingTasks() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { triggerLight, triggerMedium } = useHaptics();
  const tasksHook = useTasks();
  const { upcomingTasks, loading, deleteTask } = tasksHook;
  const listAnimatedStyle = useSimpleAnimation(600, 600, 20);

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
    // TODO: Navigate to task detail
    console.log(`Navigate to task ${taskId}`);
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

    const tapGesture = Gesture.Tap().onStart(() => {
      // Reset position when tapping the main item
      if (translateX.value < 0) {
        translateX.value = withTiming(0);
      }
    });

    const combinedGesture = Gesture.Simultaneous(panGesture, tapGesture);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
      height: itemHeight.value === 1 ? undefined : withTiming(0),
    }));

    const deleteButtonStyle = useAnimatedStyle(() => ({
      opacity: translateX.value < -20 ? withTiming(1) : withTiming(0),
      transform: [
        { scale: translateX.value < -20 ? withTiming(1) : withTiming(0.8) },
      ],
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
          >
            <Ionicons name="trash" size={24} color="white" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Main task item */}
        <GestureDetector gesture={combinedGesture}>
          <Animated.View style={animatedStyle}>
            <TouchableOpacity
              style={[styles.taskItem, { backgroundColor: colors.surface }]}
              onPress={() => {
                if (translateX.value < 0) {
                  // Reset if swiped out
                  translateX.value = withTiming(0);
                } else {
                  // Normal press action
                  handleTaskPress(task.id);
                }
              }}
              onLongPress={() => handleDeleteTask(task.id, task.title)}
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
  );
}
