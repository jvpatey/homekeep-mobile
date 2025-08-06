export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  estimated_duration?: number; // in minutes
  is_recurring: boolean;
  recurrence_type?: "weekly" | "monthly" | "quarterly" | "yearly";
  next_due_date: string; // ISO date string
  created_at: string;
  updated_at: string;
  completed_at?: string;
  is_completed: boolean;
}

export interface TaskInstance {
  id: string;
  task_id: string;
  due_date: string; // ISO date string
  completed_at?: string;
  is_completed: boolean;
  created_at: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  estimated_duration?: number;
  is_recurring: boolean;
  recurrence_type?: "weekly" | "monthly" | "quarterly" | "yearly";
  next_due_date: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  category?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  estimated_duration?: number;
  is_recurring?: boolean;
  recurrence_type?: "weekly" | "monthly" | "quarterly" | "yearly";
  next_due_date?: string;
  is_completed?: boolean;
}

export interface TaskWithInstances extends Task {
  instances?: TaskInstance[];
}

export interface TaskFilters {
  category?: string;
  priority?: string;
  is_completed?: boolean;
  due_date_from?: string;
  due_date_to?: string;
}
