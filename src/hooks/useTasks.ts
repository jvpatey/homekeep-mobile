import React, { useState, useEffect, useCallback, useRef } from "react";
import { AppState } from "react-native";
import { MaintenanceService } from "../services/maintenanceService";
import { ensureAuthSession } from "../utils/ensureAuthSession";
import {
  MaintenanceTask,
  CreateMaintenanceRoutineData,
  UpdateMaintenanceRoutineData,
  MaintenanceFilters,
} from "../types/maintenance";
import {
  buildRoutinePayloads,
  buildRoutinePayloadsFromItems,
  filterNewRoutinePayloads,
  getMaintenancePlanById,
  MaintenancePlanItemTemplate,
  ScheduledHomeItem,
  scheduledItemsToPayloads,
} from "../data/maintenancePlans";
import { useAuth } from "../context/AuthContext";
import { TimeRange } from "../context/TasksContext";

// UseTasksReturn - interface for the return value of the useTasks hook
interface UseTasksReturn {
  tasks: MaintenanceTask[];
  upcomingTasks: MaintenanceTask[];
  overdueTasks: MaintenanceTask[];
  completedTasks: MaintenanceTask[];
  loading: boolean;
  error: string | null;
  timeRange: TimeRange;
  lookbackDays: number | "all";
  stats: {
    total: number;
    completed: number;
    overdue: number;
    dueToday: number;
    thisWeek: number;
    completionRate: number;
    activeRoutines: number;
    totalInstances: number;
  };
  createTask: (
    taskData: CreateMaintenanceRoutineData
  ) => Promise<{ success: boolean; error?: string }>;
  applyMaintenancePlan: (
    planId: string,
    itemsOverride?: MaintenancePlanItemTemplate[]
  ) => Promise<{
    success: boolean;
    error?: string;
    addedCount?: number;
    skippedCount?: number;
  }>;
  applyGeneratedHomeSchedule: (
    items: ScheduledHomeItem[]
  ) => Promise<{
    success: boolean;
    error?: string;
    addedCount?: number;
    skippedCount?: number;
  }>;
  updateTask: (
    taskId: string,
    updates: UpdateMaintenanceRoutineData
  ) => Promise<{ success: boolean; error?: string }>;
  completeTask: (
    instanceId: string,
    extras?: {
      notes?: string;
      cost_amount?: number | null;
      labor_type?: "diy" | "hired" | null;
      photo_storage_path?: string | null;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  uncompleteTask: (
    instanceId: string
  ) => Promise<{ success: boolean; error?: string }>;
  skipTaskOccurrence: (
    task: MaintenanceTask
  ) => Promise<{ success: boolean; error?: string }>;
  deleteTask: (taskId: string) => Promise<{ success: boolean; error?: string }>;
  bulkCompleteTasks: (
    instanceIds: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  deleteAllTasks: () => Promise<{ success: boolean; error?: string }>;
  setTimeRange: (range: TimeRange) => void;
  setLookbackDays: (days: number | "all") => void;
  refreshTasks: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

// useTasks - custom hook for managing maintenance tasks
export function useTasks(filters?: MaintenanceFilters): UseTasksReturn {
  const { user, sessionReady } = useAuth();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<MaintenanceTask[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<MaintenanceTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    overdue: 0,
    dueToday: 0,
    thisWeek: 0,
    completionRate: 0,
    activeRoutines: 0,
    totalInstances: 0,
  });
  const [lookbackDays, setLookbackDays] = useState<number | "all">("all");
  const loadGeneration = useRef(0);
  const lastForegroundLoadRef = useRef(0);

  const defaultStats = {
    total: 0,
    completed: 0,
    overdue: 0,
    dueToday: 0,
    thisWeek: 0,
    completionRate: 0,
    activeRoutines: 0,
    totalInstances: 0,
  };

  // loadTasks - load maintenance tasks from the database
  const loadTasks = useCallback(
    async (options?: { isRetry?: boolean }) => {
      if (!user || !sessionReady) return;

      const gen = ++loadGeneration.current;

      setLoading(true);
      setError(null);

      try {
        const sessionValid = await ensureAuthSession();
        if (gen !== loadGeneration.current) return;
        if (!sessionValid) {
          setError("Session expired. Please sign in again.");
          return;
        }

        const overdueStatusResult =
          await MaintenanceService.updateOverdueStatus();
        if (overdueStatusResult.error) {
          console.warn(
            "useTasks: updateOverdueStatus failed, continuing load:",
            overdueStatusResult.error.message
          );
        }

        const [
          tasksResult,
          upcomingResult,
          overdueResult,
          completedResult,
          statsResult,
        ] = await Promise.all([
          MaintenanceService.getMaintenanceTasks(filters),
          MaintenanceService.getUpcomingTasks(timeRange),
          MaintenanceService.getOverdueTasks(lookbackDays),
          MaintenanceService.getCompletedTasks(lookbackDays),
          MaintenanceService.getMaintenanceStats(),
        ]);

        if (gen !== loadGeneration.current) return;

        if (tasksResult.error) throw tasksResult.error;
        if (upcomingResult.error) throw upcomingResult.error;
        if (completedResult.error) throw completedResult.error;
        if (overdueResult.error) throw overdueResult.error;
        if (statsResult.error) throw statsResult.error;

        const allOverdueTasks = overdueResult.data || [];
        const correctedOverdueTasks = allOverdueTasks.filter((task) => {
          const dueDate = new Date(task.due_date);
          dueDate.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diffDays = Math.floor(
            (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          return diffDays < 0;
        });

        const upcoming = upcomingResult.data ?? [];
        const statsData = statsResult.data ?? defaultStats;
        const visibleCount = upcoming.length + correctedOverdueTasks.length;
        const looksLikeStaleEmpty =
          visibleCount === 0 && statsData.activeRoutines > 0;

        if (looksLikeStaleEmpty && !options?.isRetry) {
          await new Promise((r) => setTimeout(r, 500));
          if (gen !== loadGeneration.current) return;
          return loadTasks({ isRetry: true });
        }

        if (looksLikeStaleEmpty && options?.isRetry) {
          setError("Couldn't load tasks. Pull down to refresh or try again.");
          return;
        }

        setTasks(tasksResult.data || []);
        setUpcomingTasks(upcoming);
        setOverdueTasks(correctedOverdueTasks);
        setCompletedTasks([...(completedResult.data || [])]);
        setStats(statsData);
      } catch (err) {
        if (gen !== loadGeneration.current) return;
        const loadError = err as Error;
        setError(loadError.message || "Failed to load maintenance tasks");
        console.error("❌ useTasks: Error loading maintenance tasks:", loadError);
      } finally {
        if (gen === loadGeneration.current) {
          setLoading(false);
        }
      }
    },
    [user, sessionReady, filters, timeRange, lookbackDays]
  );

  // createTask - create a new maintenance routine
  const createTask = useCallback(
    async (taskData: CreateMaintenanceRoutineData) => {
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      try {
        const { data, error } =
          await MaintenanceService.createMaintenanceRoutine(taskData);

        if (error) throw error;

        // Refresh tasks after creation
        await loadTasks();

        return { success: true };
      } catch (err) {
        const error = err as Error;
        const errorMessage =
          error.message || "Failed to create maintenance routine";
        console.error("Error creating maintenance routine:", error);
        return { success: false, error: errorMessage };
      }
    },
    [user, loadTasks]
  );

  const applyMaintenancePlan = useCallback(
    async (
      planId: string,
      itemsOverride?: MaintenancePlanItemTemplate[]
    ) => {
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      const plan = getMaintenancePlanById(planId);
      if (!plan) {
        return { success: false, error: "Maintenance plan not found" };
      }

      if (plan.requiresQuestionnaire) {
        if (!itemsOverride?.length) {
          return {
            success: false,
            error:
              "Complete the questionnaire and select at least one task to add.",
          };
        }
      }

      const payloads = (
        itemsOverride !== undefined
          ? buildRoutinePayloadsFromItems(itemsOverride)
          : buildRoutinePayloads(plan)
      ).map((row) => ({
        ...row,
        source_plan_id: planId,
      }));

      if (payloads.length === 0) {
        return { success: true, addedCount: 0, skippedCount: 0 };
      }

      try {
        const existingResult = await MaintenanceService.getMaintenanceRoutines({
          is_active: true,
        });
        if (existingResult.error) throw existingResult.error;

        const { newPayloads, skippedCount } = filterNewRoutinePayloads(
          payloads,
          existingResult.data ?? []
        );

        if (newPayloads.length === 0) {
          return {
            success: true,
            addedCount: 0,
            skippedCount,
          };
        }

        const { error } =
          await MaintenanceService.createMaintenanceRoutines(newPayloads);

        if (error) throw error;

        await loadTasks();

        return {
          success: true,
          addedCount: newPayloads.length,
          skippedCount,
        };
      } catch (err) {
        const error = err as Error;
        const errorMessage =
          error.message || "Failed to apply maintenance plan";
        console.error("Error applying maintenance plan:", error);
        return { success: false, error: errorMessage };
      }
    },
    [user, loadTasks]
  );

  const applyGeneratedHomeSchedule = useCallback(
    async (items: ScheduledHomeItem[]) => {
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }
      if (!items.length) {
        return { success: true, addedCount: 0, skippedCount: 0 };
      }

      const payloads = scheduledItemsToPayloads(items);
      try {
        const existingResult = await MaintenanceService.getMaintenanceRoutines({
          is_active: true,
        });
        if (existingResult.error) throw existingResult.error;

        const { newPayloads, skippedCount } = filterNewRoutinePayloads(
          payloads,
          existingResult.data ?? []
        );

        if (newPayloads.length === 0) {
          return { success: true, addedCount: 0, skippedCount };
        }

        const { error } =
          await MaintenanceService.createMaintenanceRoutines(newPayloads);
        if (error) throw error;
        await loadTasks();
        return {
          success: true,
          addedCount: newPayloads.length,
          skippedCount,
        };
      } catch (err) {
        const error = err as Error;
        return {
          success: false,
          error: error.message || "Failed to apply home schedule",
        };
      }
    },
    [user, loadTasks]
  );

  // updateTask - update a maintenance routine
  const updateTask = useCallback(
    async (taskId: string, updates: UpdateMaintenanceRoutineData) => {
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      try {
        const { data, error } =
          await MaintenanceService.updateMaintenanceRoutine(taskId, updates);

        if (error) throw error;

        // If start_date changed, reschedule the next open instance to keep UI in sync
        if (updates.start_date) {
          try {
            const next = await MaintenanceService.getNextOpenInstanceForRoutine(
              taskId
            );
            if (next.data) {
              // Align due date with new start_date (local noon)
              const newStart = new Date(updates.start_date);
              newStart.setHours(12, 0, 0, 0);
              await MaintenanceService.updateInstance(next.data.id, {
                due_date: newStart.toISOString(),
              });
            }
          } catch (e) {
            console.error(
              "Error rescheduling next instance after start_date update:",
              e
            );
          }
        }

        // Refresh full task lists to reflect due date/interval changes
        await loadTasks();

        return { success: true };
      } catch (err) {
        const error = err as Error;
        const errorMessage =
          error.message || "Failed to update maintenance routine";
        console.error("Error updating maintenance routine:", error);
        return { success: false, error: errorMessage };
      }
    },
    [user, loadTasks]
  );

  // completeTask - mark a routine instance as completed
  const completeTask = useCallback(
    async (
      instanceId: string,
      extras?: {
        notes?: string;
        cost_amount?: number | null;
        labor_type?: "diy" | "hired" | null;
        photo_storage_path?: string | null;
      }
    ) => {
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      try {
        const result = await MaintenanceService.completeInstance(
          instanceId,
          extras
        );

        if (result.error) throw result.error;

        void loadTasks();

        return { success: true };
      } catch (err) {
        const error = err as Error;
        const errorMessage =
          error.message || "Failed to complete maintenance task";
        console.error("Error completing maintenance task:", error);
        return { success: false, error: errorMessage };
      }
    },
    [user, loadTasks]
  );

  // uncompleteTask - mark a routine instance as incomplete
  const uncompleteTask = useCallback(
    async (instanceId: string) => {
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      try {
        const result = await MaintenanceService.uncompleteInstance(instanceId);

        if (result.error) throw result.error;

        void loadTasks();

        return { success: true };
      } catch (err) {
        const error = err as Error;
        const errorMessage =
          error.message || "Failed to uncomplete maintenance task";
        console.error("Error uncompleting maintenance task:", error);
        return { success: false, error: errorMessage };
      }
    },
    [user, loadTasks]
  );

  const skipTaskOccurrence = useCallback(
    async (task: MaintenanceTask) => {
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      if (task.is_completed) {
        return { success: false, error: "Cannot skip a completed task" };
      }

      if (task.interval_days <= 0) {
        return {
          success: false,
          error: "This task does not repeat on a schedule",
        };
      }

      try {
        const result = await MaintenanceService.skipRoutineInstance({
          instanceId: task.instance_id,
          routineId: task.id,
          dueDate: task.due_date,
          intervalDays: task.interval_days,
        });

        if (result.error) throw result.error;

        await loadTasks();

        return { success: true };
      } catch (err) {
        const error = err as Error;
        const errorMessage =
          error.message || "Failed to skip maintenance task occurrence";
        console.error("Error skipping maintenance task occurrence:", error);
        return { success: false, error: errorMessage };
      }
    },
    [user, loadTasks]
  );

  // deleteTask - delete a maintenance routine
  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      try {
        const result = await MaintenanceService.deleteMaintenanceRoutine(
          taskId
        );

        if (result.error) throw result.error;

        await loadTasks();

        return { success: true };
      } catch (err) {
        const error = err as Error;
        const errorMessage =
          error.message || "Failed to delete maintenance routine";
        console.error("Error deleting maintenance routine:", error);
        return { success: false, error: errorMessage };
      }
    },
    [user, loadTasks]
  );

  // bulkCompleteTasks - mark multiple routine instances as completed
  const bulkCompleteTasks = useCallback(
    async (instanceIds: string[]) => {
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      if (!instanceIds.length) {
        return { success: true };
      }

      try {
        const result = await MaintenanceService.bulkCompleteInstances(
          instanceIds
        );

        if (result.error) throw result.error;

        // Refresh all task data to ensure consistency
        await loadTasks();

        return { success: true };
      } catch (err) {
        const error = err as Error;
        const errorMessage =
          error.message || "Failed to complete maintenance tasks";
        console.error("Error bulk completing maintenance tasks:", error);
        return { success: false, error: errorMessage };
      }
    },
    [user, loadTasks]
  );

  // refreshTasks - refresh the maintenance tasks
  const refreshTasks = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  // refreshStats - refresh the stats
  const refreshStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await MaintenanceService.getMaintenanceStats();

      if (error) throw error;

      setStats(
        data || {
          total: 0,
          completed: 0,
          overdue: 0,
          dueToday: 0,
          thisWeek: 0,
          completionRate: 0,
          activeRoutines: 0,
          totalInstances: 0,
        }
      );
    } catch (err) {
      const error = err as Error;
      console.error("Error refreshing stats:", error);
    }
  }, [user]);

  // delete all maintenance routines and instances for current user
  const deleteAllTasks = useCallback(async () => {
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }
    try {
      const { error, routinesDeleted, instancesDeleted } =
        await MaintenanceService.deleteAllMaintenanceData();
      if (error) throw error;
      // Clear local state
      setTasks([]);
      setUpcomingTasks([]);
      setOverdueTasks([]);
      setCompletedTasks([]);
      await refreshStats();
      return { success: true };
    } catch (err) {
      const error = err as Error;
      const errorMessage =
        error.message || "Failed to delete all maintenance routines";
      console.error("Error deleting all maintenance routines:", error);
      return { success: false, error: errorMessage };
    }
  }, [user, refreshStats]);

  // Reload when app returns to foreground (debounced)
  useEffect(() => {
    if (!user || !sessionReady) return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;
      const now = Date.now();
      if (now - lastForegroundLoadRef.current < 2000) return;
      lastForegroundLoadRef.current = now;
      void loadTasks();
    });

    return () => subscription.remove();
  }, [user?.id, sessionReady, loadTasks]);

  // Load tasks when auth bootstrap completes
  useEffect(() => {
    if (user && sessionReady) {
      void loadTasks();
    } else if (!user) {
      setTasks([]);
      setUpcomingTasks([]);
      setOverdueTasks([]);
      setCompletedTasks([]);
      setStats({
        total: 0,
        completed: 0,
        overdue: 0,
        dueToday: 0,
        thisWeek: 0,
        completionRate: 0,
        activeRoutines: 0,
        totalInstances: 0,
      });
    }
  }, [user, sessionReady, loadTasks]);

  return {
    tasks,
    upcomingTasks,
    overdueTasks,
    completedTasks,
    loading,
    error,
    timeRange,
    lookbackDays,
    stats,
    createTask,
    applyMaintenancePlan,
    applyGeneratedHomeSchedule,
    updateTask,
    completeTask,
    uncompleteTask,
    skipTaskOccurrence,
    deleteTask,
    bulkCompleteTasks,
    deleteAllTasks,
    setTimeRange,
    setLookbackDays,
    refreshTasks,
    refreshStats,
  };
}
