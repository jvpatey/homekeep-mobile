import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Alert, View, Pressable, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../navigation/types";
import { MaintenanceTask } from "../../types/maintenance";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { SimpleTaskDetailModal, CreateTaskModal } from "./modals";
import { CompletionCelebration } from "./popups";
import { NotificationPermissionRequest, HearthCanvas } from "../ui";
import { DashboardHeader } from "./DashboardHeader";
import { NextRightThingCard } from "./NextRightThingCard";
import { HomeSystemMap } from "./HomeSystemMap";
import { FloatingActionButton } from "./FloatingActionButton";
import { EquipmentManualsModal } from "../modals/equipment-manuals-modal";
import { TasksLoadErrorBanner } from "./TasksLoadErrorBanner";
import { HomeSetupModal } from "../modals/home-setup";
import { HouseholdSharingModal } from "../modals/household-sharing/HouseholdSharingModal";
import { PlusStatusBanner } from "../plus";
import { useRequirePlus } from "../../hooks/useRequirePlus";
import { useSubscription } from "../../context/SubscriptionContext";
import { useProfile } from "../../context/ProfileContext";
import { isHomeSystemsComplete } from "../../data/maintenancePlans";
import { DesignSystem } from "../../theme/designSystem";
import { getGreeting } from "./utils";
import { accountFirstName } from "../../utils/displayName";
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
import {
  recommendInSeasonPlanId,
  homeSeasonLabel,
} from "../../utils/homeSeason";
import {
  pickNextRightThing,
  nextRightThingWhy,
} from "../../utils/nextRightThing";
import {
  HomeMapZoneId,
  getHomeMapZones,
  taskMatchesZone,
} from "../../data/homeMapZones";
import { isTaskInSeason } from "../../utils/seasonalTasks";
import { CompleteTaskSheet } from "../modals/complete-task/CompleteTaskSheet";
import { EmergencyFactsModal } from "../modals/emergency-facts/EmergencyFactsModal";
import { WeekendBudgetSheet } from "./WeekendBudgetSheet";
import { WeatherService, ClimateAlert, pickTemperatureUnit } from "../../services/WeatherService";

interface NewDashboardProps {
  tasks: MaintenanceTask[];
  overdueTasks?: MaintenanceTask[];
  completedTasks?: MaintenanceTask[];
  onCompleteTask: (
    instanceId: string,
    extras?: {
      notes?: string;
      cost_amount?: number | null;
      labor_type?: "diy" | "hired" | null;
      photo_storage_path?: string | null;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  onTaskPress?: (instanceId: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onBrowseMaintenancePlans?: (planId?: string) => void;
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
  const { pendingOpen, clearPendingOpen } = useNotifications();
  const { colors } = useTheme();
  const { triggerMedium, triggerLight } = useHaptics();
  const reducedMotion = useReducedMotion();
  const { addressNeeded, homeSetupNeeded, profile } = useProfile();
  const requirePlus = useRequirePlus();
  const { isPlus, offerPaywallAfterSetup } = useSubscription();
  const insets = useSafeAreaInsets();
  const listRef = useRef<DashboardScheduleListRef>(null);
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [showCelebration, setShowCelebration] = useState(false);
  const [completingInstanceIds, setCompletingInstanceIds] = useState<
    Set<string>
  >(new Set());
  const completingRef = useRef<Set<string>>(new Set());
  const [showHomeSetupModal, setShowHomeSetupModal] = useState(false);
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(
    null
  );
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTaskInitial, setEditTaskInitial] =
    useState<MaintenanceTask | null>(null);
  const [showEquipmentManualsModal, setShowEquipmentManualsModal] =
    useState(false);
  const [createEquipmentId, setCreateEquipmentId] = useState<string | null>(
    null
  );
  const [selectedZoneId, setSelectedZoneId] = useState<HomeMapZoneId | null>(
    null
  );
  const [showWeekendBudget, setShowWeekendBudget] = useState(false);
  const [showEmergencyFacts, setShowEmergencyFacts] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<MaintenanceTask | null>(
    null
  );
  const [climateAlert, setClimateAlert] = useState<ClimateAlert | null>(null);

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
    if (profile?.latitude == null || profile?.longitude == null) {
      setClimateAlert(null);
      return;
    }
    const unit = pickTemperatureUnit(profile.country);
    void WeatherService.getClimateAlert(
      profile.latitude,
      profile.longitude,
      unit
    ).then(setClimateAlert);
  }, [profile?.latitude, profile?.longitude, profile?.country]);

  useEffect(() => {
    if (!addressNeeded && !homeSetupNeeded) return;
    const timer = setTimeout(() => {
      setShowHomeSetupModal(true);
    }, DesignSystem.motion.duration.base + 200);
    return () => clearTimeout(timer);
  }, [addressNeeded, homeSetupNeeded]);

