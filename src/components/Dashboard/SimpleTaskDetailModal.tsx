import React, { useState } from "react";
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { DesignSystem } from "../../theme/designSystem";
import { MaintenanceTask } from "../../types/maintenance";
import { useAuth } from "../../context/AuthContext";

const { width: screenWidth } = Dimensions.get("window");

interface SimpleTaskDetailModalProps {
  task: MaintenanceTask | null;
  visible: boolean;
  onClose: () => void;
  onComplete: (instanceId: string) => void;
}

const SimpleTaskDetailModal: React.FC<SimpleTaskDetailModalProps> = ({
  task,
  visible,
  onClose,
  onComplete,
}) => {
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

            {/* Category description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                About {category.displayName}
              </Text>
              <Text style={styles.categoryDescription}>
                {task.description ||
                  `Maintenance tasks for ${category.displayName.toLowerCase()} systems and components.`}
              </Text>
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
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.lg,
    zIndex: 9999,
  },
  modalContainer: {
    width: screenWidth - 40,
    height: "85%",
    backgroundColor: colors.light.surface,
    borderRadius: DesignSystem.borders.radius.large,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  headerGradient: {
    paddingTop: DesignSystem.spacing.xl,
    paddingBottom: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  headerContent: {
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: DesignSystem.spacing.md,
    right: DesignSystem.spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  categorySection: {
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  categoryIcon: {
    marginBottom: DesignSystem.spacing.xs,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    letterSpacing: 0.5,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    marginBottom: DesignSystem.spacing.md,
    lineHeight: 30,
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.medium,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: DesignSystem.spacing.xs,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  content: {
    flex: 1,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.lg,
    minHeight: 0, // Prevent flex layout issues
  },
  contentContainer: {
    paddingBottom: DesignSystem.spacing.lg,
  },
  section: {
    marginBottom: DesignSystem.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.light.text,
    marginBottom: DesignSystem.spacing.sm,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.light.textSecondary,
  },
  detailsGrid: {
    marginBottom: DesignSystem.spacing.lg,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  detailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: DesignSystem.spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.light.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.text,
  },
  categoryDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.light.textSecondary,
  },
  actionsContainer: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.md,
  },
  completeButton: {
    borderRadius: DesignSystem.borders.radius.medium,
    overflow: "hidden",
    ...DesignSystem.shadows.medium,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginLeft: DesignSystem.spacing.sm,
  },
});

export default SimpleTaskDetailModal;
