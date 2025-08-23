import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";
import {
  HOME_MAINTENANCE_CATEGORIES,
  CategoryKey,
} from "../../types/maintenance";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "src/theme/colors";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth - 80; // 40px padding on each side for better centering

interface TaskCardProps {
  id: string;
  instance_id: string;
  title: string;
  category: CategoryKey;
  priority: "low" | "medium" | "high" | "urgent";
  estimated_duration_minutes?: number;
  due_date: string;
  is_completed?: boolean;
  onComplete: (instanceId: string) => void;
  onPress?: (instanceId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  id,
  instance_id,
  title,
  category,
  priority,
  estimated_duration_minutes,
  due_date,
  is_completed = false,
  onComplete,
  onPress,
}) => {
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
    onComplete(instance_id);
  };

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
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
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
