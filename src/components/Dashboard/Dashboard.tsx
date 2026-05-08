import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  Animated as RNAnimated,
  Text,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useGradients, useDevice } from "../../hooks";
import { MaintenanceTask } from "../../types/maintenance";
import { HeroCarousel } from "./HeroCarousel";
import { TimelineView } from "./timeline-view/TimelineView";
import { useAuth } from "../../context/AuthContext";
import { SimpleTaskDetailModal, CreateTaskModal } from "./modals";
import { StreakPopup, DueSoonPopup, CompletionCelebration } from "./popups";
import { NotificationPermissionRequest } from "../ui";
import { DashboardHeader } from "./DashboardHeader";
import { FloatingActionButton } from "./FloatingActionButton";
import { MaintenanceService } from "../../services/maintenanceService";
import { DesignSystem } from "../../theme/designSystem";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  getGreeting,
  getUserName,
  getMotivationalMessage,
  calculateConsecutiveStreak,
  getDueSoonTasks,
  getUpcomingTasks,
  getPastDueTasks,
} from "./utils";
import { dashboardStyles } from "./styles";

interface NewDashboardProps {
  tasks: MaintenanceTask[];
  completedTasks?: MaintenanceTask[];
  onCompleteTask: (instanceId: string) => void;
  onTaskPress?: (instanceId: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function NewDashboard({
  tasks,
  completedTasks = [],
  onCompleteTask,
  onTaskPress,
  onRefresh,
  refreshing = false,
}: NewDashboardProps) {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { ctaHighlight } = useGradients();
  const { isTablet } = useDevice();
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(
    null
  );
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTaskInitial, setEditTaskInitial] =
    useState<MaintenanceTask | null>(null);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [showDueSoonPopup, setShowDueSoonPopup] = useState(false);
  const [streak, setStreak] = useState(0);
  const [timelineTasks, setTimelineTasks] = useState<MaintenanceTask[]>([]);
  const [showTimelineView, setShowTimelineView] = useState(false);
  const [timelineContentHeight, setTimelineContentHeight] = useState(0);
  const timelineHeight = React.useRef(new RNAnimated.Value(0)).current;

  // Animation values for page load
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(20);
  const carouselOpacity = useSharedValue(0);
  const carouselTranslateY = useSharedValue(20);
  const timelineOpacity = useSharedValue(0);
  const timelineTranslateY = useSharedValue(20);

  // Function to trigger animations
  const triggerAnimations = useCallback(() => {
    headerOpacity.value = 0;
    headerTranslateY.value = 20;
    carouselOpacity.value = 0;
    carouselTranslateY.value = 20;
    timelineOpacity.value = 0;
    timelineTranslateY.value = 20;

    const d = DesignSystem.motion.duration.base;
    const stagger = DesignSystem.motion.stagger;

    headerOpacity.value = withDelay(stagger, withTiming(1, { duration: d }));
    headerTranslateY.value = withDelay(
      stagger,
      withTiming(0, { duration: d })
    );
    carouselOpacity.value = withDelay(
      stagger + DesignSystem.motion.stagger,
      withTiming(1, { duration: d })
    );
    carouselTranslateY.value = withDelay(
      stagger + DesignSystem.motion.stagger,
      withTiming(0, { duration: d })
    );
    timelineOpacity.value = withDelay(
      stagger + DesignSystem.motion.stagger * 2,
      withTiming(1, { duration: d })
    );
    timelineTranslateY.value = withDelay(
      stagger + DesignSystem.motion.stagger * 2,
      withTiming(0, { duration: d })
    );
  }, []);

  // Trigger animations on mount only
  useEffect(() => {
    triggerAnimations();
  }, [triggerAnimations]);

  // Animation styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const carouselAnimatedStyle = useAnimatedStyle(() => ({
    opacity: carouselOpacity.value,
    transform: [{ translateY: carouselTranslateY.value }],
  }));

  const timelineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: timelineOpacity.value,
    transform: [{ translateY: timelineTranslateY.value }],
  }));

  // Animate timeline height based on visibility
  useEffect(() => {
    if (showTimelineView) {
      // Expand immediately when showing
      RNAnimated.timing(timelineHeight, {
        toValue: 1,
        duration: 0,
        useNativeDriver: false,
      }).start();
    } else {
      // Wait for exit animation to complete (300ms) then collapse
      const timer = setTimeout(() => {
        RNAnimated.timing(timelineHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showTimelineView, timelineHeight]);

  // Load all future tasks and reduce to next instance per routine for timeline
  const loadTimelineTasks = useCallback(async () => {
    try {
      const { data, error } = await MaintenanceService.getUpcomingTasks("all");
      if (error) throw error;
      const futureTasks = (data || []) as MaintenanceTask[];

      // Reduce to earliest due per routine id
      const earliestByRoutine = new Map<string, MaintenanceTask>();
      for (const task of futureTasks) {
        const existing = earliestByRoutine.get(task.id);
        if (!existing) {
          earliestByRoutine.set(task.id, task);
          continue;
        }
        const existingDue = new Date(existing.due_date).getTime();
        const taskDue = new Date(task.due_date).getTime();
        if (taskDue < existingDue) {
          earliestByRoutine.set(task.id, task);
        }
      }

      const reduced = Array.from(earliestByRoutine.values()).sort(
        (a, b) =>
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      );
      setTimelineTasks(reduced);
    } catch (err) {
      console.error("Error loading timeline tasks:", err);
      setTimelineTasks([]);
    }
  }, []);

  // Tasks are already filtered - no need to filter again
  const upcomingTasks = tasks; // These are already upcoming tasks from the service
  const pastDueTasks = tasks.filter((task) => task.is_overdue); // This should also be empty since upcoming tasks shouldn't be overdue


  // Filter for "due soon" tasks (within next 7 days, excluding past due)
  const dueSoonTasks = getDueSoonTasks(tasks);

  useEffect(() => {
    // Calculate consecutive day streak
    setStreak(calculateConsecutiveStreak(completedTasks));
  }, [completedTasks]);

  // Keep timeline in sync on mount and whenever dashboard task set changes
  useEffect(() => {
    loadTimelineTasks();
  }, [loadTimelineTasks, tasks]);

  const handleCompleteTask = async (instanceId: string) => {
    try {
      await onCompleteTask(instanceId);

      // Show celebration after successful completion
      setShowCelebration(true);
    } catch (error) {
      console.error("Error completing task:", error);
      // Handle error appropriately
    }
  };

  const handleTaskPress = (instanceId: string) => {
    // Look in current tasks first; if not found, in timelineTasks as a fallback
    let task = tasks.find((t) => t.instance_id === instanceId);
    if (!task) {
      task = timelineTasks.find((t) => t.instance_id === instanceId);
    }
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

  return (
    <View
      style={[
        dashboardStyles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <ScrollView
        style={dashboardStyles.scrollView}
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
        {/* Glance (Hero) */}
        <Animated.View style={headerAnimatedStyle}>
          <DashboardHeader
            userName={getUserName(user?.user_metadata?.full_name, user?.email)}
            greeting={getGreeting()}
            motivationalMessage={getMotivationalMessage(upcomingTasks)}
            dueSoonCount={dueSoonTasks.length}
            completedCount={completedTasks.length}
            streak={streak}
            onRefresh={onRefresh}
            onShowDueSoonPopup={() => setShowDueSoonPopup(true)}
            onShowStreakPopup={() => setShowStreakPopup(true)}
          />
        </Animated.View>

        {/* Primary action zone (Featured) */}
        <Animated.View style={carouselAnimatedStyle}>
          <HeroCarousel
            tasks={upcomingTasks.slice(0, 10)}
            onCompleteTask={handleCompleteTask}
            onTaskPress={handleTaskPress}
            onAddTask={() => {
              setEditTaskInitial(null);
              setShowCreateModal(true);
            }}
          />
        </Animated.View>

        {/* Secondary zone (Progressive disclosure) */}
        <Animated.View style={timelineAnimatedStyle}>
          <View
            style={{
              paddingHorizontal: DesignSystem.spacing.md,
              paddingTop: DesignSystem.spacing.xs,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View style={{ flex: 1, paddingRight: DesignSystem.spacing.md }}>
              <Text
                style={[
                  DesignSystem.typography.h3,
                  {
                    color: isDark
                      ? "rgba(255, 255, 255, 0.92)"
                      : "rgba(15, 23, 42, 0.92)",
                    letterSpacing: -0.2,
                  },
                ]}
              >
                Timeline
              </Text>
              <Text
                style={[
                  DesignSystem.typography.small,
                  {
                    color: isDark
                      ? "rgba(255, 255, 255, 0.65)"
                      : "rgba(15, 23, 42, 0.65)",
                    marginTop: DesignSystem.spacing.xs,
                  },
                ]}
              >
                Upcoming tasks
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowTimelineView((v) => !v)}
              activeOpacity={0.8}
              style={[
                {
                  borderRadius: DesignSystem.borders.radius.round,
                  overflow: "hidden",
                  borderWidth: DesignSystem.borders.hairline,
                  borderColor: colors.glassStroke,
                },
                DesignSystem.shadows.softAmbient,
              ]}
            >
              <View
                style={[
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: DesignSystem.spacing.xs,
                    paddingHorizontal: DesignSystem.spacing.sm,
                    paddingVertical: 8,
                    backgroundColor: showTimelineView
                      ? colors.primary
                      : colors.glass,
                  },
                ]}
              >
                {showTimelineView && (
                  <LinearGradient
                    colors={ctaHighlight}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "55%",
                    }}
                    pointerEvents="none"
                  />
                )}
                <Ionicons
                  name={showTimelineView ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={showTimelineView ? "white" : colors.textSecondary}
                />
                <Text
                  style={[
                    DesignSystem.typography.captionSemiBold,
                    {
                      color: showTimelineView ? "white" : colors.textSecondary,
                    },
                  ]}
                >
                  {showTimelineView ? "Hide" : "Show"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <RNAnimated.View
            style={{
              overflow: "hidden",
              height: timelineHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, timelineContentHeight || 2000],
              }),
            }}
            pointerEvents={showTimelineView ? "auto" : "none"}
          >
            <TimelineView
              tasks={timelineTasks}
              onCompleteTask={handleCompleteTask}
              onTaskPress={handleTaskPress}
              visible={showTimelineView}
              onContentSizeChange={(height) => setTimelineContentHeight(height)}
            />
          </RNAnimated.View>
        </Animated.View>

        <View style={dashboardStyles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button - Add Task */}
      <FloatingActionButton
        onPress={() => {
          setEditTaskInitial(null);
          setShowCreateModal(true);
        }}
        hasTasks={tasks.length > 0}
      />

      {/* Task Detail Modal */}
      <SimpleTaskDetailModal
        task={selectedTask}
        visible={showTaskDetail}
        onClose={() => setShowTaskDetail(false)}
        onComplete={handleCompleteTask}
        onEdit={(task) => {
          setShowTaskDetail(false);
          setEditTaskInitial(task);
          setShowCreateModal(true);
        }}
        onModified={onRefresh}
      />

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => {
            setShowCreateModal(false);
            setEditTaskInitial(null);
          }}
          onTaskCreated={handleTaskCreated}
          initialValues={
            editTaskInitial
              ? {
                  id: editTaskInitial.id,
                  title: editTaskInitial.title,
                  category: editTaskInitial.category,
                  interval_days: editTaskInitial.interval_days,
                  startDate: new Date(editTaskInitial.start_date),
                  priority: editTaskInitial.priority,
                  estimated_duration_minutes:
                    editTaskInitial.estimated_duration_minutes,
                  description: editTaskInitial.description,
                }
              : undefined
          }
          isEdit={!!editTaskInitial}
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

      {/* Notification Permission Request */}
      <NotificationPermissionRequest />
    </View>
  );
}
