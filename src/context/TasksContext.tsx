import React, { createContext, useContext, ReactNode } from "react";
import { useTasks as useTasksHook } from "../hooks/useTasks";
import {
  Task,
  CreateTaskData,
  UpdateTaskData,
  TaskFilters,
} from "../types/task";

export type TimeRange = 30 | 60 | 90 | 120 | "all";

interface UseTasksReturn {
  tasks: Task[];
  upcomingTasks: Task[];
  completedTasks: Task[];
  loading: boolean;
  error: string | null;
  timeRange: TimeRange;
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
  bulkCompleteTasks: (
    taskIds: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  setTimeRange: (range: TimeRange) => void;
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
