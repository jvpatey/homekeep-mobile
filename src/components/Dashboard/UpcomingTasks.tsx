import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useSimpleAnimation, useHaptics } from "../../hooks";
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
  const { triggerLight } = useHaptics();
  const listAnimatedStyle = useSimpleAnimation(600, 600, 20);

  // TODO: Replace with real task data from API
  const upcomingTasks: Task[] = [];
  // Tasks will be loaded from Supabase database

  const getCategoryColor = (category: string): string => {
    const categoryColors: { [key: string]: string } = {
      HVAC: "#FF6B6B",
      Exterior: "#4ECDC4",
      Safety: "#FFA726",
      Plumbing: "#9B59B6",
      Electrical: "#3498DB",
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

  const renderTaskItem = ({ item: task }: { item: Task }) => (
    <TouchableOpacity
      style={[styles.taskItem, { backgroundColor: colors.surface }]}
      onPress={() => handleTaskPress(task.id)}
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
          <Text style={[styles.taskSubtitle, { color: colors.textSecondary }]}>
            {task.category} • Due {formatDueDate(task.next_due_date)}
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
