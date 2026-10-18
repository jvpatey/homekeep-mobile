import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";
import { useTasks } from "./TasksContext";
import { useProfile } from "./ProfileContext";
import { useNotifications } from "./NotificationContext";
import { useQuickActions } from "./QuickActionsContext";
import { useSubscription } from "./SubscriptionContext";
import { useHaptics } from "../hooks";
import {
  isPlusRequiredError,
  useRequirePlusOrFreeAction,
} from "../hooks/useRequirePlus";
import { usePlusFeature } from "../lib/plusFeatures";
import { useAppNavigation } from "../navigation/useAppNavigation";
import { useWidgetSync } from "../hooks/useWidgetSync";
import { refreshEquipmentIndex } from "../hooks/useEquipmentIndex";
import { showActionMenu } from "../utils/actionMenu";
import {
  confirmClearOverdue,
  confirmSkipTaskOccurrence,
} from "../utils/skipTaskOccurrence";
import { confirmPauseTask } from "../utils/pauseTask";
import { maybeRequestReviewAfterTaskComplete } from "../utils/requestAppReview";
import { pickNextRightThing } from "../utils/nextRightThing";
import { isTaskInSeason, buildWeekendPlan } from "../utils/seasonalTasks";
import {
  loadWeekendPlan,
  saveWeekendPlan,
  clearWeekendPlan,
  createWeekendPlanFromTasks,
  resolveWeekendPlan,
  markWeekendPlanItemComplete,
  loadWeekendPlanHistory,
  archiveWeekendPlan,
  ResolvedWeekendPlan,
  StoredWeekendPlan,
  WeekendPlanHistoryEntry,
} from "../utils/weekendPlanStorage";
import { countDueToday } from "../components/Dashboard/dashboardSections";
import {
  CompletionExtras,
  MaintenanceRoutine,
  MaintenanceTask,
} from "../types/maintenance";
import { MaintenanceService } from "../services/maintenanceService";
import { MaintenanceStatsService } from "../services/MaintenanceStatsService";
import { getHomeMapZones, HomeMapZone } from "../data/homeMapZones";
import {
  LastCompletionMap,
  UpkeepResult,
  computeUpkeep,
} from "../utils/upkeep";
import {
  UpkeepTrendEntry,
  loadUpkeepTrend,
  recordWeeklyUpkeep,
  upkeepTrendDelta,
} from "../utils/upkeepTrend";
import {
  SimpleTaskDetailModal,
  CreateTaskModal,
} from "../components/Dashboard/modals";
import {
  CompletionCelebration,
  CompletionCelebrationSnapshot,
} from "../components/Dashboard/popups";
import { WeekendBudgetSheet } from "../components/Dashboard/WeekendBudgetSheet";
import {
  WeekendPlanCelebration,
  WeekendPlanCelebrationSnapshot,
} from "../components/Dashboard/WeekendPlanCelebration";
import { CompleteTaskSheet } from "../components/modals/complete-task/CompleteTaskSheet";
import { AssistantSheet } from "../components/assistant/AssistantSheet";

interface TaskActionsValue {
  /** In-season open tasks, after the overdue split. */
  seasonalTasks: MaintenanceTask[];
  seasonalOverdue: MaintenanceTask[];
  nextTask: MaintenanceTask | null;
  dueTodayCount: number;
  activeRoutines: MaintenanceRoutine[];
  zones: HomeMapZone[];
  upkeep: UpkeepResult;
  /** Score change over ~4 weeks; null until enough history. */
  upkeepTrend: number | null;
  completingInstanceIds: Set<string>;
  refreshing: boolean;
  refresh: () => Promise<void>;

