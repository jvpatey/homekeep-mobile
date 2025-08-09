import React, { useState, useEffect, useCallback } from "react";
import { TaskService } from "../services/taskService";
import {
  Task,
  CreateTaskData,
  UpdateTaskData,
  TaskFilters,
} from "../types/task";
import { useAuth } from "../context/AuthContext";

// UseTasksReturn - interface for the return value of the useTasks hook
interface UseTasksReturn {
  tasks: Task[];
  upcomingTasks: Task[];
  completedTasks: Task[];
  loading: boolean;
  error: string | null;
  stats: {
    total: number;
    completed: number;
    overdue: number;
    dueToday: number;
    thisWeek: number;
    completionRate: number;
  };
  createTask: (
    taskData: CreateTaskData
  ) => Promise<{ success: boolean; error?: string }>;
  updateTask: (
    taskId: string,
    updates: UpdateTaskData
  ) => Promise<{ success: boolean; error?: string }>;
  completeTask: (
    taskId: string
  ) => Promise<{ success: boolean; error?: string }>;
  uncompleteTask: (
    taskId: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteTask: (taskId: string) => Promise<{ success: boolean; error?: string }>;
  refreshTasks: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

// useTasks - custom hook for managing tasks
export function useTasks(filters?: TaskFilters): UseTasksReturn {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    overdue: 0,
    dueToday: 0,
    thisWeek: 0,
    completionRate: 0,
  });

  // loadTasks - load tasks from the database
  const loadTasks = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const [tasksResult, upcomingResult, completedResult, statsResult] =
        await Promise.all([
          TaskService.getTasks(filters),
          TaskService.getUpcomingTasks(),
          TaskService.getCompletedTasks(),
          TaskService.getTaskStats(),
        ]);

      if (tasksResult.error) throw tasksResult.error;
      if (upcomingResult.error) throw upcomingResult.error;
      if (completedResult.error) throw completedResult.error;
      if (statsResult.error) throw statsResult.error;

      setTasks(tasksResult.data || []);
      setUpcomingTasks([...(upcomingResult.data || [])]);
      setCompletedTasks([...(completedResult.data || [])]);
      setStats(
        statsResult.data || {
          total: 0,
          completed: 0,
          overdue: 0,
          dueToday: 0,
          thisWeek: 0,
          completionRate: 0,
        }
      );
    } catch (err: any) {
      setError(err.message || "Failed to load tasks");
      console.error("Error loading tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  // createTask - create a new task
  const createTask = useCallback(
    async (taskData: CreateTaskData) => {
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      try {
        const { data, error } = await TaskService.createTask(taskData);

        if (error) throw error;

        // Refresh tasks after creation
        await loadTasks();

        return { success: true };
      } catch (err: any) {
        const errorMessage = err.message || "Failed to create task";
        console.error("Error creating task:", err);
        return { success: false, error: errorMessage };
      }
    },
    [user, loadTasks]
  );

  // updateTask - update a task
  const updateTask = useCallback(
    async (taskId: string, updates: UpdateTaskData) => {
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      try {
        const { data, error } = await TaskService.updateTask(taskId, updates);

        if (error) throw error;

        // Update local state
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? { ...task, ...updates, updated_at: new Date().toISOString() }
              : task
          )
        );
        setUpcomingTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? { ...task, ...updates, updated_at: new Date().toISOString() }
              : task
          )
        );

        // Refresh stats
        await refreshStats();

        return { success: true };
      } catch (err: any) {
        const errorMessage = err.message || "Failed to update task";
        console.error("Error updating task:", err);
        return { success: false, error: errorMessage };
      }
    },
    [user]
  );

  // completeTask - mark a task as completed
  const completeTask = useCallback(
    async (taskId: string) => {
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      try {
        const { data, error } = await TaskService.completeTask(taskId);

        if (error) throw error;

        // Update local state
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  is_completed: data?.is_completed ?? true,
                  completed_at: data?.completed_at ?? new Date().toISOString(),
                  last_completed_date:
                    data?.last_completed_date ?? new Date().toISOString(),
                  next_due_date: data?.next_due_date ?? task.next_due_date,
                  next_instance_date:
                    data?.next_instance_date ?? task.next_instance_date,
                }
              : task
          )
        );

        // If it's a recurring task, it should stay in upcoming tasks with the new due date
        // If it's not recurring, remove it from upcoming tasks
        if (data?.is_recurring) {
          setUpcomingTasks((prev) =>
            prev.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    is_completed: false, // Recurring tasks are marked as incomplete for next instance
                    next_due_date: data?.next_due_date ?? task.next_due_date,
                    next_instance_date:
                      data?.next_instance_date ?? task.next_instance_date,
                  }
                : task
            )
          );
        } else {
          setUpcomingTasks((prev) => prev.filter((task) => task.id !== taskId));
        }

        // Add to completed tasks if it's not recurring, or update if it is
        if (!data?.is_recurring) {
          const completedTask = tasks.find((task) => task.id === taskId);
          if (completedTask) {
            setCompletedTasks((prev) => [
              {
                ...completedTask,
                is_completed: true,
                completed_at: data?.completed_at ?? new Date().toISOString(),
              },
              ...prev,
            ]);
          }
        }

        // Refresh stats
        await refreshStats();

        return { success: true };
      } catch (err: any) {
        const errorMessage = err.message || "Failed to complete task";
        console.error("Error completing task:", err);
        return { success: false, error: errorMessage };
      }
    },
    [user, tasks]
  );

  // uncompleteTask - mark a task as incomplete
  const uncompleteTask = useCallback(
    async (taskId: string) => {
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      try {
        const { data, error } = await TaskService.uncompleteTask(taskId);

        if (error) throw error;

        // Refresh tasks to get updated data
        await loadTasks();

        return { success: true };
      } catch (err: any) {
        const errorMessage = err.message || "Failed to uncomplete task";
        console.error("Error uncompleting task:", err);
        return { success: false, error: errorMessage };
      }
    },
    [user, loadTasks]
  );

  // deleteTask - delete a task
  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      try {
        const { error } = await TaskService.deleteTask(taskId);

        if (error) throw error;

        // Remove from local state
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
        setUpcomingTasks((prev) => prev.filter((task) => task.id !== taskId));

        // Refresh stats
        await refreshStats();

        return { success: true };
      } catch (err: any) {
        const errorMessage = err.message || "Failed to delete task";
        console.error("Error deleting task:", err);
        return { success: false, error: errorMessage };
      }
    },
    [user]
  );

  // refreshTasks - refresh the tasks
  const refreshTasks = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  // refreshStats - refresh the stats
  const refreshStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await TaskService.getTaskStats();

      if (error) throw error;

      setStats(
        data || {
          total: 0,
          completed: 0,
          overdue: 0,
          dueToday: 0,
          thisWeek: 0,
          completionRate: 0,
        }
      );
    } catch (err: any) {
      console.error("Error refreshing stats:", err);
    }
  }, [user]);

  // Load tasks on mount and when user changes
  useEffect(() => {
    if (user) {
      loadTasks();
    } else {
      setTasks([]);
      setUpcomingTasks([]);
      setCompletedTasks([]);
      setStats({
        total: 0,
        completed: 0,
        overdue: 0,
        dueToday: 0,
        thisWeek: 0,
        completionRate: 0,
      });
    }
  }, [user, loadTasks]);

  return {
    tasks,
    upcomingTasks,
    completedTasks,
    loading,
    error,
    stats,
    createTask,
    updateTask,
    completeTask,
    uncompleteTask,
    deleteTask,
    refreshTasks,
    refreshStats,
  };
}
