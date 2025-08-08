import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { Task } from "../../../types/task";

interface TaskDetailActionsProps {
  task: Task;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// TaskDetailActions - Features complete/pending toggle, edit, and delete buttons
export function TaskDetailActions({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskDetailActionsProps) {
  const { colors } = useTheme();

  return (
    <View style={{ marginTop: 28, marginBottom: 40, paddingHorizontal: 24 }}>
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
          onPress={onToggleComplete}
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
          onPress={onEdit}
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
        onPress={onDelete}
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
  );
}
