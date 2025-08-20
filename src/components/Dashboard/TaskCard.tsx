import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";
import { DesignSystem } from "../../theme/designSystem";
import { HOME_MAINTENANCE_CATEGORIES, CategoryKey } from "../../types/task";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");

interface TaskCardProps {
  id: string;
  title: string;
  category: CategoryKey;
  priority: "low" | "medium" | "high" | "urgent";
  estimatedDuration?: number;
  dueDate: string;
  isCompleted?: boolean;
  onComplete: (taskId: string) => void;
  onPress?: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  id,
  title,
  category,
  priority,
  estimatedDuration,
  dueDate,
  isCompleted = false,
  onComplete,
  onPress,
}) => {
  const categoryInfo = HOME_MAINTENANCE_CATEGORIES[category];
  const isOverdue = new Date(dueDate) < new Date() && !isCompleted;

  const getPriorityColor = () => {
    switch (priority) {
      case "urgent":
        return colors.light.error;
      case "high":
        return "#FF6B35";
      case "medium":
        return colors.light.warning;
      case "low":
        return colors.light.success;
      default:
        return colors.light.textSecondary;
    }
  };

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

  const handleComplete = () => {
    onComplete(id);
  };

  const handlePress = () => {
    if (onPress) {
      onPress(id);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isCompleted && styles.completedContainer,
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
              <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
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
                  color={colors.light.textSecondary}
                />
                <Text style={styles.metaText}>
                  {estimatedDuration
                    ? `${estimatedDuration} min`
                    : "No time estimate"}
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.light.textSecondary}
                />
                <Text
                  style={[styles.metaText, isOverdue && styles.overdueText]}
                >
                  {formatDueDate(dueDate)}
                </Text>
              </View>
            </View>

            {/* Completion Button */}
            <TouchableOpacity
              style={[
                styles.completeButton,
                isCompleted && styles.completedButton,
              ]}
              onPress={handleComplete}
              activeOpacity={0.8}
            >
              {isCompleted ? (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.light.success}
                />
              ) : (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={colors.light.surface}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth - DesignSystem.spacing.md * 2,
    height: 200,
    borderRadius: DesignSystem.borders.radius.large,
    marginHorizontal: DesignSystem.spacing.md,
    ...DesignSystem.shadows.large,
  },
  completedContainer: {
    opacity: 0.7,
  },
  overdueContainer: {
    borderWidth: 2,
    borderColor: colors.light.error,
  },
  gradientBackground: {
    flex: 1,
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: DesignSystem.spacing.xs,
  },
  categoryText: {
    ...DesignSystem.typography.smallSemiBold,
    color: colors.light.surface,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: DesignSystem.spacing.xs,
  },
  priorityText: {
    ...DesignSystem.typography.captionSemiBold,
    color: colors.light.surface,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  title: {
    ...DesignSystem.typography.h3,
    color: colors.light.surface,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  metaInfo: {
    flex: 1,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.xs,
  },
  metaText: {
    ...DesignSystem.typography.small,
    color: colors.light.surface,
    marginLeft: DesignSystem.spacing.xs,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  overdueText: {
    color: colors.light.error,
    fontWeight: "600",
  },
  completeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    ...DesignSystem.shadows.medium,
  },
  completedButton: {
    backgroundColor: colors.light.success,
  },
});

export default TaskCard;
