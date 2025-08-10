import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { Task } from "../../../types/task";

interface TaskDetailContentProps {
  task: Task;
  formatDueDate: (dateString: string) => string;
}

// TaskDetailContent - Features description, details grid, and recurring status
export function TaskDetailContent({
  task,
  formatDueDate,
}: TaskDetailContentProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 0 }}
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
              name={task.is_completed ? "checkmark-circle" : "ellipse-outline"}
              size={20}
              color={task.is_completed ? colors.success : colors.textSecondary}
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
              {task.is_completed ? "Completed" : "Incomplete"}
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
              <Ionicons name="time-outline" size={20} color={colors.primary} />
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
    </ScrollView>
  );
}
