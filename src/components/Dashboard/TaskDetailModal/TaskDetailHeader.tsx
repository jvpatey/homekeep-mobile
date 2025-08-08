import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PriorityBadge } from "../PriorityBadge";
import { Task } from "../../../types/task";

interface TaskDetailHeaderProps {
  task: Task;
  onClose: () => void;
  getCategoryGradient: (category: string) => [string, string];
}

// TaskDetailHeader - Features gradient styling, priority badge, and close button
export function TaskDetailHeader({
  task,
  onClose,
  getCategoryGradient,
}: TaskDetailHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
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

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
  );
}
