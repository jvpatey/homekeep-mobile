import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { MaintenanceTask } from "../../types/maintenance";
import { useAuth } from "../../context/AuthContext";
import { SimpleTaskDetailModal, CreateTaskModal } from "./modals";
import { StreakPopup, DueSoonPopup, CompletionCelebration } from "./popups";
import { NotificationPermissionRequest } from "../ui";
import { DashboardHeader } from "./DashboardHeader";
import { FloatingActionButton } from "./FloatingActionButton";
import { MaintenanceService } from "../../services/maintenanceService";
import { DesignSystem } from "../../theme/designSystem";
import {
  getGreeting,
  getUserName,
  getMotivationalMessage,
  calculateConsecutiveStreak,
  getDueSoonTasks,
} from "./utils";
import { dashboardStyles } from "./styles";
import { buildDashboardSections } from "./dashboardSections";
import { DashboardScheduleList } from "./DashboardScheduleList";

interface NewDashboardProps {
  tasks: MaintenanceTask[];
  completedTasks?: MaintenanceTask[];
  onCompleteTask: (instanceId: string) => void;
  onTaskPress?: (instanceId: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onBrowseMaintenancePlans?: () => void;
}

/** Persisted so returning users skip the header entrance delay. */
const DASHBOARD_HEADER_ENTRANCE_KEY =
  "@homekeep/dashboard_header_entrance_seen";

export function NewDashboard({
  tasks,
  completedTasks = [],
  onCompleteTask,
  onTaskPress,
  onRefresh,
  refreshing = false,
  onBrowseMaintenancePlans,
}: NewDashboardProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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
  const [scheduleTasks, setScheduleTasks] = useState<MaintenanceTask[]>([]);

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(14);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const seen = await AsyncStorage.getItem(DASHBOARD_HEADER_ENTRANCE_KEY);
        if (cancelled) return;

        if (seen === "true") {
          headerOpacity.value = 1;
          headerTranslateY.value = 0;
          return;
        }

        const duration = DesignSystem.motion.duration.fast;
        const stagger = Math.round(DesignSystem.motion.stagger * 0.4);

        headerOpacity.value = 0;
        headerTranslateY.value = 14;
        headerOpacity.value = withDelay(stagger, withTiming(1, { duration }));
        headerTranslateY.value = withDelay(
          stagger,
          withTiming(0, { duration })
        );

        const persistAfterMs = stagger + duration + 80;
        setTimeout(() => {
          void AsyncStorage.setItem(DASHBOARD_HEADER_ENTRANCE_KEY, "true");
        }, persistAfterMs);
      } catch {
        if (!cancelled) {
          headerOpacity.value = 1;
          headerTranslateY.value = 0;
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [headerOpacity, headerTranslateY]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const loadScheduleTasks = useCallback(async () => {
    try {
      const { data, error } = await MaintenanceService.getUpcomingTasks("all");
      if (error) throw error;
      setScheduleTasks((data || []) as MaintenanceTask[]);
    } catch (err) {
      console.error("Error loading schedule tasks:", err);
      setScheduleTasks([]);
    }
  }, []);

  const upcomingTasks = tasks;

  const dueSoonTasks = useMemo(() => {
    const source =
      scheduleTasks.length > 0 ? scheduleTasks : upcomingTasks;
    return getDueSoonTasks(source);
  }, [scheduleTasks, upcomingTasks]);

  useEffect(() => {
    setStreak(calculateConsecutiveStreak(completedTasks));
  }, [completedTasks]);

  useEffect(() => {
    loadScheduleTasks();
  }, [loadScheduleTasks, tasks]);

  const sections = useMemo(
    () => buildDashboardSections(scheduleTasks),
    [scheduleTasks]
  );

  const handleCompleteTask = async (instanceId: string) => {
    try {
      await onCompleteTask(instanceId);
      setShowCelebration(true);
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleTaskPress = (instanceId: string) => {
    const task =
      scheduleTasks.find((t) => t.instance_id === instanceId) ??
      tasks.find((t) => t.instance_id === instanceId);
    if (task) {
      setSelectedTask(task);
      setShowTaskDetail(true);
    }
  };

  const handleCloseCelebration = () => {
    setShowCelebration(false);
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleTaskCreated = () => {
    setShowCreateModal(false);
    if (onRefresh) {
      onRefresh();
    }
  };

  const contentPaddingBottom =
    insets.bottom +
    DesignSystem.spacing.xxxl +
    DesignSystem.spacing.xl +
    56;

  const listHeader = (
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
  );

  return (
    <View
      style={[
        dashboardStyles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <DashboardScheduleList
        sections={sections}
        ListHeaderComponent={listHeader}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onCompleteTask={handleCompleteTask}
        onTaskPress={handleTaskPress}
        onAddTask={() => {
          setEditTaskInitial(null);
          setShowCreateModal(true);
        }}
        onBrowseMaintenancePlans={onBrowseMaintenancePlans}
        contentPaddingBottom={contentPaddingBottom}
      />

      <FloatingActionButton
        onPress={() => {
          setEditTaskInitial(null);
          setShowCreateModal(true);
        }}
        hasTasks={tasks.length > 0}
      />

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

      <CompletionCelebration
        isVisible={showCelebration}
        onClose={handleCloseCelebration}
        streak={streak}
      />

      {showStreakPopup && (
        <StreakPopup
          streak={streak}
          onClose={() => setShowStreakPopup(false)}
        />
      )}

      {showDueSoonPopup && (
        <DueSoonPopup
          tasks={dueSoonTasks}
          onClose={() => setShowDueSoonPopup(false)}
        />
      )}

      <NotificationPermissionRequest />
    </View>
  );
}