  const month = new Date().getMonth();
  const seasonalTasks = useMemo(
    () => tasks.filter((t) => isTaskInSeason(t, month, profile?.latitude)),
    [tasks, month, profile?.latitude]
  );
  const seasonalOverdue = useMemo(
    () =>
      overdueTasks.filter((t) =>
        isTaskInSeason(t, month, profile?.latitude)
      ),
    [overdueTasks, month, profile?.latitude]
  );

  const zoneFilteredUpcoming = useMemo(() => {
    if (!selectedZoneId) return seasonalTasks;
    const zone = getHomeMapZones(profile?.home_systems).find(
      (z) => z.id === selectedZoneId
    );
    if (!zone) return seasonalTasks;
    return seasonalTasks.filter((t) => taskMatchesZone(t, zone));
  }, [seasonalTasks, selectedZoneId, profile?.home_systems]);

  const zoneFilteredOverdue = useMemo(() => {
    if (!selectedZoneId) return seasonalOverdue;
    const zone = getHomeMapZones(profile?.home_systems).find(
      (z) => z.id === selectedZoneId
    );
    if (!zone) return seasonalOverdue;
    return seasonalOverdue.filter((t) => taskMatchesZone(t, zone));
  }, [seasonalOverdue, selectedZoneId, profile?.home_systems]);

  const sections = useMemo(
    () => buildDashboardSections(zoneFilteredUpcoming, zoneFilteredOverdue),
    [zoneFilteredUpcoming, zoneFilteredOverdue]
  );

  const nextTask = useMemo(
    () => pickNextRightThing(seasonalOverdue, seasonalTasks),
    [seasonalOverdue, seasonalTasks]
  );

  const inSeasonPlanId = recommendInSeasonPlanId(month, profile?.latitude);

  const seasonLabel = useMemo(
    () => homeSeasonLabel(month, profile?.latitude),
    [month, profile?.latitude]
  );

  const hasScheduleTasks = sections.length > 0;

  const dueTodayCount = useMemo(
    () => countDueToday([...tasks, ...overdueTasks]),
    [tasks, overdueTasks]
  );

