import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useTheme } from "../../../context/ThemeContext";
import { PriorityBadge } from "../PriorityBadge";
import { Task } from "../../../types/task";

interface SwipeableTaskItemProps {
  task: Task;
  onPress: (taskId: string) => void;
  onDelete: (taskId: string, taskTitle: string) => void;
  getCategoryColor: (category: string) => string;
  formatDueDate: (dateString: string) => string;
}

// SwipeableTaskItem - Features swipeable task item with delete button
export function SwipeableTaskItem({
  task,
  onPress,
  onDelete,
  getCategoryColor,
  formatDueDate,
}: SwipeableTaskItemProps) {
  const { colors } = useTheme();
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, -80);
      }
    })
    .onEnd((event) => {
      const shouldShowDelete = event.translationX < -30;
      translateX.value = withTiming(shouldShowDelete ? -80 : 0);
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (translateX.value < -10) {
      translateX.value = withTiming(0);
    } else {
      runOnJS(onPress)(task.id);
    }
  });

  const combinedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteButtonStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -20 ? withTiming(1) : withTiming(0),
    transform: [
      { scale: translateX.value < -20 ? withTiming(1) : withTiming(0.8) },
    ],
  }));

  return (
    <View style={styles.swipeContainer}>
      <Animated.View style={[styles.deleteBackground, deleteButtonStyle]}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            translateX.value = withTiming(0);
            onDelete(task.id, task.title);
          }}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#FF6B6B", "#E74C3C"]}
            style={styles.deleteGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="trash-outline" size={16} color="white" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            style={[styles.taskItem, { backgroundColor: colors.surface }]}
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
                  <PriorityBadge
                    priority={task.priority}
                    size="small"
                    variant="card"
                  />
                </View>
                <Text
                  style={[styles.taskSubtitle, { color: colors.textSecondary }]}
                >
                  {task.category === "hvac"
                    ? task.category.toUpperCase()
                    : task.category.charAt(0).toUpperCase() +
                      task.category.slice(1).toLowerCase()}{" "}
                  • Due {formatDueDate(task.next_due_date)}
                  {task.estimated_duration && ` • ${task.estimated_duration}m`}
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
}

const styles = {
  swipeContainer: {
    position: "relative" as const,
    marginBottom: 12,
  },
  deleteBackground: {
    position: "absolute" as const,
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    zIndex: 1,
  },
  deleteButton: {
    flex: 1,
  },
  deleteGradient: {
    width: 72,
    height: 72,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600" as const,
    marginTop: 2,
  },
  taskItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  taskItemLeft: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  categoryIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    flex: 1,
    marginRight: 8,
  },
  taskSubtitle: {
    fontSize: 14,
  },
  taskItemRight: {
    marginLeft: 12,
  },
};
