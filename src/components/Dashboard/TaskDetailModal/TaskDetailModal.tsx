import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSimpleAnimation, useHaptics } from "../../../hooks";
import { useTasks } from "../../../context/TasksContext";
import { useTheme } from "../../../context/ThemeContext";
import { PriorityBadge } from "../PriorityBadge";
import { Task } from "../../../types/task";
import { styles } from "../styles";

interface TaskDetailModalProps {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
}

export function TaskDetailModal({
  task,
  visible,
  onClose,
  onEdit,
}: TaskDetailModalProps) {
  const { colors } = useTheme();
  const { triggerLight, triggerMedium } = useHaptics();
  const { deleteTask, updateTask } = useTasks();
  const modalAnimatedStyle = useSimpleAnimation(0, 400, 20);
  const insets = useSafeAreaInsets();

  if (!task) return null;

  const getCategoryColor = (category: string): string => {
    const categoryColors: { [key: string]: string } = {
      hvac: "#FF6B6B",
      plumbing: "#4ECDC4",
      electrical: "#45B7D1",
      appliances: "#96CEB4",
      maintenance: "#FFEAA7",
      cleaning: "#DDA0DD",
      landscaping: "#98D8C8",
    };
    return categoryColors[category.toLowerCase()] || "#95A5A6";
  };

  const getCategoryGradient = (category: string): string[] => {
    const baseColor = getCategoryColor(category);
    // Create a gradient by lightening the base color
    const lightColor = baseColor + "CC"; // Add transparency for lighter effect
    return [baseColor, lightColor];
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
        weekday: "short",
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

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
        {/* Header with gradient */}
        <LinearGradient
          colors={getCategoryGradient(task.category)}
          style={{
            paddingTop: Math.max(insets.top, 8),
            paddingBottom: 20,
            paddingHorizontal: 24,
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View style={{ flex: 1 }}>
              {/* Task Title */}
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "800",
                  color: "white",
                  letterSpacing: -0.5,
                  lineHeight: 34,
                  marginBottom: 16,
                }}
              >
                {task.title}
              </Text>

              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: "rgba(255, 255, 255, 0.8)",
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    Category
                  </Text>
                  <View
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 10,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: "white",
                        letterSpacing: 0.3,
                      }}
                    >
                      {task.category.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: "rgba(255, 255, 255, 0.8)",
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    Priority
                  </Text>
                  <PriorityBadge
                    priority={task.priority}
                    size="medium"
                    variant="header"
                  />
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                justifyContent: "center",
                alignItems: "center",
                marginLeft: 16,
              }}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 24, paddingTop: 28 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Description */}
          {task.description && (
            <View style={{ marginBottom: 32 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  marginBottom: 12,
                  letterSpacing: 0.3,
                  color: colors.text,
                  textTransform: "uppercase",
                }}
              >
                Description
              </Text>
              <Text
                style={{
                  fontSize: 17,
                  lineHeight: 26,
                  color: colors.textSecondary,
                  letterSpacing: 0.2,
                  fontWeight: "400",
                }}
              >
                {task.description}
              </Text>
            </View>
          )}

          {/* Details Grid */}
          <View style={{ marginBottom: 36 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 16,
                letterSpacing: 0.3,
                color: colors.text,
                textTransform: "uppercase",
              }}
            >
              Details
            </Text>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginHorizontal: -6,
              }}
            >
              {/* Due Date */}
              <View
                style={{
                  width: "48%",
                  marginHorizontal: "1%",
                  marginBottom: 12,
                  padding: 16,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: colors.surface,
                  shadowColor: "#000000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 1,
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    marginTop: 8,
                    marginBottom: 4,
                    textAlign: "center",
                    letterSpacing: 0.2,
                    color: colors.textSecondary,
                  }}
                >
                  Due Date
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    textAlign: "center",
                    letterSpacing: 0.1,
                    color: colors.text,
                  }}
                >
                  {formatDueDate(task.next_due_date)}
                </Text>
              </View>

              {/* Status */}
              <View
                style={{
                  width: "48%",
                  marginHorizontal: "1%",
                  marginBottom: 12,
                  padding: 16,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: colors.surface,
                  shadowColor: "#000000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 1,
                }}
              >
                <Ionicons
                  name={
                    task.is_completed ? "checkmark-circle" : "ellipse-outline"
                  }
                  size={20}
                  color={
                    task.is_completed ? colors.success : colors.textSecondary
                  }
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    marginTop: 8,
                    marginBottom: 4,
                    textAlign: "center",
                    letterSpacing: 0.2,
                    color: colors.textSecondary,
                  }}
                >
                  Status
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    textAlign: "center",
                    letterSpacing: 0.1,
                    color: colors.text,
                  }}
                >
                  {task.is_completed ? "Completed" : "Pending"}
                </Text>
              </View>

              {/* Duration */}
              {task.estimated_duration && (
                <View
                  style={{
                    width: "48%",
                    marginHorizontal: "1%",
                    marginBottom: 12,
                    padding: 16,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: colors.surface,
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 1,
                  }}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      marginTop: 8,
                      marginBottom: 4,
                      textAlign: "center",
                      letterSpacing: 0.2,
                      color: colors.textSecondary,
                    }}
                  >
                    Duration
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      textAlign: "center",
                      letterSpacing: 0.1,
                      color: colors.text,
                    }}
                  >
                    {task.estimated_duration}m
                  </Text>
                </View>
              )}

              {/* Recurring */}
              {task.is_recurring && (
                <View
                  style={{
                    width: "48%",
                    marginHorizontal: "1%",
                    marginBottom: 12,
                    padding: 16,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: colors.surface,
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 1,
                  }}
                >
                  <Ionicons
                    name="repeat-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      marginTop: 8,
                      marginBottom: 4,
                      textAlign: "center",
                      letterSpacing: 0.2,
                      color: colors.textSecondary,
                    }}
                  >
                    Recurring
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      textAlign: "center",
                      letterSpacing: 0.1,
                      color: colors.text,
                    }}
                  >
                    {task.recurrence_type || "Yes"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ marginTop: 28, marginBottom: 40 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 16,
                letterSpacing: 0.3,
                color: colors.text,
                textTransform: "uppercase",
              }}
            >
              Actions
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: task.is_completed
                    ? colors.textSecondary
                    : colors.success,
                  shadowColor: "#000000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                  marginRight: 6,
                }}
                onPress={handleToggleComplete}
              >
                <Ionicons
                  name={task.is_completed ? "refresh" : "checkmark"}
                  size={20}
                  color="white"
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "white",
                    marginLeft: 6,
                    letterSpacing: 0.2,
                  }}
                >
                  {task.is_completed ? "Pending" : "Complete"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  shadowColor: "#000000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                  marginLeft: 6,
                }}
                onPress={handleEdit}
              >
                <Ionicons name="pencil" size={20} color="white" />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "white",
                    marginLeft: 6,
                    letterSpacing: 0.2,
                  }}
                >
                  Edit
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 12,
                marginTop: 12,
                backgroundColor: colors.error,
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="white" />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "white",
                  marginLeft: 6,
                  letterSpacing: 0.2,
                }}
              >
                Delete Task
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
