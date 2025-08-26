import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { DesignSystem } from "../../theme/designSystem";
import { colors } from "../../theme/colors";
import { MaintenanceTask } from "../../types/maintenance";

interface DueSoonPopupProps {
  tasks: MaintenanceTask[];
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get("window");

const DueSoonPopup: React.FC<DueSoonPopupProps> = ({ tasks, onClose }) => {
  // Animation values
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  // Carousel state
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  useEffect(() => {
    // Entrance animation
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withTiming(1, { duration: 400 });

    // Content animation
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleClose = () => {
    // Exit animation
    opacity.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(0.8, { duration: 200 });

    // Close after animation
    setTimeout(onClose, 200);
  };

  const goToNextTask = () => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    }
  };

  const goToPreviousTask = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1);
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return "Overdue";

    // Show actual date for all other cases
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const renderTaskItem = ({ item }: { item: MaintenanceTask }) => (
    <View style={styles.taskItem}>
      {/* Task Header with Category Badge */}
      <View style={styles.taskHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {item.category === "HVAC"
              ? "HVAC"
              : item.category.charAt(0).toUpperCase() +
                item.category.slice(1).toLowerCase()}
          </Text>
        </View>
        <View style={styles.urgencyIndicator}>
          <View style={styles.urgencyDot} />
        </View>
      </View>

      {/* Task Title */}
      <Text style={styles.taskTitle} numberOfLines={2}>
        {item.title}
      </Text>

      {/* Task Details with Enhanced Layout */}
      <View style={styles.taskDetails}>
        <View style={styles.detailRow}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color="rgba(255, 255, 255, 0.8)"
            />
          </View>
          <Text style={styles.detailText}>
            Due {formatDueDate(item.due_date)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="construct-outline"
              size={18}
              color="rgba(255, 255, 255, 0.8)"
            />
          </View>
          <Text style={styles.detailText}>{item.category}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="checkmark-circle" size={48} color="white" />
      <Text style={styles.emptyStateTitle}>All Caught Up!</Text>
    </View>
  );

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.overlayTouchable}
        onPress={handleClose}
        activeOpacity={1}
      />
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        <LinearGradient
          colors={["#3B82F6", "#1D4ED8"]}
          style={styles.gradientBackground}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          {/* Content */}
          <Animated.View style={[styles.content, contentAnimatedStyle]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerIconContainer}>
                <View style={styles.headerIcon}>
                  <Ionicons name="time" size={32} color="#3B82F6" />
                </View>
              </View>
              <Text style={styles.headerTitle}>Due Soon</Text>
              <Text style={styles.headerSubtitle}>
                {tasks.length} task{tasks.length !== 1 ? "s" : ""} coming up
              </Text>
            </View>

            {/* Tasks Display */}
            {tasks.length > 0 ? (
              <View style={styles.tasksContainer}>
                {/* Navigation Arrows */}
                <View style={styles.navigationContainer}>
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      currentTaskIndex === 0 && styles.navButtonDisabled,
                    ]}
                    onPress={goToPreviousTask}
                    disabled={currentTaskIndex === 0}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={24}
                      color={
                        currentTaskIndex === 0
                          ? "rgba(255, 255, 255, 0.3)"
                          : "white"
                      }
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      currentTaskIndex === tasks.length - 1 &&
                        styles.navButtonDisabled,
                    ]}
                    onPress={goToNextTask}
                    disabled={currentTaskIndex === tasks.length - 1}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={
                        currentTaskIndex === tasks.length - 1
                          ? "rgba(255, 255, 255, 0.3)"
                          : "white"
                      }
                    />
                  </TouchableOpacity>
                </View>

                {/* Current Task */}
                <View style={styles.currentTaskContainer}>
                  {renderTaskItem({ item: tasks[currentTaskIndex] })}
                </View>

                {/* Pagination Indicator */}
                <View style={styles.paginationContainer}>
                  <Text style={styles.paginationText}>
                    {currentTaskIndex + 1} of {tasks.length}
                  </Text>
                </View>
              </View>
            ) : (
              renderEmptyState()
            )}
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  overlayTouchable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: "92%",
    maxWidth: 420,
    maxHeight: "85%",
    borderRadius: DesignSystem.borders.radius.xlarge,
    overflow: "hidden",
    ...DesignSystem.shadows.large,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  gradientBackground: {
    padding: DesignSystem.spacing.lg,
  },
  closeButton: {
    position: "absolute",
    top: DesignSystem.spacing.md,
    right: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.xs,
    zIndex: 10,
  },
  content: {
    alignItems: "center",
    paddingTop: DesignSystem.spacing.md,
  },
  header: {
    alignItems: "center",
    marginBottom: DesignSystem.spacing.xl,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...DesignSystem.typography.h1,
    color: "white",
    textAlign: "center",
    marginBottom: DesignSystem.spacing.sm,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    ...DesignSystem.typography.bodySemiBold,
    color: "white",
    textAlign: "center",
    opacity: 0.9,
  },
  tasksContainer: {
    width: "100%",
    alignItems: "center",
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.sm,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  navButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  currentTaskContainer: {
    width: "100%",
    marginBottom: DesignSystem.spacing.md,
  },
  paginationContainer: {
    alignItems: "center",
    marginTop: DesignSystem.spacing.sm,
  },
  paginationText: {
    ...DesignSystem.typography.caption,
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  taskItem: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    width: "100%",
    marginBottom: DesignSystem.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  categoryBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borders.radius.small,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  categoryText: {
    ...DesignSystem.typography.caption,
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  urgencyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  urgencyDot: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  taskTitle: {
    ...DesignSystem.typography.bodySemiBold,
    color: "white",
    fontSize: 18,
    marginBottom: DesignSystem.spacing.md,
    textAlign: "left",
    lineHeight: 24,
  },
  taskDetails: {
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  detailText: {
    ...DesignSystem.typography.caption,
    color: "white",
    opacity: 0.9,
    fontSize: 14,
    fontWeight: "500",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.xl,
  },
  emptyStateTitle: {
    ...DesignSystem.typography.bodySemiBold,
    color: "white",
    textAlign: "center",
    marginBottom: DesignSystem.spacing.sm,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default DueSoonPopup;
