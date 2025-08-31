import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import {
  HOME_MAINTENANCE_CATEGORIES,
  CategoryKey,
} from "../../../types/maintenance";
import { colors } from "src/theme/colors";
import { styles } from "./styles";

// TaskCardProps interface for the TaskCard component
interface TaskCardProps {
  id: string;
  instance_id: string;
  title: string;
  category: CategoryKey;
  priority: "low" | "medium" | "high" | "urgent";
  estimated_duration_minutes?: number;
  interval_days: number;
  due_date: string;
  is_completed?: boolean;
  onComplete: (instanceId: string) => void;
  onPress?: (instanceId: string) => void;
}

// TaskCard component for the Dashboard
export function TaskCard({
  id,
  instance_id,
  title,
  category,
  priority,
  estimated_duration_minutes,
  interval_days,
  due_date,
  is_completed = false,
  onComplete,
  onPress,
}: TaskCardProps) {
  const { colors } = useTheme();
  const categoryInfo = HOME_MAINTENANCE_CATEGORIES[category];
  const isOverdue = new Date(due_date) < new Date() && !is_completed;

  const getPriorityColor = () => {
    switch (priority) {
      case "urgent":
        return colors.error;
      case "high":
        return "#FF6B35";
      case "medium":
        return colors.warning;
      case "low":
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  // formatDueDate function to format the due date
  const formatDueDate = (dateString: string) => {
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

  // formatInterval function to format the interval
  const formatInterval = (intervalDays: number) => {
    if (intervalDays === 7) return "Weekly";
    if (intervalDays === 30) return "Monthly";
    if (intervalDays === 90) return "Quarterly";
    if (intervalDays === 365) return "Yearly";
    if (intervalDays === 1) return "Daily";
    if (intervalDays < 7) return `Every ${intervalDays} days`;
    if (intervalDays < 30) return `Every ${Math.round(intervalDays / 7)} weeks`;
    if (intervalDays < 365)
      return `Every ${Math.round(intervalDays / 30)} months`;
    return `Every ${Math.round(intervalDays / 365)} years`;
  };

  // handleComplete function to handle the complete task
  const handleComplete = () => {
    onComplete(instance_id);
  };

  // handlePress function to handle the press of the task
  const handlePress = () => {
    if (onPress) {
      onPress(instance_id);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        is_completed && styles.completedContainer,
        isOverdue && styles.overdueContainer,
      ]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={categoryInfo.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.categoryContainer}>
              <Ionicons
                name={categoryInfo.icon as any}
                size={24}
                color="white"
                style={styles.categoryIcon}
              />
              <Text style={styles.categoryText}>
                {categoryInfo.displayName}
              </Text>
            </View>

            <View style={styles.priorityContainer}>
              <View
                style={[
                  styles.priorityDot,
                  { backgroundColor: getPriorityColor() },
                ]}
              />
              <Text style={styles.priorityText}>{priority.toUpperCase()}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.metaText}>
                  {estimated_duration_minutes
                    ? `${estimated_duration_minutes} min`
                    : "No time estimate"}
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.metaText, isOverdue && styles.overdueText]}
                >
                  {formatDueDate(due_date)}
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons
                  name="repeat-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.metaText}>
                  {formatInterval(interval_days)}
                </Text>
              </View>
            </View>

            {/* Completion Button */}
            <TouchableOpacity
              style={[
                styles.completeButton,
                is_completed && styles.completedButton,
              ]}
              onPress={handleComplete}
              activeOpacity={0.8}
            >
              {is_completed ? (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.success}
                />
              ) : (
                <Ionicons name="checkmark" size={20} color={colors.surface} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
