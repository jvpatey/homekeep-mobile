import React, { createContext, useContext, ReactNode } from "react";
import { useTasks as useTasksHook } from "../hooks/useTasks";
import {
  MaintenanceTask,
  CreateMaintenanceRoutineData,
  UpdateMaintenanceRoutineData,
} from "../types/maintenance";

// TimeRange type for the time range
export type TimeRange = 30 | 60 | 90 | 120 | "all";

// UseTasksReturn type for the useTasks return
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

// TasksContext context for the tasks context
const TasksContext = createContext<UseTasksReturn | undefined>(undefined);

// TasksProviderProps type for the tasks provider props
interface TasksProviderProps {
  children: ReactNode;
}

// TasksProvider provider for the tasks context
export function TasksProvider({ children }: TasksProviderProps) {
  const tasksHookValue = useTasksHook();

  return (
    <TasksContext.Provider value={tasksHookValue}>
      {children}
    </TasksContext.Provider>
  );
}

// useTasks hook for the useTasks on the home screen
export function useTasks(): UseTasksReturn {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return context;
}
