import React, { createContext, useContext, ReactNode } from "react";
import { useTasks as useTasksHook } from "../hooks/useTasks";
import {
  Task,
  CreateTaskData,
  UpdateTaskData,
  TaskFilters,
  TaskStats,
} from "../types/task";

interface UseTasksReturn {
  tasks: Task[];
  upcomingTasks: Task[];
  loading: boolean;
  error: string | null;
  stats: TaskStats;
  createTask: (
    taskData: CreateTaskData
  ) => Promise<{ success: boolean; error?: string }>;
  updateTask: (
    taskId: string,
    updates: UpdateTaskData
  ) => Promise<{ success: boolean; error?: string }>;
  deleteTask: (taskId: string) => Promise<{ success: boolean; error?: string }>;
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
