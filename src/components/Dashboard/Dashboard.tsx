import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { CompletionCelebration } from "./popups";
import { NotificationPermissionRequest, HearthCanvas } from "../ui";
import { DashboardHeader } from "./DashboardHeader";
import { FloatingActionButton } from "./FloatingActionButton";
import { EquipmentManualsModal } from "../modals/equipment-manuals-modal";
import { TasksLoadErrorBanner } from "./TasksLoadErrorBanner";
import { HomeAddressOnboardingModal } from "../modals/home-address-onboarding";
import { useProfile } from "../../context/ProfileContext";
import { DesignSystem } from "../../theme/designSystem";
import { getGreeting, getUserName } from "./utils";
import {
  buildDashboardSections,
  countDueToday,
} from "./dashboardSections";
import {
  DashboardScheduleList,
  DashboardScheduleListRef,
} from "./DashboardScheduleList";
import { confirmSkipTaskOccurrence } from "../../utils/skipTaskOccurrence";
import { useHaptics, useReducedMotion } from "../../hooks";

interface NewDashboardProps {
  tasks: MaintenanceTask[];
  overdueTasks?: MaintenanceTask[];
  completedTasks?: MaintenanceTask[];
  onCompleteTask: (
    instanceId: string
  ) => Promise<{ success: boolean; error?: string }>;
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

const DASHBOARD_HEADER_ENTRANCE_KEY =
  "@homekeep/dashboard_header_entrance_seen";

export function NewDashboard({
  tasks,
  overdueTasks = [],
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
  const reducedMotion = useReducedMotion();
  const { addressNeeded } = useProfile();
  const insets = useSafeAreaInsets();
  const listRef = useRef<DashboardScheduleListRef>(null);

  const [showCelebration, setShowCelebration] = useState(false);
  const [completingInstanceIds, setCompletingInstanceIds] = useState<
    Set<string>
  >(new Set());
  const completingRef = useRef<Set<string>>(new Set());
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(
    null
  );
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTaskInitial, setEditTaskInitial] =
    useState<MaintenanceTask | null>(null);
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

        if (seen === "true" || reducedMotion) {
          headerOpacity.value = 1;
          headerTranslateY.value = 0;
          return;
        }

        const duration = DesignSystem.motion.duration.fast;
        const stagger = Math.round(DesignSystem.motion.stagger * 0.4);

        headerOpacity.value = withDelay(stagger, withTiming(1, { duration }));
        headerTranslateY.value = withDelay(
          stagger,
          withTiming(0, { duration })
        );

        setTimeout(() => {
          void AsyncStorage.setItem(DASHBOARD_HEADER_ENTRANCE_KEY, "true");
        }, stagger + duration + 80);
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
  }, [headerOpacity, headerTranslateY, reducedMotion]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  useEffect(() => {
    if (!addressNeeded) return;
    const timer = setTimeout(() => {
      setShowAddressModal(true);
    }, DesignSystem.motion.duration.base + 200);
    return () => clearTimeout(timer);
  }, [addressNeeded]);

  const sections = useMemo(
    () => buildDashboardSections(tasks, overdueTasks),
    [tasks, overdueTasks]
  );

  const hasScheduleTasks = sections.length > 0;

  const dueTodayCount = useMemo(
    () => countDueToday([...tasks, ...overdueTasks]),
    [tasks, overdueTasks]
  );

  const handleCompleteTask = useCallback(
    async (instanceId: string): Promise<boolean> => {
      if (completingRef.current.has(instanceId)) return false;

      completingRef.current.add(instanceId);
      setCompletingInstanceIds(new Set(completingRef.current));
      await triggerMedium();

      try {
        const result = await onCompleteTask(instanceId);
        if (result.success) {
          setShowCelebration(true);
          setShowTaskDetail(false);
          setSelectedTask(null);
          return true;
        }
        Alert.alert(
          "Could not complete",
          result.error || "Failed to complete the task. Please try again."
        );
        return false;
      } catch (error) {
        console.error("Error completing task:", error);
        Alert.alert(
          "Could not complete",
          "An unexpected error occurred. Please try again."
        );
        return false;
      } finally {
        completingRef.current.delete(instanceId);
        setCompletingInstanceIds(new Set(completingRef.current));
      }
    },
    [onCompleteTask, triggerMedium]
  );

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
    onTaskPress?.(instanceId);
  };

  const handleCloseCelebration = () => {
    setShowCelebration(false);
  };

  const handleTaskCreated = () => {
    setShowCreateModal(false);
    setEditTaskInitial(null);
    onRefresh?.();
  };

  const openCreateModal = () => {
    setEditTaskInitial(null);
    setShowCreateModal(true);
  };

  const handleScrollToSection = (key: string) => {
    listRef.current?.scrollToSection(key);
  };

  const contentPaddingBottom = hasScheduleTasks
    ? insets.bottom +
      DesignSystem.spacing.md +
      DesignSystem.components.buttonLarge +
      DesignSystem.spacing.md +
      DesignSystem.spacing.lg
    : insets.bottom + DesignSystem.spacing.xxxl;

  const listHeader = (
    <>
      <DashboardHeader
        userName={getUserName(user?.user_metadata?.full_name, user?.email)}
        greeting={getGreeting()}
        overdueCount={overdueTasks.length}
        dueTodayCount={dueTodayCount}
        onOpenEquipmentManuals={() => setShowEquipmentManualsModal(true)}
        onOpenAddressEditor={() => setShowAddressModal(true)}
        onScrollToSection={handleScrollToSection}
        animatedStyle={headerAnimatedStyle}
      />
      {tasksError && onRetryTasks ? (
        <TasksLoadErrorBanner message={tasksError} onRetry={onRetryTasks} />
      ) : null}
    </>
  );

  return (
    <HearthCanvas>
      <DashboardScheduleList
        ref={listRef}
        sections={sections}
        ListHeaderComponent={listHeader}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onCompleteTask={handleCompleteTask}
        completingInstanceIds={completingInstanceIds}
        onTaskPress={handleTaskPress}
        onSkipOccurrence={
          onSkipTaskOccurrence
            ? (task, closeSwipe) => {
                void handleSkipOccurrence(task, closeSwipe);
              }
            : undefined
        }
        onAddTask={openCreateModal}
        onBrowseMaintenancePlans={onBrowseMaintenancePlans}
        contentPaddingBottom={contentPaddingBottom}
      />

      {hasScheduleTasks ? (
        <FloatingActionButton onPress={openCreateModal} />
      ) : null}

      <SimpleTaskDetailModal
        task={selectedTask}
        visible={showTaskDetail}
        onClose={() => {
          setShowTaskDetail(false);
          setSelectedTask(null);
        }}
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

      <EquipmentManualsModal
        visible={showEquipmentManualsModal}
        onClose={() => setShowEquipmentManualsModal(false)}
      />

      <HomeAddressOnboardingModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
      />

      <NotificationPermissionRequest />
    </HearthCanvas>
  );
}
