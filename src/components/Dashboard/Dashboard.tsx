import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Alert, View } from "react-native";
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
import { DueSoonPopup, OverduePopup, CompletionCelebration } from "./popups";
import { NotificationPermissionRequest } from "../ui";
import { DashboardHeader } from "./DashboardHeader";
import { FloatingActionButton } from "./FloatingActionButton";
import { EquipmentManualsModal } from "../modals/equipment-manuals-modal";
import { TasksLoadErrorBanner } from "./TasksLoadErrorBanner";
import { HomeAddressOnboardingModal } from "../modals/home-address-onboarding";
import { useProfile } from "../../context/ProfileContext";
import { DesignSystem } from "../../theme/designSystem";
import {
  getGreeting,
  getUserName,
  getDueSoonTasks,
  sortTasksByDateThenPriority,
} from "./utils";
import { dashboardStyles } from "./styles";
import { buildDashboardSections } from "./dashboardSections";
import { DashboardScheduleList } from "./DashboardScheduleList";
import { DashboardQuickActions } from "./DashboardQuickActions";
import { confirmSkipTaskOccurrence } from "../../utils/skipTaskOccurrence";
import { useHaptics } from "../../hooks";

interface NewDashboardProps {
  tasks: MaintenanceTask[];
  overdueTasks?: MaintenanceTask[];
  completedTasks?: MaintenanceTask[];
  onCompleteTask: (instanceId: string) => void;
  onTaskPress?: (instanceId: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onBrowseMaintenancePlans?: () => void;
  onSkipTaskOccurrence?: (
    task: MaintenanceTask
  ) => Promise<{ success: boolean; error?: string }>;
  tasksError?: string | null;
  onRetryTasks?: () => void;
}

/** Persisted so returning users skip the header entrance delay. */
const DASHBOARD_HEADER_ENTRANCE_KEY =
  "@homekeep/dashboard_header_entrance_seen";

export function NewDashboard({
  tasks,
  overdueTasks = [],
  completedTasks = [],
  onCompleteTask,
  onTaskPress,
  onRefresh,
  refreshing = false,
  onBrowseMaintenancePlans,
  onSkipTaskOccurrence,
  tasksError = null,
  onRetryTasks,
}: NewDashboardProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { triggerMedium, triggerLight } = useHaptics();
  const { addressNeeded } = useProfile();
  const insets = useSafeAreaInsets();
  const [showCelebration, setShowCelebration] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(
    null
  );
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTaskInitial, setEditTaskInitial] =
    useState<MaintenanceTask | null>(null);
  const [showOverduePopup, setShowOverduePopup] = useState(false);
  const [showDueSoonPopup, setShowDueSoonPopup] = useState(false);
  const [showEquipmentManualsModal, setShowEquipmentManualsModal] =
    useState(false);

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

  const dueSoonTasks = useMemo(
    () => sortTasksByDateThenPriority(getDueSoonTasks(tasks)),
    [tasks]
  );

  const overdueSorted = useMemo(
    () => sortTasksByDateThenPriority(overdueTasks),
    [overdueTasks]
  );

  // First-run address onboarding: surface the sheet once the entrance
  // animation settles. Profile.address_set_at flips the flag off after the
  // user saves or skips, so this runs at most once per account.
  useEffect(() => {
    if (!addressNeeded) return;
    const timer = setTimeout(() => {
      setShowAddressModal(true);
    }, DesignSystem.motion.duration.base + 200);
    return () => clearTimeout(timer);
  }, [addressNeeded]);

  const sections = useMemo(() => buildDashboardSections(tasks), [tasks]);

  const handleCompleteTask = async (instanceId: string) => {
    try {
      await onCompleteTask(instanceId);
      setShowCelebration(true);
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleSkipOccurrence = useCallback(
    async (
      task: MaintenanceTask,
      closeSwipe?: () => void
    ): Promise<boolean> => {
      if (!onSkipTaskOccurrence) {
        closeSwipe?.();
        return false;
      }

      const confirmed = await confirmSkipTaskOccurrence(task);
      if (!confirmed) {
        closeSwipe?.();
        return false;
      }

      await triggerMedium();
      const result = await onSkipTaskOccurrence(task);
      closeSwipe?.();

      if (result.success) {
        await triggerLight();
        if (
          selectedTask?.instance_id === task.instance_id &&
          showTaskDetail
        ) {
          setShowTaskDetail(false);
          setSelectedTask(null);
        }
        return true;
      }

      Alert.alert(
        "Skip Failed",
        result.error || "Failed to skip this occurrence. Please try again."
      );
      return false;
    },
    [
      onSkipTaskOccurrence,
      triggerMedium,
      triggerLight,
      selectedTask,
      showTaskDetail,
    ]
  );

  const handleTaskPress = (instanceId: string) => {
    const task =
      tasks.find((t) => t.instance_id === instanceId) ??
      overdueTasks.find((t) => t.instance_id === instanceId);
    if (task) {
      setSelectedTask(task);
      setShowTaskDetail(true);
    }
  };

  const handleOverduePopupTaskPress = (instanceId: string) => {
    setShowOverduePopup(false);
    const task =
      overdueTasks.find((t) => t.instance_id === instanceId) ??
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
        dueSoonCount={dueSoonTasks.length}
        completedCount={completedTasks.length}
        overdueCount={overdueTasks.length}
        onRefresh={onRefresh}
        onShowDueSoonPopup={() => setShowDueSoonPopup(true)}
        onShowOverduePopup={() => setShowOverduePopup(true)}
        onOpenEquipmentManuals={() => setShowEquipmentManualsModal(true)}
        onOpenAddressEditor={() => setShowAddressModal(true)}
      />
      {tasksError && onRetryTasks ? (
        <TasksLoadErrorBanner
          message={tasksError}
          onRetry={onRetryTasks}
        />
      ) : null}
      {sections.length > 0 ? (
        <DashboardQuickActions
          onAddTask={() => {
            setEditTaskInitial(null);
            setShowCreateModal(true);
          }}
          onBrowseMaintenancePlans={onBrowseMaintenancePlans}
        />
      ) : null}
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
        onSkipOccurrence={
          onSkipTaskOccurrence
            ? (task, closeSwipe) => {
                void handleSkipOccurrence(task, closeSwipe);
              }
            : undefined
        }
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
        onSkipOccurrence={
          onSkipTaskOccurrence
            ? (task) => handleSkipOccurrence(task)
            : undefined
        }
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
      />

      {showOverduePopup && (
        <OverduePopup
          tasks={overdueSorted}
          onClose={() => setShowOverduePopup(false)}
          onTaskPress={handleOverduePopupTaskPress}
        />
      )}

      {showDueSoonPopup && (
        <DueSoonPopup
          tasks={dueSoonTasks}
          onClose={() => setShowDueSoonPopup(false)}
        />
      )}

      <EquipmentManualsModal
        visible={showEquipmentManualsModal}
        onClose={() => setShowEquipmentManualsModal(false)}
      />

      <HomeAddressOnboardingModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
      />

      <NotificationPermissionRequest />
    </View>
  );
}
