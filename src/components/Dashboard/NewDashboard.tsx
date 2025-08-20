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
import { useAuth } from "../../context/AuthContext";
import ProfileButton from "./ProfileButton";

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
  const { user } = useAuth();
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
    let greeting = "";
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 17) greeting = "Good Afternoon";
    else greeting = "Good Evening";

    const userName =
      user?.user_metadata?.full_name?.split(" ")[0] ||
      user?.email?.split("@")[0] ||
      "there";
    return `${greeting}, ${userName}!`;
  };

  const getMotivationalMessage = () => {
    // No tasks at all
    if (totalCount === 0) {
      return "Welcome to HomeKeep! Let's add your first maintenance task.";
    }

    // No completed tasks yet
    if (completedCount === 0) {
      return "You have tasks to complete! Let's get started with your first one.";
    }

    // All tasks completed
    if (completedCount === totalCount && totalCount > 0) {
      return "Amazing! All your tasks are complete. Your home is well-maintained! 🎉";
    }

    // Almost done (80%+ completed)
    if (completedCount >= totalCount * 0.8) {
      return "You're almost there! Just a few more tasks to go! 💪";
    }

    // On a streak
    if (streak > 0) {
      if (streak === 1) {
        return "Great start! You completed a task today! 🌟";
      } else if (streak >= 7) {
        return `Incredible! You're on a ${streak}-day streak! 🔥`;
      } else {
        return `Great job! You're on a ${streak}-day streak! Keep it up! ✨`;
      }
    }

    // Good progress
    if (completedCount >= totalCount * 0.5) {
      return "You're making great progress! Keep up the momentum! 🚀";
    }

    // Just getting started
    if (completedCount < totalCount * 0.3) {
      return "Every completed task brings you closer to a well-maintained home! 🏠";
    }

    // Default encouraging message
    return "You're doing great! Keep checking off those tasks! 💪";
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
            {/* Profile Button - Top Right */}
            <View style={styles.profileButtonContainer}>
              <ProfileButton size={40} />
            </View>

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

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button - Add Task */}
      <TouchableOpacity
        style={styles.floatingActionButton}
        onPress={() => {
          // TODO: Navigate to add task screen or open add task modal
          console.log("Add task pressed");
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.light.accent, "#FFB347"]}
          style={styles.floatingActionButtonGradient}
        >
          <Ionicons name="add" size={28} color={colors.light.surface} />
        </LinearGradient>
      </TouchableOpacity>

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
    position: "relative",
  },
  profileButtonContainer: {
    position: "absolute",
    top: DesignSystem.spacing.md,
    right: DesignSystem.spacing.md,
    zIndex: 10,
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

  bottomSpacing: {
    height: DesignSystem.spacing.xxl,
  },
  floatingActionButton: {
    position: "absolute",
    bottom: DesignSystem.spacing.xl,
    right: DesignSystem.spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  floatingActionButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default NewDashboard;
