import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  Animated as RNAnimated,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
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
  const { ambientGradient } = useGradients();
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

    headerOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    headerTranslateY.value = withDelay(200, withTiming(0, { duration: 600 }));
    carouselOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    carouselTranslateY.value = withDelay(400, withTiming(0, { duration: 600 }));
    timelineOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    timelineTranslateY.value = withDelay(600, withTiming(0, { duration: 600 }));
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
        <View>
        {/* Header Section */}
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

        {/* Hero Carousel */}
        <Animated.View style={carouselAnimatedStyle}>
          <HeroCarousel
            tasks={upcomingTasks.slice(0, 10)} // Show first 10 upcoming tasks
            onCompleteTask={handleCompleteTask}
            onTaskPress={handleTaskPress}
            showTimelineView={showTimelineView}
            onToggleTimelineView={() => setShowTimelineView(!showTimelineView)}
          />
        </Animated.View>

        {/* Timeline View */}
        <Animated.View style={timelineAnimatedStyle}>
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

        {/* Bottom Spacing */}
        <View style={dashboardStyles.bottomSpacing} />
        </View>
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
