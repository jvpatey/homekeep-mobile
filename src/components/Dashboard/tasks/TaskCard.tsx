import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
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

  // Animation values
  const cardScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

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

  // Animation handlers
  const handleCardPressIn = () => {
    cardScale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handleCardPressOut = () => {
    cardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <Animated.View style={cardAnimatedStyle}>
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderColor: categoryInfo.color,
            borderWidth: 2,
          },
          is_completed && styles.completedContainer,
          isOverdue && styles.overdueContainer,
        ]}
        onPress={handlePress}
        onPressIn={handleCardPressIn}
        onPressOut={handleCardPressOut}
        activeOpacity={0.9}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.categoryContainer}>
              <Ionicons
                name={categoryInfo.icon as any}
                size={24}
                color={categoryInfo.color}
                style={styles.categoryIcon}
              />
              <Text
                style={[styles.categoryText, { color: categoryInfo.color }]}
              >
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
              <Text
                style={[styles.priorityText, { color: colors.textSecondary }]}
              >
                {priority.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={2}
          >
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
                <Text
                  style={[styles.metaText, { color: colors.textSecondary }]}
                >
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
                  style={[
                    styles.metaText,
                    { color: colors.textSecondary },
                    isOverdue && styles.overdueText,
                  ]}
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
                <Text
                  style={[styles.metaText, { color: colors.textSecondary }]}
                >
                  {formatInterval(interval_days)}
                </Text>
              </View>
            </View>

            {/* Completion Button */}
            <Animated.View style={buttonAnimatedStyle}>
              <TouchableOpacity
                style={[
                  styles.completeButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: is_completed ? colors.success : colors.primary,
                    borderWidth: 2,
                  },
                ]}
                onPress={handleComplete}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                activeOpacity={0.8}
              >
                {is_completed ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.success}
                  />
                ) : (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