  openTask: (task: MaintenanceTask) => void;
  openTaskById: (instanceId: string) => void;
  completeTask: (
    instanceId: string,
    extras?: CompletionExtras
  ) => Promise<boolean>;
  /** One-tap done; opens the complete sheet when a cost is worth recording. */
  markDone: (task: MaintenanceTask) => void;
  skipOccurrence: (task: MaintenanceTask, closeSwipe?: () => void) => void;
  /** Skip/dismiss every task in the overdue pile without marking them done. */
  clearOverdue: (tasks: MaintenanceTask[]) => Promise<boolean>;
  clearingOverdue: boolean;
  pauseTask: (task: MaintenanceTask, closeSwipe?: () => void) => void;
  openCreate: () => Promise<void>;
  openEdit: (task: MaintenanceTask) => Promise<void>;
  openAddMenu: () => void;

  activeWeekendPlan: ResolvedWeekendPlan | null;
  openWeekendPlanner: () => void;
  endWeekendPlan: () => void;
}

const TaskActionsContext = createContext<TaskActionsValue | null>(null);

/**
 * Everything a task row can do — open, complete, skip, pause, edit — plus the
 * sheets those actions present. Mounted around the tabs so Today and Tasks share it.
 */
export function TaskActionsProvider({ children }: { children: React.ReactNode }) {
  const {
    upcomingTasks: tasks,
    overdueTasks,
    completedTasks,
    completeTask: completeTaskInstance,
    skipTaskOccurrence,
    clearOverdueTasks,
    pauseTask: pauseRoutine,
    refreshTasks,
    loading: tasksLoading,
    error: tasksError,
  } = useTasks();
  const { profile } = useProfile();
  const { pendingOpen, clearPendingOpen } = useNotifications();
  const { openLogRepair, openScheduleRepair } = useQuickActions();
  const { triggerMedium, triggerLight } = useHaptics();
  const {
    requireAccess: requirePlusOrFree,
    consume: consumeFreeAction,
    sync: syncFreeActions,
  } = useRequirePlusOrFreeAction();
  const { presentPaywall } = useSubscription();
  const assistant = usePlusFeature("assistant");
  const { goToTab, openTasks, openRecord } = useAppNavigation();

  const sawTasksLoad = useRef(false);
  if (tasksLoading) sawTasksLoad.current = true;

  const [refreshing, setRefreshing] = useState(false);
  const [celebration, setCelebration] = useState<{
    visible: boolean;
    snapshot: CompletionCelebrationSnapshot | null;
  }>({ visible: false, snapshot: null });
  const [weekendCelebration, setWeekendCelebration] = useState<{
    visible: boolean;
    snapshot: WeekendPlanCelebrationSnapshot | null;
  }>({ visible: false, snapshot: null });
  const [completingInstanceIds, setCompletingInstanceIds] = useState<
    Set<string>
  >(new Set());
  const completingRef = useRef<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(
    null
  );
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTaskInitial, setEditTaskInitial] =
    useState<MaintenanceTask | null>(null);
  const [storedWeekendPlan, setStoredWeekendPlan] =
    useState<StoredWeekendPlan | null>(null);
  const [weekendHistory, setWeekendHistory] = useState<
    WeekendPlanHistoryEntry[]
  >([]);
  const [showWeekendBudget, setShowWeekendBudget] = useState(false);
  const [sheetBudget, setSheetBudget] = useState(90);
  const [completeTarget, setCompleteTarget] = useState<MaintenanceTask | null>(
    null
  );
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState<string | undefined>();
  const [activeRoutines, setActiveRoutines] = useState<MaintenanceRoutine[]>(
    []
  );
  const [lastCompletion, setLastCompletion] = useState<LastCompletionMap>({});
  const [trendHistory, setTrendHistory] = useState<UpkeepTrendEntry[]>([]);

  const pendingEditRef = useRef<MaintenanceTask | null>(null);
  const pendingCompleteRef = useRef<MaintenanceTask | null>(null);
  const pendingAskKeeperRef = useRef<MaintenanceTask | null>(null);
  const resumeWeekendAfterDetailRef = useRef(false);
  /** Resume weekend sheet only after celebrations finish (Modals stack above overlays). */
  const pendingWeekendResumeRef = useRef(false);

  const month = new Date().getMonth();
  const seasonalTasks = useMemo(
    () => tasks.filter((t) => isTaskInSeason(t, month, profile?.latitude)),
    [tasks, month, profile?.latitude]
  );
  const seasonalOverdue = useMemo(
    () =>
      overdueTasks.filter((t) => isTaskInSeason(t, month, profile?.latitude)),
    [overdueTasks, month, profile?.latitude]
  );
  const weekendPool = useMemo(
    () => [...seasonalOverdue, ...seasonalTasks],
    [seasonalOverdue, seasonalTasks]
  );
  const nextTask = useMemo(
    () => pickNextRightThing(seasonalOverdue, seasonalTasks),
    [seasonalOverdue, seasonalTasks]
  );
  const dueTodayCount = useMemo(
    () => countDueToday([...tasks, ...overdueTasks]),
    [tasks, overdueTasks]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [{ data }, completions] = await Promise.all([
        MaintenanceService.getMaintenanceRoutines({ is_active: true }),
        MaintenanceStatsService.getLastCompletionByRoutine(),
      ]);
      if (cancelled) return;
      setActiveRoutines(data ?? []);
      if (completions.data) setLastCompletion(completions.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [tasks, overdueTasks, completedTasks]);

  const zones = useMemo(
    () => getHomeMapZones(profile?.home_systems).filter((z) => !z.hidden),
    [profile?.home_systems]
  );

  const upkeep = useMemo(
    () =>
      computeUpkeep({
        routines: activeRoutines,
        openTasks: [...overdueTasks, ...tasks],
        lastCompletion,
        zones,
        inSeason: (routine) =>
          isTaskInSeason(routine, month, profile?.latitude),
      }),
    [
      activeRoutines,
      overdueTasks,
      tasks,
      lastCompletion,
      zones,
      month,
      profile?.latitude,
    ]
  );

  const scoredValue = upkeep.state === "scored" ? upkeep.score : null;
  useEffect(() => {
    void loadUpkeepTrend().then(setTrendHistory);
  }, []);
  useEffect(() => {
    if (scoredValue === null || activeRoutines.length === 0) return;
    void recordWeeklyUpkeep(scoredValue).then(setTrendHistory);
  }, [scoredValue, activeRoutines.length]);
  const upkeepTrend = useMemo(
    () =>
      scoredValue === null ? null : upkeepTrendDelta(trendHistory, scoredValue),
    [trendHistory, scoredValue]
  );

  useWidgetSync({
    overdue: seasonalOverdue,
    upcoming: seasonalTasks,
    upkeep: activeRoutines.length > 0 ? upkeep : null,
    ready:
      !tasksLoading &&
      !tasksError &&
      (sawTasksLoad.current || tasks.length > 0 || overdueTasks.length > 0),
  });

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshTasks(), refreshEquipmentIndex()]);
    setRefreshing(false);
  }, [refreshTasks]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadWeekendPlan(), loadWeekendPlanHistory()]).then(
      ([stored, history]) => {
        if (cancelled) return;
        if (stored) {
          setStoredWeekendPlan(stored);
          setSheetBudget(stored.budgetMinutes);
        }
        setWeekendHistory(history);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const activeWeekendPlan = useMemo(
    () => (storedWeekendPlan ? resolveWeekendPlan(storedWeekendPlan) : null),
    [storedWeekendPlan]
  );

  useEffect(() => {
    if (!storedWeekendPlan || !activeWeekendPlan) return;
    if (Date.now() <= activeWeekendPlan.windowEnd.getTime()) return;
    setStoredWeekendPlan(null);
    void clearWeekendPlan();
  }, [activeWeekendPlan, storedWeekendPlan]);

  const openWeekendPlanner = useCallback(() => {
    setSheetBudget(storedWeekendPlan?.budgetMinutes ?? 90);
    setShowWeekendBudget(true);
  }, [storedWeekendPlan]);

  const startWeekendPlan = useCallback(() => {
    const preview = buildWeekendPlan(weekendPool, sheetBudget);
    const created = createWeekendPlanFromTasks(preview.tasks, sheetBudget);
    if (!created) return;
    setStoredWeekendPlan(created);
    void saveWeekendPlan(created);
    setShowWeekendBudget(false);
  }, [sheetBudget, weekendPool]);

  const endWeekendPlan = useCallback(() => {
    Alert.alert(
      "End weekend plan?",
      "This clears your checklist. Completed jobs stay in your history only if you finish the whole list.",
      [
        { text: "Keep plan", style: "cancel" },
        {
          text: "End plan",
          style: "destructive",
          onPress: () => {
            setStoredWeekendPlan(null);
            setShowWeekendBudget(false);
            void clearWeekendPlan();
          },
        },
      ]
    );
  }, []);

  const flushWeekendResume = useCallback(() => {
    if (!pendingWeekendResumeRef.current) return;
    pendingWeekendResumeRef.current = false;
    setTimeout(() => setShowWeekendBudget(true), 50);
  }, []);

  const resumeWeekendIfPending = () => {
    if (!resumeWeekendAfterDetailRef.current) return;
    resumeWeekendAfterDetailRef.current = false;
    setTimeout(() => setShowWeekendBudget(true), 50);
  };

  const completeTask = useCallback(
    async (instanceId: string, extras?: CompletionExtras): Promise<boolean> => {
      if (completingRef.current.has(instanceId)) return false;
      if (!(await requirePlusOrFree())) return false;

      const completedTask =
        tasks.find((t) => t.instance_id === instanceId) ??
        overdueTasks.find((t) => t.instance_id === instanceId);

      const remainingOverdue = overdueTasks.filter(
        (t) => t.instance_id !== instanceId
      );
      const remainingUpcoming = tasks.filter(
        (t) => t.instance_id !== instanceId
      );
      const nextAfter = pickNextRightThing(
        seasonalOverdue.filter((t) => t.instance_id !== instanceId),
        seasonalTasks.filter((t) => t.instance_id !== instanceId)
      );

      const snapshot: CompletionCelebrationSnapshot | null = completedTask
        ? {
            title: completedTask.title,
            category: completedTask.category,
            estimated_duration_minutes:
              completedTask.estimated_duration_minutes,
            wasOverdue:
              completedTask.is_overdue ||
              overdueTasks.some((t) => t.instance_id === instanceId),
            remainingOverdue: remainingOverdue.length,
            remainingToday: countDueToday([
              ...remainingUpcoming,
              ...remainingOverdue,
            ]),
            nextTitle: nextAfter?.title,
          }
        : null;

      completingRef.current.add(instanceId);
      setCompletingInstanceIds(new Set(completingRef.current));
      await triggerMedium();

      try {
        const result = await completeTaskInstance(instanceId, extras);
        if (result.success) {
          await syncFreeActions();
          setShowTaskDetail(false);
          setSelectedTask(null);

          const updatedPlan = await markWeekendPlanItemComplete(instanceId);
          if (updatedPlan) {
            const resolved = resolveWeekendPlan(updatedPlan);
            if (resolved.isComplete) {
              const entry = await archiveWeekendPlan(updatedPlan);
              const history = await loadWeekendPlanHistory();
              setStoredWeekendPlan(null);
              setWeekendHistory(history);
              resumeWeekendAfterDetailRef.current = false;
              pendingWeekendResumeRef.current = false;
              setShowWeekendBudget(false);
              setWeekendCelebration({
                visible: true,
                snapshot: {
                  taskCount: entry.taskCount,
                  totalMinutes: entry.totalMinutes,
                  titles: entry.titles,
                  history,
                },
              });
              return true;
            }
            setStoredWeekendPlan(updatedPlan);
          }

          if (resumeWeekendAfterDetailRef.current) {
            resumeWeekendAfterDetailRef.current = false;
            pendingWeekendResumeRef.current = true;
          }
          setCelebration({ visible: true, snapshot });
          return true;
        }
        if (isPlusRequiredError(result.error)) {
          await presentPaywall({ force: true, reason: "free_exhausted" });
          return false;
        }
        Alert.alert(
          "Could not complete",
          result.error || "Failed to complete the task. Please try again."
        );
        return false;
      } catch (error) {
        console.error("Error completing task:", error);
        if (isPlusRequiredError(error)) {
          await presentPaywall({ force: true, reason: "free_exhausted" });
          return false;
        }
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
    [
      completeTaskInstance,
      overdueTasks,
      presentPaywall,
      requirePlusOrFree,
      seasonalOverdue,
      seasonalTasks,
      syncFreeActions,
      tasks,
      triggerMedium,
    ]
  );

  const markDone = useCallback(
    (task: MaintenanceTask) => {
      if (task.estimated_cost_diy || task.estimated_cost_pro) {
        setCompleteTarget(task);
        return;
      }
      void completeTask(task.instance_id);
    },
    [completeTask]
  );

  const closeDetailIfShowing = useCallback(
    (task: MaintenanceTask) => {
      if (selectedTask?.instance_id === task.instance_id && showTaskDetail) {
        setShowTaskDetail(false);
        setSelectedTask(null);
      }
    },
    [selectedTask, showTaskDetail]
  );

  const runSkip = useCallback(
    async (task: MaintenanceTask, closeSwipe?: () => void) => {
      if (!(await requirePlusOrFree())) {
        closeSwipe?.();
        return false;
      }
      if (!(await confirmSkipTaskOccurrence(task))) {
        closeSwipe?.();
        return false;
      }
      await triggerMedium();
      const result = await skipTaskOccurrence(task);
      closeSwipe?.();
      if (result.success) {
        await consumeFreeAction();
        await triggerLight();
        closeDetailIfShowing(task);
        return true;
      }
      Alert.alert(
        "Skip Failed",
        result.error || "Failed to skip this occurrence. Please try again."
      );
      return false;
    },
    [
      closeDetailIfShowing,
      consumeFreeAction,
      requirePlusOrFree,
      skipTaskOccurrence,
      triggerLight,
      triggerMedium,
    ]
  );

  const [clearingOverdue, setClearingOverdue] = useState(false);

  const clearOverdue = useCallback(
    async (tasks: MaintenanceTask[]) => {
      if (tasks.length === 0 || clearingOverdue) return false;
      if (!(await requirePlusOrFree())) return false;
      if (!(await confirmClearOverdue(tasks))) return false;
      setClearingOverdue(true);
      try {
        await triggerMedium();
        const result = await clearOverdueTasks(tasks);
        if (result.cleared > 0) {
          await consumeFreeAction();
          await triggerLight();
        }
        if (!result.success) {
          Alert.alert(
            "Couldn't clear everything",
            result.error || "Please try again."
          );
          return false;
        }
        return true;
      } finally {
        setClearingOverdue(false);
      }
    },
    [
      clearOverdueTasks,
      clearingOverdue,
      consumeFreeAction,
      requirePlusOrFree,
      triggerLight,
      triggerMedium,
    ]
  );

  const pauseTask = useCallback(
    (task: MaintenanceTask, closeSwipe?: () => void) => {
      void (async () => {
        if (!(await requirePlusOrFree())) {
          closeSwipe?.();
          return;
        }
        if (!(await confirmPauseTask(task))) {
          closeSwipe?.();
          return;
        }
        await triggerMedium();
        const result = await pauseRoutine(task.id);
        closeSwipe?.();
        if (result.success) {
          await consumeFreeAction();
          await triggerLight();
          closeDetailIfShowing(task);
          return;
        }
        Alert.alert(
          "Pause Failed",
          result.error || "Failed to pause this reminder. Please try again."
        );
      })();
    },
    [
      closeDetailIfShowing,
      consumeFreeAction,
      pauseRoutine,
      requirePlusOrFree,
      triggerLight,
      triggerMedium,
    ]
  );

  const openTask = useCallback((task: MaintenanceTask) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  }, []);

  const openTaskById = useCallback(
    (instanceId: string) => {
      const task =
        tasks.find((t) => t.instance_id === instanceId) ??
        overdueTasks.find((t) => t.instance_id === instanceId);
      if (task) openTask(task);
    },
    [openTask, overdueTasks, tasks]
  );

  const openCreate = useCallback(async () => {
    if (!(await requirePlusOrFree())) return;
    setEditTaskInitial(null);
    setShowCreateModal(true);
  }, [requirePlusOrFree]);

  const openEdit = useCallback(
    async (task: MaintenanceTask) => {
      if (!(await requirePlusOrFree())) return;
      setEditTaskInitial(task);
      setShowCreateModal(true);
    },
    [requirePlusOrFree]
  );

  const openAddMenu = useCallback(() => {
    showActionMenu({
      options: [
        {
          label: "Add a reminder",
          icon: "add-circle-outline",
          onPress: () => void openCreate(),
        },
        {
          label: "Schedule a repair",
          icon: "construct-outline",
          subtitle: "Needs fixing",
          onPress: () => void openScheduleRepair(),
        },
        {
          label: "Log a repair",
          icon: "hammer-outline",
          subtitle: "Already done",
          onPress: () => void openLogRepair(),
        },
        {
          label: "Browse task library",
          icon: "library-outline",
          onPress: () => openTasks({ segment: "library" }),
        },
      ],
    });
  }, [openCreate, openLogRepair, openScheduleRepair, openTasks]);

  // Task and recall notifications are handled here so they work from any tab;
  // household invites are left for Today, which owns that sheet.
  useEffect(() => {
    if (!pendingOpen) return;

    if (pendingOpen.action === "recall" && pendingOpen.equipmentId) {
      openRecord("EquipmentDetail", { equipmentId: pendingOpen.equipmentId });
      clearPendingOpen();
      return;
    }

    if (pendingOpen.action === "household") {
      goToTab("HomeTab");
      return;
    }

    if (pendingOpen.instanceId) {
      const task =
        tasks.find((t) => t.instance_id === pendingOpen.instanceId) ??
        overdueTasks.find((t) => t.instance_id === pendingOpen.instanceId);
      if (task) {
        openTask(task);
        clearPendingOpen();
        return;
      }
      if (tasks.length > 0 || overdueTasks.length > 0) clearPendingOpen();
      return;
    }

    goToTab("HomeTab");
    clearPendingOpen();
  }, [
    clearPendingOpen,
    goToTab,
    openRecord,
    openTask,
    overdueTasks,
    pendingOpen,
    tasks,
  ]);

  const value = useMemo<TaskActionsValue>(
    () => ({
      seasonalTasks,
      seasonalOverdue,
      nextTask,
      dueTodayCount,
      activeRoutines,
      zones,
      upkeep,
      upkeepTrend,
      completingInstanceIds,
      refreshing,
      refresh,
      openTask,
      openTaskById,
      completeTask,
      markDone,
      skipOccurrence: (task, closeSwipe) => void runSkip(task, closeSwipe),
      clearOverdue,
      clearingOverdue,
      pauseTask,
      openCreate,
      openEdit,
      openAddMenu,
      activeWeekendPlan,
      openWeekendPlanner,
      endWeekendPlan,
    }),
    [
      seasonalTasks,
      seasonalOverdue,
      nextTask,
      dueTodayCount,
      activeRoutines,
      zones,
      upkeep,
      upkeepTrend,
      completingInstanceIds,
      refreshing,
      refresh,
      openTask,
      openTaskById,
      completeTask,
      markDone,
      runSkip,
      clearOverdue,
      clearingOverdue,
      pauseTask,
      openCreate,
      openEdit,
      openAddMenu,
      activeWeekendPlan,
      openWeekendPlanner,
      endWeekendPlan,
    ]
  );

  return (
    <TaskActionsContext.Provider value={value}>
      {children}

      {selectedTask ? (
        <SimpleTaskDetailModal
          task={selectedTask}
          visible={showTaskDetail}
          onClose={() => setShowTaskDetail(false)}
          onDismissed={() => {
            setSelectedTask(null);
            const toEdit = pendingEditRef.current;
            const toComplete = pendingCompleteRef.current;
            const toAsk = pendingAskKeeperRef.current;
            pendingEditRef.current = null;
            pendingCompleteRef.current = null;
            pendingAskKeeperRef.current = null;
            if (toEdit) {
              setTimeout(() => void openEdit(toEdit), 50);
              return;
            }
            if (toComplete) {
              setTimeout(() => setCompleteTarget(toComplete), 50);
              return;
            }
            if (toAsk) {
              setTimeout(() => {
                void assistant.unlock().then((ok) => {
                  if (!ok) return;
                  setAssistantPrompt(
                    `How do I do "${toAsk.title}"? Walk me through it step by step for my home.`
                  );
                  setShowAssistant(true);
                });
              }, 50);
              return;
            }
            resumeWeekendIfPending();
          }}
          onComplete={completeTask}
          onStartComplete={(task) => {
            pendingCompleteRef.current = task;
            setShowTaskDetail(false);
          }}
          onEdit={(task) => {
            pendingEditRef.current = task;
            setShowTaskDetail(false);
          }}
          onAskKeeper={(task) => {
            pendingAskKeeperRef.current = task;
            setShowTaskDetail(false);
          }}
          onSkipOccurrence={(task) => runSkip(task)}
          onModified={() => void refreshTasks()}
        />
      ) : null}

      {showCreateModal ? (
        <CreateTaskModal
          onClose={() => {
            setShowCreateModal(false);
            setEditTaskInitial(null);
            resumeWeekendIfPending();
          }}
          onTaskCreated={() => {
            setShowCreateModal(false);
            setEditTaskInitial(null);
            void refreshTasks();
          }}
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
              : undefined
          }
          isEdit={!!editTaskInitial}
        />
      ) : null}

      <CompletionCelebration
        isVisible={celebration.visible}
        snapshot={celebration.snapshot}
        onClose={() => {
          setCelebration({ visible: false, snapshot: null });
          flushWeekendResume();
          void maybeRequestReviewAfterTaskComplete();
        }}
      />

      <WeekendPlanCelebration
        isVisible={weekendCelebration.visible}
        snapshot={weekendCelebration.snapshot}
        onClose={() => {
          setWeekendCelebration({ visible: false, snapshot: null });
          pendingWeekendResumeRef.current = false;
        }}
      />

      {completeTarget ? (
        <CompleteTaskSheet
          visible
          task={completeTarget}
          onClose={() => {
            setCompleteTarget(null);
            // Cancelled without completing — reopen plan now.
            // Successful completes queue resume until celebration closes.
            resumeWeekendIfPending();
          }}
          onSubmit={completeTask}
        />
      ) : null}

      <AssistantSheet
        visible={showAssistant}
        onClose={() => {
          setShowAssistant(false);
          setAssistantPrompt(undefined);
        }}
        initialPrompt={assistantPrompt}
      />

      {showWeekendBudget ? (
        <WeekendBudgetSheet
          visible
          tasks={weekendPool}
          budgetMinutes={sheetBudget}
          onBudgetChange={setSheetBudget}
          activePlan={activeWeekendPlan}
          history={weekendHistory}
          onClose={() => setShowWeekendBudget(false)}
          onStartPlan={startWeekendPlan}
          onEndPlan={endWeekendPlan}
          onPickTask={(instanceId) => {
            const task =
              weekendPool.find((t) => t.instance_id === instanceId) ??
              tasks.find((t) => t.instance_id === instanceId) ??
              overdueTasks.find((t) => t.instance_id === instanceId);
            if (!task) {
              Alert.alert(
                "Job unavailable",
                "This job is no longer on your schedule."
              );
              return;
            }
            resumeWeekendAfterDetailRef.current = true;
            setShowWeekendBudget(false);
            openTask(task);
          }}
        />
      ) : null}
    </TaskActionsContext.Provider>
  );
}

export function useTaskActions(): TaskActionsValue {
  const value = useContext(TaskActionsContext);
  if (!value) {
    throw new Error("useTaskActions must be used inside TaskActionsProvider");
  }
  return value;
}
