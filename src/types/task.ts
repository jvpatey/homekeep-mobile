export interface Task {
  instance_id?: string; // If this Task represents a concrete occurrence from task_instances
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
  // New fields for better recurring task support
  last_completed_date?: string; // ISO date string - when the last instance was completed
  next_instance_date?: string; // ISO date string - when the next instance is due
  // Client-only flag to indicate a synthesized future occurrence
  is_virtual?: boolean;
}

export interface TaskInstance {
  id: string;
  task_id: string;
  due_date: string; // ISO date string
  completed_at?: string;
  is_completed: boolean;
  created_at: string;
}

export interface TaskWithInstances {
  task: Task;
  instances: TaskInstance[];
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
  last_completed_date?: string;
  next_instance_date?: string;
}

export interface TaskFilters {
  category?: string;
  priority?: string;
  is_completed?: boolean;
  due_date_from?: string;
  due_date_to?: string;
  show_completed?: boolean;
}
