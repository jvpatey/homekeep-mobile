// Maintenance Routine Types for HomeKeep Mobile App

export interface MaintenanceRoutine {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: MaintenanceCategory;
  priority: Priority;
  estimated_duration_minutes: number;
  interval_days: number;
  start_date: string; // ISO date string
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoutineInstance {
  id: string;
  routine_id: string;
  due_date: string; // ISO date string
  completed_at?: string;
  is_completed: boolean;
  is_overdue: boolean;
  notes?: string;
  created_at: string;
}

export interface MaintenanceTask {
  // Combined view for the dashboard - routine + instance data
  id: string; // routine ID
  instance_id: string; // instance ID
  user_id: string;
  title: string;
  description?: string;
  category: MaintenanceCategory;
  priority: Priority;
  estimated_duration_minutes: number;
  interval_days: number;
  start_date: string;
  due_date: string; // from instance
  is_completed: boolean;
  is_overdue: boolean;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export type MaintenanceCategory =
  | "HVAC"
  | "PLUMBING"
  | "ELECTRICAL"
  | "APPLIANCES"
  | "EXTERIOR"
  | "INTERIOR"
  | "LANDSCAPING"
  | "SAFETY"
  | "GENERAL";

export type Priority = "low" | "medium" | "high" | "urgent";

export type IntervalType =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "custom";

// Data for creating new maintenance routines
export interface CreateMaintenanceRoutineData {
  title: string;
  description?: string;
  category: MaintenanceCategory;
  priority: Priority;
  estimated_duration_minutes: number;
  interval_days: number;
  start_date: string;
}

// Data for updating maintenance routines
export interface UpdateMaintenanceRoutineData {
  title?: string;
  description?: string;
  category?: MaintenanceCategory;
  priority?: Priority;
  estimated_duration_minutes?: number;
  interval_days?: number;
  start_date?: string;
  is_active?: boolean;
}

// Data for updating routine instances
export interface UpdateRoutineInstanceData {
  is_completed?: boolean;
  completed_at?: string;
  notes?: string;
}

// Filters for querying maintenance tasks
export interface MaintenanceFilters {
  category?: MaintenanceCategory;
  priority?: Priority;
  is_completed?: boolean;
  is_overdue?: boolean;
  due_date_from?: string;
  due_date_to?: string;
  show_completed?: boolean;
  is_active?: boolean;
}

// Statistics for dashboard
export interface MaintenanceStats {
  total: number;
  completed: number;
  overdue: number;
  dueToday: number;
  thisWeek: number;
  completionRate: number;
  activeRoutines: number;
  totalInstances: number;
}

// Home maintenance categories with enhanced metadata
export const HOME_MAINTENANCE_CATEGORIES = {
  HVAC: {
    name: "HVAC",
    displayName: "HVAC",
    color: "#FF6B6B",
    gradient: ["#FF6B6B", "#FF8E8E"],
    icon: "snow-outline",
    description: "Heating, ventilation, and air conditioning systems",
    defaultInterval: 90, // 3 months
  },
  PLUMBING: {
    name: "PLUMBING",
    displayName: "Plumbing",
    color: "#4ECDC4",
    gradient: ["#4ECDC4", "#6EE7DF"],
    icon: "water-outline",
    description: "Water systems, pipes, and fixtures",
    defaultInterval: 180, // 6 months
  },
  ELECTRICAL: {
    name: "ELECTRICAL",
    displayName: "Electrical",
    color: "#FFE66D",
    gradient: ["#FFE66D", "#FFF4A3"],
    icon: "flash-outline",
    description: "Electrical systems and components",
    defaultInterval: 365, // 1 year
  },
  APPLIANCES: {
    name: "APPLIANCES",
    displayName: "Appliances",
    color: "#A8E6CF",
    gradient: ["#A8E6CF", "#C8F0E0"],
    icon: "hardware-chip-outline",
    description: "Home appliances and electronics",
    defaultInterval: 90, // 3 months
  },
  EXTERIOR: {
    name: "EXTERIOR",
    displayName: "Exterior",
    color: "#FF9A8B",
    gradient: ["#FF9A8B", "#FFB8A8"],
    icon: "home-outline",
    description: "Roof, siding, gutters, and outdoor structures",
    defaultInterval: 180, // 6 months
  },
  INTERIOR: {
    name: "INTERIOR",
    displayName: "Interior",
    color: "#B8E0D2",
    gradient: ["#B8E0D2", "#D4F0E4"],
    icon: "bed-outline",
    description: "Paint, flooring, windows, and interior finishes",
    defaultInterval: 365, // 1 year
  },
  LANDSCAPING: {
    name: "LANDSCAPING",
    displayName: "Landscaping",
    color: "#95E1D3",
    gradient: ["#95E1D3", "#B8F0E4"],
    icon: "leaf-outline",
    description: "Lawn, trees, irrigation, and outdoor spaces",
    defaultInterval: 30, // 1 month
  },
  SAFETY: {
    name: "SAFETY",
    displayName: "Safety",
    color: "#F38181",
    gradient: ["#F38181", "#FFA5A5"],
    icon: "shield-checkmark-outline",
    description: "Smoke detectors, fire extinguishers, and safety equipment",
    defaultInterval: 90, // 3 months
  },
  GENERAL: {
    name: "GENERAL",
    displayName: "General",
    color: "#C7CEEA",
    gradient: ["#C7CEEA", "#E2E8F0"],
    icon: "construct-outline",
    description: "General maintenance and miscellaneous tasks",
    defaultInterval: 180, // 6 months
  },
} as const;

export type CategoryKey = keyof typeof HOME_MAINTENANCE_CATEGORIES;
export type Category = (typeof HOME_MAINTENANCE_CATEGORIES)[CategoryKey];

// Priority options with enhanced metadata
export const PRIORITIES = {
  low: {
    id: "low",
    name: "Low",
    color: "#95A5A6",
    description: "Can be done when convenient",
  },
  medium: {
    id: "medium",
    name: "Medium",
    color: "#3498DB",
    description: "Should be done soon",
  },
  high: {
    id: "high",
    name: "High",
    color: "#E74C3C",
    description: "Needs attention soon",
  },
  urgent: {
    id: "urgent",
    name: "Urgent",
    color: "#C0392B",
    description: "Requires immediate attention",
  },
} as const;

// Interval options for maintenance routines
export const INTERVAL_OPTIONS = {
  weekly: {
    id: "weekly" as const,
    name: "Weekly",
    description: "Every week",
    days: 7,
  },
  monthly: {
    id: "monthly" as const,
    name: "Monthly",
    description: "Every month",
    days: 30,
  },
  quarterly: {
    id: "quarterly" as const,
    name: "Quarterly",
    description: "Every 3 months",
    days: 90,
  },
  yearly: {
    id: "yearly" as const,
    name: "Yearly",
    description: "Every year",
    days: 365,
  },
  custom: {
    id: "custom" as const,
    name: "Custom",
    description: "Custom interval in days",
    days: null,
  },
} as const;

export type IntervalKey = keyof typeof INTERVAL_OPTIONS;
