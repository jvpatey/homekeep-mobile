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
import { useTheme } from "../../context/ThemeContext";
import { PriorityBadge } from "./PriorityBadge";
import { Task } from "../../types/task";

interface TaskItemProps {
  task: Task;
  onPress: (taskId: string) => void;
  onDelete?: (taskId: string, taskTitle: string) => void;
  getCategoryColor: (category: string) => string;
  formatDueDate: (dateString: string) => string;
  showDeleteButton?: boolean;
}

// TaskItem - Unified component for displaying tasks in both upcoming and completed sections
export function TaskItem({
  task,
  onPress,
  onDelete,
  getCategoryColor,
  formatDueDate,
  showDeleteButton = false,
}: TaskItemProps) {
  const { colors } = useTheme();
  const translateX = useSharedValue(0);

  // Determine if this is a completed task
  const isCompleted = task.is_completed;

  // Set up swipe gesture only if delete functionality is enabled
  const panGesture = showDeleteButton
    ? Gesture.Pan()
        .activeOffsetX([-10, 10])
        .onUpdate((event) => {
          if (event.translationX < 0) {
            translateX.value = Math.max(event.translationX, -76);
          }
        })
        .onEnd((event) => {
          const shouldShowDelete = event.translationX < -30;
          translateX.value = withTiming(shouldShowDelete ? -76 : 0);
        })
    : Gesture.Pan().enabled(false);

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
    zIndex: translateX.value < -10 ? 2 : 3,
  }));

  const deleteButtonStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -10 ? withTiming(1) : withTiming(0),
    transform: [
      { scale: translateX.value < -20 ? withTiming(1) : withTiming(0.8) },
    ],
    zIndex: translateX.value < -10 ? 1 : -1,
  }));

  return (
    <View style={styles.swipeContainer}>
      {showDeleteButton && onDelete && (
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
              <Ionicons name="trash-outline" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={animatedStyle}>
          <Animated.View
            style={[
              styles.taskItem,
              {
                backgroundColor: isCompleted
                  ? colors.success + "15"
                  : colors.surface,
              },
            ]}
          >
            {isCompleted && (
              <View
                style={[
                  {
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    backgroundColor: colors.success,
                    borderTopLeftRadius: 16,
                    borderBottomLeftRadius: 16,
                  },
                ]}
              />
            )}
            <View style={styles.taskItemLeft}>
              {!isCompleted && (
                <View
                  style={[
                    styles.categoryIndicator,
                    {
                      backgroundColor: getCategoryColor(task.category),
                    },
                  ]}
                />
              )}
              <View style={styles.taskInfo}>
                <View style={styles.taskTitleRow}>
                  <Text
                    style={[
                      styles.taskTitle,
                      {
                        color: isCompleted ? colors.success : colors.text,
                        opacity: isCompleted ? 0.8 : 1,
                        lineHeight: 18, // Adjusted for better fit
                        textDecorationLine: isCompleted
                          ? "line-through"
                          : "none",
                        textDecorationColor: isCompleted
                          ? colors.success
                          : "transparent",
                      },
                    ]}
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
                  style={[
                    styles.taskSubtitle,
                    {
                      color: isCompleted
                        ? colors.success + "CC"
                        : colors.textSecondary,
                      opacity: isCompleted ? 0.8 : 1,
                      lineHeight: 18, // Adjusted for better fit
                    },
                  ]}
                  numberOfLines={1}
                >
                  {task.category === "hvac"
                    ? task.category.toUpperCase()
                    : task.category.charAt(0).toUpperCase() +
                      task.category.slice(1).toLowerCase()}{" "}
                  • {isCompleted ? "Completed" : "Due"}{" "}
                  {formatDueDate(
                    isCompleted
                      ? task.completed_at || task.next_due_date
                      : task.next_due_date
                  )}
                  {task.estimated_duration && ` • ${task.estimated_duration}m`}
                </Text>
              </View>
            </View>
            <View style={styles.taskItemRight}>
              {isCompleted ? (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.success}
                />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = {
  swipeContainer: {
    position: "relative" as const,
    marginHorizontal: 2, // Small margin to prevent shadow clipping
  },
  deleteBackground: {
    position: "absolute" as const,
    right: 8, // 8px from edge
    top: 8, // 8px from top for separation
    bottom: 8, // 8px from bottom for separation
    width: 60, // Button width + small margin
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  deleteButton: {
    width: 56,
    flex: 1, // Take full height of container
    borderRadius: 12,
    overflow: "hidden" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    marginVertical: 4, // Small margin for visual separation
  },
  deleteGradient: {
    width: 56,
    flex: 1, // Take full height
    borderRadius: 12,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  taskItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    height: 72, // Fixed height instead of minHeight
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden" as const, // Ensure border doesn't affect layout
  },
  taskItemLeft: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
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
  taskTitleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.1,
  },
  taskSubtitle: {
    fontSize: 15,
    fontWeight: "400" as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  taskItemRight: {
    marginLeft: 16,
  },
};
