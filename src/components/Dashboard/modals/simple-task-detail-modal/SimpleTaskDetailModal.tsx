import React, { useState } from "react";
import { View, Modal, Text, TouchableOpacity, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../../theme/colors";
import { MaintenanceTask } from "../../../../types/maintenance";
import { useAuth } from "../../../../context/AuthContext";
import { styles } from "./styles";

// SimpleTaskDetailModalProps
interface SimpleTaskDetailModalProps {
  task: MaintenanceTask | null;
  visible: boolean;
  onClose: () => void;
  onComplete: (instanceId: string) => void;
}

// SimpleTaskDetailModal component
export function SimpleTaskDetailModal({
  task,
  visible,
  onClose,
  onComplete,
}: SimpleTaskDetailModalProps) {
  const { user } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);

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
    low: colors.light.success,
    medium: colors.light.warning,
    high: colors.light.accent,
    urgent: colors.light.error,
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

  const handleComplete = () => {
    if (isCompleting) return; // Prevent multiple clicks

    setIsCompleting(true);
    // Close modal first to prevent re-rendering issues
    onClose();
    // Then complete the task
    setTimeout(() => {
      onComplete(task.instance_id);
      setIsCompleting(false);
    }, 100);
  };

  const handleClose = () => {
    // Prevent any layout changes during close
    onClose();
  };

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
        <View style={styles.modalContainer}>
          {/* Header with gradient */}
          <LinearGradient
            colors={category.gradient}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              {/* Close button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>

              {/* Category icon and name */}
              <View style={styles.categorySection}>
                <Ionicons
                  name={category.icon as any}
                  size={48}
                  color="white"
                  style={styles.categoryIcon}
                />
                <Text style={styles.categoryName}>{category.displayName}</Text>
              </View>

              {/* Task title */}
              <Text style={styles.taskTitle}>{task.title}</Text>

              {/* Priority badge */}
              <View style={styles.priorityContainer}>
                <View
                  style={[
                    styles.priorityDot,
                    { backgroundColor: priorityColors[task.priority] },
                  ]}
                />
                <Text style={styles.priorityText}>
                  {task.priority.charAt(0).toUpperCase() +
                    task.priority.slice(1)}{" "}
                  Priority
                </Text>
              </View>
            </View>
          </LinearGradient>

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
                    color={colors.light.primary}
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
                    color={colors.light.secondary}
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
                    color={colors.light.accent}
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
            <TouchableOpacity
              style={[
                styles.completeButton,
                isCompleting && styles.completeButtonDisabled,
              ]}
              onPress={handleComplete}
              activeOpacity={0.8}
              disabled={isCompleting}
            >
              <LinearGradient
                colors={[colors.light.success, "#4CAF50"]}
                style={styles.completeButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <Text style={styles.completeButtonText}>
                  {isCompleting ? "Completing..." : "Mark as Complete"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
