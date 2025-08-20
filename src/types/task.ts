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

// New comprehensive home maintenance categories
export const HOME_MAINTENANCE_CATEGORIES = {
  HVAC: {
    name: "HVAC",
    displayName: "HVAC",
    color: "#FF6B6B",
    gradient: ["#FF6B6B", "#FF8E8E"],
    icon: "snow-outline",
    description: "Heating, ventilation, and air conditioning systems",
  },
  PLUMBING: {
    name: "PLUMBING",
    displayName: "Plumbing",
    color: "#4ECDC4",
    gradient: ["#4ECDC4", "#6EE7DF"],
    icon: "water-outline",
    description: "Water systems, pipes, and fixtures",
  },
  ELECTRICAL: {
    name: "ELECTRICAL",
    displayName: "Electrical",
    color: "#FFE66D",
    gradient: ["#FFE66D", "#FFF4A3"],
    icon: "flash-outline",
    description: "Electrical systems and components",
  },
  APPLIANCES: {
    name: "APPLIANCES",
    displayName: "Appliances",
    color: "#A8E6CF",
    gradient: ["#A8E6CF", "#C8F0E0"],
    icon: "hardware-chip-outline",
    description: "Home appliances and electronics",
  },
  EXTERIOR: {
    name: "EXTERIOR",
    displayName: "Exterior",
    color: "#FF9A8B",
    gradient: ["#FF9A8B", "#FFB8A8"],
    icon: "home-outline",
    description: "Roof, siding, gutters, and outdoor structures",
  },
  INTERIOR: {
    name: "INTERIOR",
    displayName: "Interior",
    color: "#B8E0D2",
    gradient: ["#B8E0D2", "#D4F0E4"],
    icon: "bed-outline",
    description: "Paint, flooring, windows, and interior finishes",
  },
  LANDSCAPING: {
    name: "LANDSCAPING",
    displayName: "Landscaping",
    color: "#95E1D3",
    gradient: ["#95E1D3", "#B8F0E4"],
    icon: "leaf-outline",
    description: "Lawn, trees, irrigation, and outdoor spaces",
  },
  SAFETY: {
    name: "SAFETY",
    displayName: "Safety",
    color: "#F38181",
    gradient: ["#F38181", "#FFA5A5"],
    icon: "shield-checkmark-outline",
    description: "Smoke detectors, fire extinguishers, and safety equipment",
  },
  GENERAL: {
    name: "GENERAL",
    displayName: "General",
    color: "#C7CEEA",
    gradient: ["#C7CEEA", "#E2E8F0"],
    icon: "construct-outline",
    description: "General maintenance and miscellaneous tasks",
  },
} as const;

export type CategoryKey = keyof typeof HOME_MAINTENANCE_CATEGORIES;
export type Category = (typeof HOME_MAINTENANCE_CATEGORIES)[CategoryKey];
