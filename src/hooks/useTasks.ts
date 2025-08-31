import React, { useState, useEffect, useCallback } from "react";
import { MaintenanceService } from "../services/MaintenanceService";
import {
  MaintenanceTask,
  CreateMaintenanceRoutineData,
  UpdateMaintenanceRoutineData,
  MaintenanceFilters,
} from "../types/maintenance";
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
  updateTask: (
    taskId: string,
    updates: UpdateMaintenanceRoutineData
  ) => Promise<{ success: boolean; error?: string }>;
  completeTask: (
    instanceId: string
  ) => Promise<{ success: boolean; error?: string }>;
  uncompleteTask: (
    instanceId: string
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
  const { user } = useAuth();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<MaintenanceTask[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<MaintenanceTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
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
  const [lookbackDays, setLookbackDays] = useState<number | "all">(14);

  // loadTasks - load maintenance tasks from the database
  const loadTasks = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      console.log(
        `🔄 useTasks: Loading maintenance tasks with filter = ${
          timeRange === "all" ? "All Tasks" : `${timeRange} days`
        }`
      );
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

      if (tasksResult.error) throw tasksResult.error;
      if (upcomingResult.error) throw upcomingResult.error;
      if (completedResult.error) throw completedResult.error;
      if (overdueResult.error) throw overdueResult.error;
      if (statsResult.error) throw statsResult.error;

      const upcomingCount = upcomingResult.data?.length || 0;
      const overdueCount = overdueResult.data?.length || 0;
      const completedCount = completedResult.data?.length || 0;

      setTasks(tasksResult.data || []);
      setUpcomingTasks(upcomingResult.data || []);
      setOverdueTasks(overdueResult.data || []);
      setCompletedTasks([...(completedResult.data || [])]);
      setStats(
        statsResult.data || {
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

      // Global totals regardless of UI filters
      console.log(
        `📦 User totals — routines: ${
          tasksResult.data?.length || 0
        }, upcoming: ${upcomingCount}, overdue: ${overdueCount}, completed: ${completedCount}`
      );

      console.log(
        `✅ useTasks: Loaded ${upcomingCount} upcoming, ${overdueCount} overdue, ${completedCount} completed maintenance tasks`
      );
    } catch (err: any) {
      setError(err.message || "Failed to load maintenance tasks");
      console.error("❌ useTasks: Error loading maintenance tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [user, filters, timeRange, lookbackDays]);

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
      } catch (err: any) {
        const errorMessage =
          err.message || "Failed to create maintenance routine";
        console.error("Error creating maintenance routine:", err);
        return { success: false, error: errorMessage };
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

        // Update local state
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? { ...task, ...updates, updated_at: new Date().toISOString() }
              : task
          )
        );

        // Handle completion status changes
        if (updates.is_active !== undefined) {
          // If routine is deactivated, remove from upcoming and overdue lists
          if (!updates.is_active) {
            setUpcomingTasks((prev) =>
              prev.filter((task) => task.id !== taskId)
            );
            setOverdueTasks((prev) =>
              prev.filter((task) => task.id !== taskId)
            );
          }
        }

        // Refresh stats
        await refreshStats();

        return { success: true };
      } catch (err: any) {
        const errorMessage =
          err.message || "Failed to update maintenance routine";
        console.error("Error updating maintenance routine:", err);
        return { success: false, error: errorMessage };
      }
    },
    [user, tasks]
  );

  // completeTask - mark a routine instance as completed
  const completeTask = useCallback(
    async (instanceId: string) => {
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      try {
        const result = await MaintenanceService.completeInstance(instanceId);

        if (result.error) throw result.error;

        // Refresh all task data to ensure consistency
        await loadTasks();

        return { success: true };
      } catch (err: any) {
        const errorMessage =
          err.message || "Failed to complete maintenance task";
        console.error("Error completing maintenance task:", err);
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

        // Refresh all task data to ensure consistency
        await loadTasks();

        return { success: true };
      } catch (err: any) {
        const errorMessage =
          err.message || "Failed to uncomplete maintenance task";
        console.error("Error uncompleting maintenance task:", err);
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

        // Remove from local state
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
        setUpcomingTasks((prev) => prev.filter((task) => task.id !== taskId));
        setOverdueTasks((prev) => prev.filter((task) => task.id !== taskId));
        setCompletedTasks((prev) => prev.filter((task) => task.id !== taskId));

        // Refresh stats
        await refreshStats();

        return { success: true };
      } catch (err: any) {
        const errorMessage =
          err.message || "Failed to delete maintenance routine";
        console.error("Error deleting maintenance routine:", err);
        return { success: false, error: errorMessage };
      }
    },
    [user]
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
      } catch (err: any) {
        const errorMessage =
          err.message || "Failed to complete maintenance tasks";
        console.error("Error bulk completing maintenance tasks:", err);
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
    } catch (err: any) {
      console.error("Error refreshing stats:", err);
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
      console.log(
        `🗑️ Deleted all maintenance routines: ${
          routinesDeleted || 0
        } routines and ${instancesDeleted || 0} instances`
      );
      return { success: true };
    } catch (err: any) {
      const errorMessage =
        err.message || "Failed to delete all maintenance routines";
      console.error("Error deleting all maintenance routines:", err);
      return { success: false, error: errorMessage };
    }
  }, [user, refreshStats]);

  // Load tasks on mount and when user changes
  useEffect(() => {
    if (user) {
      loadTasks();
    } else {
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
  }, [user, loadTasks]);

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
    updateTask,
    completeTask,
    uncompleteTask,
    deleteTask,
    bulkCompleteTasks,
    deleteAllTasks,
    setTimeRange,
    setLookbackDays,
    refreshTasks,
    refreshStats,
  };
}
