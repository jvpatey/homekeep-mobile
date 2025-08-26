import React, { useEffect } from "react";
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

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return "Overdue";
    if (diffDays <= 7)
      return date.toLocaleDateString("en-US", { weekday: "short" });

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const renderTaskItem = ({ item }: { item: MaintenanceTask }) => (
    <View style={styles.taskItem}>
      <Text style={styles.taskTitle} numberOfLines={2}>
        {item.title}
      </Text>

      <View style={styles.taskDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="white" />
          <Text style={styles.detailText}>
            Due {formatDueDate(item.due_date)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="construct-outline" size={16} color="white" />
          <Text style={styles.detailText}>{item.category}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="checkmark-circle"
        size={48}
        color={colors.light.surface}
      />
      <Text style={styles.emptyStateTitle}>All Caught Up!</Text>
    </View>
  );

  return (
    <TouchableOpacity
      style={styles.overlay}
      onPress={handleClose}
      activeOpacity={1}
    >
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
              <View style={styles.headerIcon}>
                <Ionicons name="time" size={48} color="white" />
              </View>
              <Text style={styles.headerTitle}>Due Soon</Text>
              <Text style={styles.headerSubtitle}>
                {tasks.length} task{tasks.length !== 1 ? "s" : ""} need
                {tasks.length !== 1 ? "" : "s"} attention
              </Text>
            </View>

            {/* Tasks List */}
            {tasks.length > 0 ? (
              <FlatList
                data={tasks}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item.instance_id}
                contentContainerStyle={styles.tasksList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
              />
            ) : (
              renderEmptyState()
            )}
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
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
  container: {
    width: "90%",
    maxWidth: 400,
    borderRadius: DesignSystem.borders.radius.xlarge,
    overflow: "hidden",
    ...DesignSystem.shadows.large,
  },
  gradientBackground: {
    padding: DesignSystem.spacing.lg,
    minHeight: 300,
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
    marginBottom: DesignSystem.spacing.lg,
  },
  headerIcon: {
    marginBottom: DesignSystem.spacing.md,
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
  tasksList: {
    width: "100%",
    gap: DesignSystem.spacing.sm,
  },
  taskItem: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: DesignSystem.borders.radius.medium,
    padding: DesignSystem.spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  taskTitle: {
    ...DesignSystem.typography.bodySemiBold,
    color: "white",
    fontSize: 16,
    marginBottom: DesignSystem.spacing.md,
  },
  taskDetails: {
    gap: DesignSystem.spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  detailText: {
    ...DesignSystem.typography.caption,
    color: "white",
    opacity: 0.9,
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
