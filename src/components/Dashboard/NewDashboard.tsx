import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";
import { DesignSystem } from "../../theme/designSystem";
import { Task } from "../../types/task";
import HeroCarousel from "./HeroCarousel";
import TimelineView from "./TimelineView";
import CompletionCelebration from "./CompletionCelebration";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");

interface NewDashboardProps {
  tasks: Task[];
  onCompleteTask: (taskId: string) => void;
  onTaskPress?: (taskId: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const NewDashboard: React.FC<NewDashboardProps> = ({
  tasks,
  onCompleteTask,
  onTaskPress,
  onRefresh,
  refreshing = false,
}) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [streak, setStreak] = useState(0);

  // Filter tasks for different views
  const upcomingTasks = tasks.filter((task) => !task.is_completed);
  const completedTasks = tasks.filter((task) => task.is_completed);

  useEffect(() => {
    setTotalCount(tasks.length);
    setCompletedCount(completedTasks.length);

    // Calculate streak (simplified - you can enhance this logic)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const recentCompletions = completedTasks.filter((task) => {
      const completedDate = new Date(task.completed_at || "");
      return completedDate >= yesterday;
    });

    setStreak(recentCompletions.length);
  }, [tasks, completedTasks]);

  const handleCompleteTask = (taskId: string) => {
    onCompleteTask(taskId);

    // Show celebration after a short delay
    setTimeout(() => {
      setShowCelebration(true);
    }, 300);
  };

  const handleCloseCelebration = () => {
    setShowCelebration(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getMotivationalMessage = () => {
    if (completedCount === 0) return "Let's get started with your first task!";
    if (completedCount >= totalCount * 0.8)
      return "You're almost there! Keep going!";
    if (streak > 0) return `Great job! You're on a ${streak}-day streak!`;
    return "Every completed task brings you closer to a well-maintained home!";
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.light.primary]}
            tintColor={colors.light.primary}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={[colors.light.primary, colors.light.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.motivationalMessage}>
                  {getMotivationalMessage()}
                </Text>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{upcomingTasks.length}</Text>
                  <Text style={styles.statLabel}>Due Soon</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{completedCount}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{streak}</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Hero Carousel */}
        <HeroCarousel
          tasks={upcomingTasks.slice(0, 10)} // Show first 10 upcoming tasks
          onCompleteTask={handleCompleteTask}
          onTaskPress={onTaskPress}
        />

        {/* Timeline View */}
        <TimelineView
          tasks={upcomingTasks}
          onCompleteTask={handleCompleteTask}
          onTaskPress={onTaskPress}
        />

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionButton}>
              <LinearGradient
                colors={[colors.light.accent, "#FFB347"]}
                style={styles.quickActionGradient}
              >
                <Ionicons
                  name="add-circle"
                  size={24}
                  color={colors.light.surface}
                />
                <Text style={styles.quickActionText}>Add Task</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionButton}>
              <LinearGradient
                colors={[colors.light.success, "#4CAF50"]}
                style={styles.quickActionGradient}
              >
                <Ionicons
                  name="calendar"
                  size={24}
                  color={colors.light.surface}
                />
                <Text style={styles.quickActionText}>Calendar</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionButton}>
              <LinearGradient
                colors={[colors.light.secondary, "#2196F3"]}
                style={styles.quickActionGradient}
              >
                <Ionicons
                  name="analytics"
                  size={24}
                  color={colors.light.surface}
                />
                <Text style={styles.quickActionText}>Progress</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionButton}>
              <LinearGradient
                colors={[colors.light.error, "#F44336"]}
                style={styles.quickActionGradient}
              >
                <Ionicons
                  name="settings"
                  size={24}
                  color={colors.light.surface}
                />
                <Text style={styles.quickActionText}>Settings</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Completion Celebration */}
      <CompletionCelebration
        isVisible={showCelebration}
        onClose={handleCloseCelebration}
        completedCount={completedCount}
        totalCount={totalCount}
        streak={streak}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    marginBottom: DesignSystem.spacing.lg,
  },
  headerGradient: {
    paddingTop: DesignSystem.spacing.xl,
    paddingBottom: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.md,
  },
  headerContent: {
    alignItems: "center",
  },
  greetingContainer: {
    alignItems: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  greeting: {
    ...DesignSystem.typography.h1,
    color: colors.light.surface,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  motivationalMessage: {
    ...DesignSystem.typography.body,
    color: colors.light.surface,
    textAlign: "center",
    marginTop: DesignSystem.spacing.sm,
    opacity: 0.9,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    ...DesignSystem.typography.h2,
    color: colors.light.surface,
    fontWeight: "700",
  },
  statLabel: {
    ...DesignSystem.typography.caption,
    color: colors.light.surface,
    opacity: 0.8,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  quickActionsSection: {
    paddingHorizontal: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.xl,
  },
  sectionTitle: {
    ...DesignSystem.typography.h3,
    color: colors.light.text,
    marginBottom: DesignSystem.spacing.md,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.md,
  },
  quickActionButton: {
    width: (screenWidth - DesignSystem.spacing.md * 3) / 2,
    borderRadius: DesignSystem.borders.radius.medium,
    overflow: "hidden",
    ...DesignSystem.shadows.medium,
  },
  quickActionGradient: {
    padding: DesignSystem.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
  quickActionText: {
    ...DesignSystem.typography.bodyMedium,
    color: colors.light.surface,
    marginTop: DesignSystem.spacing.xs,
    textAlign: "center",
  },
  bottomSpacing: {
    height: DesignSystem.spacing.xxl,
  },
});

export default NewDashboard;
