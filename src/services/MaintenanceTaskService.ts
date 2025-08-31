import { supabase } from "../context/AuthContext";
import {
  MaintenanceTask,
  MaintenanceFilters,
  MaintenanceCategory,
  Priority,
  MaintenanceTasksResponse,
  ServiceResponse,
} from "../types/maintenance";
import { MaintenanceDataMapper } from "./maintenanceDataMapper";
import { addDays, startOfDay } from "date-fns";

export class MaintenanceTaskService {
  // Get maintenance tasks (routines + instances) for dashboard
  static async getMaintenanceTasks(
    filters?: MaintenanceFilters
  ): Promise<MaintenanceTasksResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      let query = supabase
        .from("routine_instances")
        .select(
          `
          *,
          routine:maintenance_routines(
            id,
            user_id,
            title,
            description,
            category,
            priority,
            estimated_duration_minutes,
            interval_days,
            start_date,
            is_active,
            created_at,
            updated_at
          )
        `
        )
        .order("due_date", { ascending: true });

      // Apply filters
      if (filters?.category) {
        query = query.eq("routine.category", filters.category);
      }
      if (filters?.priority) {
        query = query.eq("routine.priority", filters.priority);
      }
      if (filters?.is_completed !== undefined) {
        query = query.eq("is_completed", filters.is_completed);
      }
      if (filters?.is_overdue !== undefined) {
        query = query.eq("is_overdue", filters.is_overdue);
      }
      if (filters?.due_date_from) {
        query = query.gte("due_date", filters.due_date_from);
      }
      if (filters?.due_date_to) {
        query = query.lte("due_date", filters.due_date_to);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq("routine.is_active", filters.is_active);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mappedTasks = MaintenanceDataMapper.mapInstancesToTasks(data);
      return { data: mappedTasks, error: null };
    } catch (error) {
      console.error("Error fetching maintenance tasks:", error);
      return {
        data: null,
        error: {
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          details: String(error),
        },
      };
    }
  }

  // Get upcoming maintenance tasks
  static async getUpcomingTasks(
    timeRange: number | "all" = 60
  ): Promise<MaintenanceTasksResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const start = startOfDay(new Date());
      let query = supabase
        .from("routine_instances")
        .select(
          `
          *,
          routine:maintenance_routines(
            id,
            user_id,
            title,
            description,
            category,
            priority,
            estimated_duration_minutes,
            interval_days,
            start_date,
            is_active,
            created_at,
            updated_at
          )
        `
        )
        .eq("is_completed", false)
        .eq("routine.is_active", true)
        .gte("due_date", start.toISOString())
        .order("due_date", { ascending: true });

      if (timeRange !== "all") {
        const endDate = addDays(new Date(), timeRange);
        query = query.lte("due_date", endDate.toISOString());
      }

      const { data, error } = await query.limit(200);

      if (error) throw error;

      const mappedTasks = MaintenanceDataMapper.mapInstancesToTasks(data);
      return { data: mappedTasks, error: null };
    } catch (error) {
      console.error("Error fetching upcoming tasks:", error);
      return {
        data: null,
        error: {
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          details: String(error),
        },
      };
    }
  }

  // Get overdue maintenance tasks
  static async getOverdueTasks(
    lookbackDays: number | "all" = 14
  ): Promise<MaintenanceTasksResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const start = startOfDay(new Date());
      let query = supabase
        .from("routine_instances")
        .select(
          `
          *,
          routine:maintenance_routines(
            id,
            user_id,
            title,
            description,
            category,
            priority,
            estimated_duration_minutes,
            interval_days,
            start_date,
            is_active,
            created_at,
            updated_at
          )
        `
        )
        .eq("is_completed", false)
        .eq("is_overdue", true)
        .eq("routine.is_active", true)
        .order("due_date", { ascending: true });

      if (lookbackDays !== "all") {
        const from = addDays(start, -lookbackDays);
        query = query.gte("due_date", from.toISOString());
      }

      const { data, error } = await query.limit(200);

      if (error) throw error;

      const mappedTasks = MaintenanceDataMapper.mapInstancesToTasks(data);
      return { data: mappedTasks, error: null };
    } catch (error) {
      console.error("Error fetching overdue tasks:", error);
      return {
        data: null,
        error: {
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          details: String(error),
        },
      };
    }
  }

  // Get completed maintenance tasks
  static async getCompletedTasks(
    lookbackDays: number | "all" = 14
  ): Promise<MaintenanceTasksResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      let query = supabase
        .from("routine_instances")
        .select(
          `
          *,
          routine:maintenance_routines(
            id,
            user_id,
            title,
            description,
            category,
            priority,
            estimated_duration_minutes,
            interval_days,
            start_date,
            is_active,
            created_at,
            updated_at
          )
        `
        )
        .eq("is_completed", true)
        .order("completed_at", { ascending: false });

      if (lookbackDays !== "all") {
        const now = new Date();
        const from = addDays(now, -lookbackDays);
        query = query.gte("completed_at", from.toISOString());
      }

      const { data, error } = await query.limit(200);

      if (error) throw error;

      const mappedTasks = MaintenanceDataMapper.mapInstancesToTasks(data);
      return { data: mappedTasks, error: null };
    } catch (error) {
      console.error("Error fetching completed tasks:", error);
      return {
        data: null,
        error: {
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          details: String(error),
        },
      };
    }
  }

  // Get tasks by category
  static async getTasksByCategory(
    category: MaintenanceCategory
  ): Promise<MaintenanceTasksResponse> {
    return this.getMaintenanceTasks({ category });
  }

  // Get tasks by priority
  static async getTasksByPriority(
    priority: Priority
  ): Promise<MaintenanceTasksResponse> {
    return this.getMaintenanceTasks({ priority });
  }

  // Get tasks due in a specific date range
  static async getTasksInDateRange(
    startDate: string,
    endDate: string,
    includeCompleted: boolean = true
  ): Promise<MaintenanceTasksResponse> {
    return this.getMaintenanceTasks({
      due_date_from: startDate,
      due_date_to: endDate,
      show_completed: includeCompleted,
    });
  }
}