  const handleCompleteTask = useCallback(
    async (
      instanceId: string,
      extras?: {
        notes?: string;
        cost_amount?: number | null;
        labor_type?: "diy" | "hired" | null;
        photo_storage_path?: string | null;
      }
    ): Promise<boolean> => {
      if (completingRef.current.has(instanceId)) return false;
      if (!(await requirePlus())) return false;

      completingRef.current.add(instanceId);
      setCompletingInstanceIds(new Set(completingRef.current));
      await triggerMedium();

      try {
        const result = await onCompleteTask(instanceId, extras);
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
    [onCompleteTask, requirePlus, triggerMedium]
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
      if (!(await requirePlus())) {
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
      requirePlus,
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

  useEffect(() => {
    if (!pendingOpen) return;

    if (pendingOpen.action === "household") {
      setShowHouseholdModal(true);
      clearPendingOpen();
      return;
    }

    if (pendingOpen.instanceId) {
      const task =
        tasks.find((t) => t.instance_id === pendingOpen.instanceId) ??
        overdueTasks.find((t) => t.instance_id === pendingOpen.instanceId);
      if (task) {
        setSelectedTask(task);
        setShowTaskDetail(true);
        clearPendingOpen();
        return;
      }
      if (tasks.length > 0 || overdueTasks.length > 0) {
        clearPendingOpen();
      }
      return;
    }

    clearPendingOpen();
  }, [clearPendingOpen, overdueTasks, pendingOpen, tasks]);

  const handleCloseCelebration = () => {
    setShowCelebration(false);
  };

  const handleTaskCreated = () => {
    setShowCreateModal(false);
    setEditTaskInitial(null);
    onRefresh?.();
  };

  const openCreateModal = async () => {
    if (!(await requirePlus())) return;
    setEditTaskInitial(null);
    setCreateEquipmentId(null);
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
        userName={accountFirstName({
          authFullName: user?.user_metadata?.full_name as string | undefined,
          profileFullName: profile?.full_name,
          email: user?.email ?? profile?.email ?? null,
        })}
        greeting={getGreeting()}
        overdueCount={seasonalOverdue.length}
        dueTodayCount={dueTodayCount}
        onOpenEquipmentManuals={() => setShowEquipmentManualsModal(true)}
        onOpenAddressEditor={() => setShowHomeSetupModal(true)}
        onOpenHomeSummary={() => navigation.navigate("HomeSummaryPreview")}
        onScrollToSection={handleScrollToSection}
        animatedStyle={headerAnimatedStyle}
        seasonLabel={seasonLabel}
      />
      <PlusStatusBanner />
      <HomeSystemMap
        overdueTasks={seasonalOverdue}
        upcomingTasks={seasonalTasks}
        selectedZoneId={selectedZoneId}
        onSelectZone={setSelectedZoneId}
        onSetupHome={() => setShowHomeSetupModal(true)}
        weatherOverlay={climateAlert?.kind ?? null}
        showPins={isHomeSystemsComplete(profile?.home_systems)}
        onPinPress={() => setShowEmergencyFacts(true)}
      />
      {nextTask ? (
        <NextRightThingCard
          task={nextTask}
          why={nextRightThingWhy(nextTask, {
            inSeasonPlanId,
            weatherWhy:
              climateAlert &&
              (nextTask.category === "EXTERIOR" ||
                nextTask.category === "PLUMBING")
                ? climateAlert.label
                : null,
          })}
          onPress={() => {
            setSelectedTask(nextTask);
            setShowTaskDetail(true);
          }}
        />
      ) : null}
      <Pressable
        onPress={() => setShowWeekendBudget(true)}
        style={{
          alignSelf: "center",
          marginBottom: DesignSystem.spacing.md,
        }}
        accessibilityRole="button"
        accessibilityLabel="Plan a weekend with a time budget"
      >
        <Text style={{ color: colors.primary, fontWeight: "600" }}>
          I have some time this weekend
        </Text>
      </Pressable>
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
        onSetupHome={() => setShowHomeSetupModal(true)}
        homeSetupIncomplete={!isHomeSystemsComplete(profile?.home_systems)}
        contentPaddingBottom={contentPaddingBottom}
      />

      {hasScheduleTasks ? (
        <FloatingActionButton onPress={openCreateModal} />
      ) : null}

      {showTaskDetail && selectedTask ? (
        <SimpleTaskDetailModal
          task={selectedTask}
          visible
          onClose={() => {
            setShowTaskDetail(false);
            setSelectedTask(null);
          }}
          onComplete={handleCompleteTask}
          onStartComplete={(task) => {
            setShowTaskDetail(false);
            setSelectedTask(null);
            setCompleteTarget(task);
          }}
          onEdit={(task) => {
            void (async () => {
              if (!(await requirePlus())) return;
              setShowTaskDetail(false);
              setEditTaskInitial(task);
              setShowCreateModal(true);
            })();
          }}
          onSkipOccurrence={
            onSkipTaskOccurrence
              ? (task) => handleSkipOccurrence(task)
              : undefined
          }
          onModified={onRefresh}
        />
      ) : null}

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => {
            setShowCreateModal(false);
            setEditTaskInitial(null);
            setCreateEquipmentId(null);
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
                  equipment_id: editTaskInitial.equipment_id,
                }
              : createEquipmentId
                ? { equipment_id: createEquipmentId }
                : undefined
          }
          isEdit={!!editTaskInitial}
        />
      )}

      <CompletionCelebration
        isVisible={showCelebration}
        onClose={handleCloseCelebration}
      />

      {showEquipmentManualsModal ? (
        <EquipmentManualsModal
          visible
          onClose={() => setShowEquipmentManualsModal(false)}
          onAddRecurringTask={(equipmentId) => {
            void (async () => {
              if (!(await requirePlus())) return;
              setShowEquipmentManualsModal(false);
              setCreateEquipmentId(equipmentId);
              setEditTaskInitial(null);
              setShowCreateModal(true);
            })();
          }}
        />
      ) : null}

      <HomeSetupModal
        visible={showHomeSetupModal}
        onClose={() => {
          setShowHomeSetupModal(false);
          if (profile?.home_setup_set_at && !isPlus) {
            offerPaywallAfterSetup();
          }
        }}
        onJoinHousehold={() => setShowHouseholdModal(true)}
      />

      <HouseholdSharingModal
        visible={showHouseholdModal}
        onClose={() => setShowHouseholdModal(false)}
      />

      {completeTarget ? (
        <CompleteTaskSheet
          visible
          task={completeTarget}
          onClose={() => setCompleteTarget(null)}
          onSubmit={handleCompleteTask}
        />
      ) : null}

      {showEmergencyFacts ? (
        <EmergencyFactsModal
          visible
          onClose={() => setShowEmergencyFacts(false)}
        />
      ) : null}

      {showWeekendBudget ? (
        <WeekendBudgetSheet
          visible
          tasks={[...seasonalOverdue, ...seasonalTasks]}
          onClose={() => setShowWeekendBudget(false)}
          onPickTask={(task) => {
            setSelectedTask(task);
            setShowTaskDetail(true);
          }}
        />
      ) : null}

      <NotificationPermissionRequest />
    </HearthCanvas>
  );
}
