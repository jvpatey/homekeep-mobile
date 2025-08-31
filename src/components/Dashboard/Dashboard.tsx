import React, { useState, useEffect } from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { MaintenanceTask } from "../../types/maintenance";
import { HeroCarousel } from "./HeroCarousel";
import { TimelineView } from "./timeline-view/TimelineView";
import { useAuth } from "../../context/AuthContext";
import { SimpleTaskDetailModal, CreateTaskModal } from "./modals";
import { StreakPopup, DueSoonPopup, CompletionCelebration } from "./popups";
import { NotificationPermissionRequest } from "../ui";
import { DashboardHeader } from "./DashboardHeader";
import { FloatingActionButton } from "./FloatingActionButton";
import {
  getGreeting,
  getUserName,
  getMotivationalMessage,
  calculateConsecutiveStreak,
  getDueSoonTasks,
} from "./utils";
import { dashboardStyles } from "./styles";

interface NewDashboardProps {
  tasks: MaintenanceTask[];
  onCompleteTask: (instanceId: string) => void;
  onTaskPress?: (instanceId: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function NewDashboard({
  tasks,
  onCompleteTask,
  onTaskPress,
  onRefresh,
  refreshing = false,
}: NewDashboardProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(
    null
  );
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [showDueSoonPopup, setShowDueSoonPopup] = useState(false);
  const [streak, setStreak] = useState(0);

  // Filter tasks for different views
  const upcomingTasks = tasks.filter((task) => !task.is_completed);
  const completedTasks = tasks.filter((task) => task.is_completed);

  // Filter for "due soon" tasks (within next 7 days or overdue)
  const dueSoonTasks = getDueSoonTasks(tasks);

  useEffect(() => {
    // Calculate consecutive day streak
    setStreak(calculateConsecutiveStreak(completedTasks));
  }, [completedTasks]);

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
        {/* Header Section */}
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
        <View style={dashboardStyles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button - Add Task */}
      <FloatingActionButton
        onPress={() => setShowCreateModal(true)}
        hasTasks={tasks.length > 0}
      />

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

      {/* Notification Permission Request */}
      <NotificationPermissionRequest />
    </View>
  );
}
