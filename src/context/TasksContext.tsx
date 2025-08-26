import React, { createContext, useContext, ReactNode } from "react";
import { useTasks as useTasksHook } from "../hooks/useTasks";
import {
  MaintenanceTask,
  CreateMaintenanceRoutineData,
  UpdateMaintenanceRoutineData,
  MaintenanceFilters,
} from "../types/maintenance";

export type TimeRange = 30 | 60 | 90 | 120 | "all";

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

const TasksContext = createContext<UseTasksReturn | undefined>(undefined);

interface TasksProviderProps {
  children: ReactNode;
}

export function TasksProvider({ children }: TasksProviderProps) {
  const tasksHookValue = useTasksHook();

  return (
    <TasksContext.Provider value={tasksHookValue}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks(): UseTasksReturn {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return context;
}
