import React, { useState } from "react";
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { MaintenanceTask } from "../../../../types/maintenance";
import { useAuth } from "../../../../context/AuthContext";
import { useTheme } from "../../../../context/ThemeContext";
import { createStyles } from "./styles";
// Removed inline reschedule to simplify and rely on edit flow

// SimpleTaskDetailModalProps
interface SimpleTaskDetailModalProps {
  task: MaintenanceTask | null;
  visible: boolean;
  onClose: () => void;
  onComplete: (instanceId: string) => void;
  onEdit?: (task: MaintenanceTask) => void;
  onModified?: () => void;
}

// SimpleTaskDetailModal component
export function SimpleTaskDetailModal({
  task,
  visible,
  onClose,
  onComplete,
  onEdit,
  onModified,
}: SimpleTaskDetailModalProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [isCompleting, setIsCompleting] = useState(false);
  const styles = createStyles(colors);

  if (!task) return null;

  // Map category to display info
  const getCategoryInfo = (category: string) => {
    const categoryMap: {
      [key: string]: {
        icon: string;
        gradient: [string, string];
        displayName: string;
      };
    } = {
      HVAC: {
        icon: "snow-outline",
        gradient: ["#FF6B6B", "#FF8E8E"],
        displayName: "HVAC",
      },
      PLUMBING: {
        icon: "water-outline",
        gradient: ["#4ECDC4", "#6EDDD6"],
        displayName: "Plumbing",
      },
      ELECTRICAL: {
        icon: "flash-outline",
        gradient: ["#FFE66D", "#FFF08C"],
        displayName: "Electrical",
      },
      APPLIANCES: {
        icon: "hardware-chip-outline",
        gradient: ["#A8E6CF", "#C8F0D9"],
        displayName: "Appliances",
      },
      EXTERIOR: {
        icon: "home-outline",
        gradient: ["#FF9A8B", "#FFB3A8"],
        displayName: "Exterior",
      },
      INTERIOR: {
        icon: "bed-outline",
        gradient: ["#B8E0D2", "#D0E8DD"],
        displayName: "Interior",
      },
      LANDSCAPING: {
        icon: "leaf-outline",
        gradient: ["#95E1D3", "#B0E8DD"],
        displayName: "Landscaping",
      },
      SAFETY: {
        icon: "shield-checkmark-outline",
        gradient: ["#F38181", "#F5A0A0"],
        displayName: "Safety",
      },
      GENERAL: {
        icon: "construct-outline",
        gradient: ["#C7CEEA", "#D8E0F0"],
        displayName: "General",
      },
    };

    return (
      categoryMap[category] || {
        icon: "construct-outline",
        gradient: ["#C7CEEA", "#D8E0F0"],
        displayName: category,
      }
    );
  };

  const category = getCategoryInfo(task.category);
  const priorityColors = {
    low: colors.success,
    medium: colors.warning,
    high: colors.accent,
    urgent: colors.error,
  };

  const formatDate = (dateString: string) => {
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
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return "No time estimate";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

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

  const handleComplete = async () => {
    if (isCompleting) return; // Prevent multiple clicks

    setIsCompleting(true);

    try {
      // Complete the task first
      await onComplete(task.instance_id);

      // Then close the modal after successful completion
      onClose();
    } catch (error) {
      console.error("Error completing task:", error);
      // Reset completion state on error
      setIsCompleting(false);
    }
  };

  const handleClose = () => {
    // Prevent any layout changes during close
    onClose();
  };

  // Rescheduling is handled through the Edit flow

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <View
          style={[styles.modalContainer, { backgroundColor: colors.surface }]}
        >
          {/* Minimalist Header */}
          <View
            style={[
              styles.headerGradient,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.headerContent}>
              {/* Close button */}
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.background },
                ]}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>

              {/* Category icon and name */}
              <View style={styles.categorySection}>
                <View
                  style={[
                    styles.categoryIconContainer,
                    {
                      backgroundColor: colors.background,
                      borderColor: priorityColors[task.priority],
                    },
                  ]}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={32}
                    color={priorityColors[task.priority]}
                    style={styles.categoryIcon}
                  />
                </View>
                <Text style={[styles.categoryName, { color: colors.text }]}>
                  {category.displayName}
                </Text>
              </View>

              {/* Task title */}
              <Text style={[styles.taskTitle, { color: colors.text }]}>
                {task.title}
              </Text>

              {/* Priority badge */}
              <View
                style={[
                  styles.priorityContainer,
                  { backgroundColor: colors.background },
                ]}
              >
                <View
                  style={[
                    styles.priorityDot,
                    { backgroundColor: priorityColors[task.priority] },
                  ]}
                />
                <Text style={[styles.priorityText, { color: colors.text }]}>
                  {task.priority.charAt(0).toUpperCase() +
                    task.priority.slice(1)}{" "}
                  Priority
                </Text>
              </View>
            </View>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Description */}
            {task.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{task.description}</Text>
              </View>
            )}

            {/* Task details */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Estimated Time</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(task.estimated_duration_minutes)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colors.secondary}
                  />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Due Date</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(task.due_date)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons
                    name="repeat-outline"
                    size={20}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Recurrence</Text>
                  <Text style={styles.detailValue}>
                    {formatInterval(task.interval_days)}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.actionsContainer}>
            {onEdit && (
              <TouchableOpacity
                style={[
                  styles.completeButton,
                  styles.actionSpacing,
                  {
                    backgroundColor: colors.accent, // warm yellow/orange
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 6,
                  },
                ]}
                onPress={() => onEdit(task)}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={24} color="white" />
                <Text style={styles.completeButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
            {/* Reschedule removed; use Edit to change due date */}
            <TouchableOpacity
              style={[
                styles.completeButton,
                {
                  backgroundColor: colors.success,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 6,
                },
                isCompleting && styles.completeButtonDisabled,
              ]}
              onPress={handleComplete}
              activeOpacity={0.8}
              disabled={isCompleting}
            >
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text style={styles.completeButtonText}>
                {isCompleting ? "Completing..." : "Mark as Complete"}
              </Text>
            </TouchableOpacity>
          </View>
          {/* No inline date picker */}
        </View>
      </View>
    </Modal>
  );
}
