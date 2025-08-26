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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";

import { DesignSystem } from "../../theme/designSystem";
import { MaintenanceTask } from "../../types/maintenance";
import HeroCarousel from "./HeroCarousel";
import TimelineView from "./TimelineView";
import CompletionCelebration from "./CompletionCelebration";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { ProfileMenu } from "./ProfileMenu";
import SimpleTaskDetailModal from "./SimpleTaskDetailModal";
import { CreateTaskModal } from "./CreateTaskModal";
import StreakPopup from "./StreakPopup";
import DueSoonPopup from "./DueSoonPopup";
import { useNavigation } from "@react-navigation/native";
import { AppStackParamList } from "../../navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

const { width: screenWidth } = Dimensions.get("window");

interface NewDashboardProps {
  tasks: MaintenanceTask[];
  onCompleteTask: (instanceId: string) => void;
  onTaskPress?: (instanceId: string) => void;
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
  const { colors } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(
    null
  );
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [showDueSoonPopup, setShowDueSoonPopup] = useState(false);
  const [streak, setStreak] = useState(0);

  // Animation for floating action button when no tasks
  const fabScale = useSharedValue(1);
  const fabRotation = useSharedValue(0);

  // Filter tasks for different views
  const upcomingTasks = tasks.filter((task) => !task.is_completed);
  const completedTasks = tasks.filter((task) => task.is_completed);

  // Filter for "due soon" tasks (within next 7 days or overdue)
  const dueSoonTasks = tasks.filter((task) => {
    if (task.is_completed) return false;

    const dueDate = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Include overdue tasks and tasks due within 7 days
    return diffDays <= 7;
  });

  useEffect(() => {
    // Calculate consecutive day streak
    const calculateConsecutiveStreak = () => {
      if (completedTasks.length === 0) return 0;

      // Sort completed tasks by completion date (newest first)
      const sortedCompletions = completedTasks
        .filter((task) => task.completed_at)
        .sort(
          (a, b) =>
            new Date(b.completed_at!).getTime() -
            new Date(a.completed_at!).getTime()
        );

      if (sortedCompletions.length === 0) return 0;

      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Start of today

      // Check if we have a completion today
      const todayCompletion = sortedCompletions.find((task) => {
        const completionDate = new Date(task.completed_at!);
        completionDate.setHours(0, 0, 0, 0);
        return completionDate.getTime() === currentDate.getTime();
      });

      if (todayCompletion) {
        streak = 1;
        currentDate.setDate(currentDate.getDate() - 1); // Move to yesterday

        // Count consecutive days backwards
        for (let i = 1; i <= 365; i++) {
          // Max 1 year streak
          const checkDate = new Date(currentDate);
          checkDate.setDate(checkDate.getDate() - i);

          const hasCompletion = sortedCompletions.some((task) => {
            const completionDate = new Date(task.completed_at!);
            completionDate.setHours(0, 0, 0, 0);
            return completionDate.getTime() === checkDate.getTime();
          });

          if (hasCompletion) {
            streak++;
          } else {
            break; // Streak broken
          }
        }
      }

      return streak;
    };

    setStreak(calculateConsecutiveStreak());

    // Animate FAB when no tasks
    if (tasks.length === 0) {
      fabScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1,
        true
      );

      fabRotation.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 2000 }),
          withTiming(-10, { duration: 2000 })
        ),
        -1,
        true
      );
    } else {
      fabScale.value = 1;
      fabRotation.value = 0;
    }
  }, [tasks, completedTasks]);

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value },
      { rotate: `${fabRotation.value}deg` },
    ],
  }));

  const handleCompleteTask = async (instanceId: string) => {
    await onCompleteTask(instanceId);

    // Show celebration after completion is processed
    setTimeout(() => {
      setShowCelebration(true);
    }, 500);
  };

  const handleTaskPress = (instanceId: string) => {
    const task = tasks.find((t) => t.instance_id === instanceId);
    if (task) {
      setSelectedTask(task);
      setShowTaskDetail(true);
    }
  };

  const handleCloseCelebration = () => {
    setShowCelebration(false);
    // Refresh tasks after celebration closes to ensure UI is updated
    if (onRefresh) {
      onRefresh();
    }
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
      return "Ready to get organized? Add a task to get started! ✨";
    }
    if (upcomingTasks.length <= 3) {
      return "You're almost there! Just a few more tasks to go.";
    }
    return "You have tasks to complete! Let's get started with your first one.";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            {/* Profile Button - Top Right */}
            <View style={styles.profileButtonContainer}>
              <ProfileMenu onRefresh={onRefresh} />
            </View>

            <View style={styles.headerContent}>
              <View style={styles.greetingContainer}>
                <Text style={[styles.greeting, { color: colors.surface }]}>
                  {getGreeting()}, {getUserName()}!
                </Text>

                <Text
                  style={[
                    styles.motivationalMessage,
                    { color: colors.surface },
                  ]}
                >
                  {getMotivationalMessage()}
                </Text>
              </View>

              <View style={styles.statsContainer}>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => setShowDueSoonPopup(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.statNumber, { color: colors.surface }]}>
                    {dueSoonTasks.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.surface }]}>
                    Due Soon
                  </Text>
                </TouchableOpacity>
                <View style={styles.statDivider} />
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => {
                    navigation.navigate("CompletionHistory");
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.statNumber, { color: colors.surface }]}>
                    {completedTasks.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.surface }]}>
                    Completed
                  </Text>
                </TouchableOpacity>
                <View style={styles.statDivider} />
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => setShowStreakPopup(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.statNumber, { color: colors.surface }]}>
                    {streak}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.surface }]}>
                    Day Streak
                  </Text>
                </TouchableOpacity>
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
      <Animated.View style={fabAnimatedStyle}>
        <TouchableOpacity
          style={styles.floatingActionButton}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.accent, "#FFB347"]}
            style={styles.floatingActionButtonGradient}
          >
            <Ionicons name="add" size={28} color={colors.surface} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

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
        streak={streak}
      />

      {/* Streak Popup */}
      {showStreakPopup && (
        <StreakPopup
          streak={streak}
          onClose={() => setShowStreakPopup(false)}
        />
      )}

      {/* Due Soon Popup */}
      {showDueSoonPopup && (
        <DueSoonPopup
          tasks={dueSoonTasks}
          onClose={() => setShowDueSoonPopup(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  motivationalMessage: {
    ...DesignSystem.typography.body,
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
    fontWeight: "700",
  },
  statLabel: {
    ...DesignSystem.typography.caption,
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
