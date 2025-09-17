import React, { useState, useEffect, useCallback } from "react";
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
  const { colors } = useTheme();
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

  // Debug logging for task visibility issues
  console.log(
    "📊 Dashboard - Received tasks (should be upcoming):",
    tasks.length
  );
  console.log("📊 Dashboard - Filtered upcoming tasks:", upcomingTasks.length);
  console.log(
    "📊 Dashboard - Completed tasks from props:",
    completedTasks.length
  );
  console.log(
    "📊 Dashboard - Past due tasks (should be 0):",
    pastDueTasks.length
  );

  if (tasks.length > 0) {
    console.log("📊 Dashboard - First task:", {
      title: tasks[0]?.title,
      due_date: tasks[0]?.due_date,
      is_completed: tasks[0]?.is_completed,
      is_overdue: tasks[0]?.is_overdue,
    });
  }

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
    console.log("✅ Dashboard - Task created, closing modal and refreshing");
    setShowCreateModal(false);
    // Refresh tasks if refresh function is provided
    if (onRefresh) {
      console.log("🔄 Dashboard - Calling onRefresh after task creation");
      onRefresh();
    } else {
      console.log("⚠️ Dashboard - No onRefresh function provided!");
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
          tasks={timelineTasks}
          onCompleteTask={handleCompleteTask}
          onTaskPress={handleTaskPress}
        />

        {/* Bottom Spacing */}
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
