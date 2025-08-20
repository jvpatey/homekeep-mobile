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
import SimpleTaskDetailModal from "./SimpleTaskDetailModal";
import { CreateTaskModal } from "./CreateTaskModal";

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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const handleTaskPress = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setShowTaskDetail(true);
    }
  };

  const handleCloseCelebration = () => {
    setShowCelebration(false);
  };

  const handleTaskCreated = () => {
    setShowCreateModal(false);
    // Refresh tasks if refresh function is provided
    if (onRefresh) {
      onRefresh();
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getUserName = () => {
    // Get user's first name from full name, or use email, or fallback to "User"
    const fullName = user?.user_metadata?.full_name;
    if (fullName) {
      const firstName = fullName.split(" ")[0];
      return firstName;
    }
    // If no full name, use email prefix
    if (user?.email) {
      const emailPrefix = user.email.split("@")[0];
      return emailPrefix;
    }
    return "User";
  };

  const getMotivationalMessage = () => {
    if (upcomingTasks.length === 0) {
      return "All caught up! Great job!";
    }
    return "You have tasks to complete! Let's get started with your first one.";
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
                <Text style={styles.greeting}>
                  {getGreeting()}, {getUserName()}!
                </Text>
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
          onTaskPress={handleTaskPress}
        />

        {/* Timeline View */}
        <TimelineView
          tasks={upcomingTasks}
          onCompleteTask={handleCompleteTask}
          onTaskPress={handleTaskPress}
        />

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button - Add Task */}
      <TouchableOpacity
        style={styles.floatingActionButton}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.light.accent, "#FFB347"]}
          style={styles.floatingActionButtonGradient}
        >
          <Ionicons name="add" size={28} color={colors.light.surface} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Task Detail Modal */}
      <SimpleTaskDetailModal
        task={selectedTask}
        visible={showTaskDetail}
        onClose={() => setShowTaskDetail(false)}
        onComplete={handleCompleteTask}
      />

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}

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
    paddingTop: 52, // Reduced to 52px - just enough for profile button (40px) + 12px margin
    paddingBottom: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.md,
    position: "relative",
  },
  profileButtonContainer: {
    position: "absolute",
    top: DesignSystem.spacing.md, // 16px from top
    right: DesignSystem.spacing.md, // 16px from right
    zIndex: 10,
  },
  headerContent: {
    alignItems: "center",
    paddingTop: DesignSystem.spacing.md, // Reduced to 16px - just enough clearance
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
