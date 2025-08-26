import { supabase } from "../context/AuthContext";
import {
  MaintenanceRoutine,
  RoutineInstance,
  MaintenanceTask,
  CreateMaintenanceRoutineData,
  UpdateMaintenanceRoutineData,
  UpdateRoutineInstanceData,
  MaintenanceFilters,
  MaintenanceStats,
  MaintenanceCategory,
  Priority,
} from "../types/maintenance";
import { addDays, startOfDay, endOfDay, isToday, isThisWeek } from "date-fns";

export class MaintenanceService {
  // Create a new maintenance routine
  static async createMaintenanceRoutine(
    routineData: CreateMaintenanceRoutineData
  ): Promise<{ data: MaintenanceRoutine | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const routineWithUserId = {
        ...routineData,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("maintenance_routines")
        .insert([routineWithUserId])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error creating maintenance routine:", error);
      return { data: null, error };
    }
  }

  // Get all maintenance routines for the current user
  static async getMaintenanceRoutines(
    filters?: Partial<MaintenanceFilters>
  ): Promise<{ data: MaintenanceRoutine[] | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      let query = supabase
        .from("maintenance_routines")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.priority) {
        query = query.eq("priority", filters.priority);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error fetching maintenance routines:", error);
      return { data: null, error };
    }
  }

  // Get maintenance tasks (routines + instances) for dashboard
  static async getMaintenanceTasks(
    filters?: MaintenanceFilters
  ): Promise<{ data: MaintenanceTask[] | null; error: any }> {
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

      // Map to MaintenanceTask interface
      const mappedTasks: MaintenanceTask[] = (data || []).map(
        (instance: any) => ({
          id: instance.routine.id,
          instance_id: instance.id,
          user_id: instance.routine.user_id,
          title: instance.routine.title,
          description: instance.routine.description,
          category: instance.routine.category,
          priority: instance.routine.priority,
          estimated_duration_minutes:
            instance.routine.estimated_duration_minutes,
          interval_days: instance.routine.interval_days,
          start_date: instance.routine.start_date,
          due_date: instance.due_date,
          is_completed: instance.is_completed,
          is_overdue: instance.is_overdue,
          completed_at: instance.completed_at,
          notes: instance.notes,
          created_at: instance.routine.created_at,
          updated_at: instance.routine.updated_at,
          is_active: instance.routine.is_active,
        })
      );

      return { data: mappedTasks, error: null };
    } catch (error) {
      console.error("Error fetching maintenance tasks:", error);
      return { data: null, error };
    }
  }

  // Get upcoming maintenance tasks
  static async getUpcomingTasks(
    timeRange: number | "all" = 60
  ): Promise<{ data: MaintenanceTask[] | null; error: any }> {
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

      const mappedTasks: MaintenanceTask[] = (data || []).map(
        (instance: any) => ({
          id: instance.routine.id,
          instance_id: instance.id,
          user_id: instance.routine.user_id,
          title: instance.routine.title,
          description: instance.routine.description,
          category: instance.routine.category,
          priority: instance.routine.priority,
          estimated_duration_minutes:
            instance.routine.estimated_duration_minutes,
          interval_days: instance.routine.interval_days,
          start_date: instance.routine.start_date,
          due_date: instance.due_date,
          is_completed: instance.is_completed,
          is_overdue: instance.is_overdue,
          completed_at: instance.completed_at,
          notes: instance.notes,
          created_at: instance.routine.created_at,
          updated_at: instance.routine.updated_at,
          is_active: instance.routine.is_active,
        })
      );

      return { data: mappedTasks, error: null };
    } catch (error) {
      console.error("Error fetching upcoming tasks:", error);
      return { data: null, error };
    }
  }

  // Get overdue maintenance tasks
  static async getOverdueTasks(
    lookbackDays: number | "all" = 14
  ): Promise<{ data: MaintenanceTask[] | null; error: any }> {
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

      const mappedTasks: MaintenanceTask[] = (data || []).map(
        (instance: any) => ({
          id: instance.routine.id,
          instance_id: instance.id,
          user_id: instance.routine.user_id,
          title: instance.routine.title,
          description: instance.routine.description,
          category: instance.routine.category,
          priority: instance.routine.priority,
          estimated_duration_minutes:
            instance.routine.estimated_duration_minutes,
          interval_days: instance.routine.interval_days,
          start_date: instance.routine.start_date,
          due_date: instance.due_date,
          is_completed: instance.is_completed,
          is_overdue: instance.is_overdue,
          completed_at: instance.completed_at,
          notes: instance.notes,
          created_at: instance.routine.created_at,
          updated_at: instance.routine.updated_at,
          is_active: instance.routine.is_active,
        })
      );

      return { data: mappedTasks, error: null };
    } catch (error) {
      console.error("Error fetching overdue tasks:", error);
      return { data: null, error };
    }
  }

  // Get completed maintenance tasks
  static async getCompletedTasks(
    lookbackDays: number | "all" = 14
  ): Promise<{ data: MaintenanceTask[] | null; error: any }> {
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

      const mappedTasks: MaintenanceTask[] = (data || []).map(
        (instance: any) => ({
          id: instance.routine.id,
          instance_id: instance.id,
          user_id: instance.routine.user_id,
          title: instance.routine.title,
          description: instance.routine.description,
          category: instance.routine.category,
          priority: instance.routine.priority,
          estimated_duration_minutes:
            instance.routine.estimated_duration_minutes,
          interval_days: instance.routine.interval_days,
          start_date: instance.routine.start_date,
          due_date: instance.due_date,
          is_completed: instance.is_completed,
          is_overdue: instance.is_overdue,
          completed_at: instance.completed_at,
          notes: instance.notes,
          created_at: instance.routine.created_at,
          updated_at: instance.routine.updated_at,
          is_active: instance.routine.is_active,
        })
      );

      return { data: mappedTasks, error: null };
    } catch (error) {
      console.error("Error fetching completed tasks:", error);
      return { data: null, error };
    }
  }

  // Complete a routine instance
  static async completeInstance(
    instanceId: string,
    notes?: string
  ): Promise<{ data: RoutineInstance | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const now = new Date().toISOString();
      const updateData: UpdateRoutineInstanceData = {
        is_completed: true,
        completed_at: now,
      };

      if (notes) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from("routine_instances")
        .update(updateData)
        .eq("id", instanceId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error completing instance:", error);
      return { data: null, error };
    }
  }

  // Uncomplete a routine instance
  static async uncompleteInstance(
    instanceId: string
  ): Promise<{ data: RoutineInstance | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const { data, error } = await supabase
        .from("routine_instances")
        .update({
          is_completed: false,
          completed_at: null,
        })
        .eq("id", instanceId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error uncompleting instance:", error);
      return { data: null, error };
    }
  }

  // Update a routine instance
  static async updateInstance(
    instanceId: string,
    updates: UpdateRoutineInstanceData
  ): Promise<{ data: RoutineInstance | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const { data, error } = await supabase
        .from("routine_instances")
        .update(updates)
        .eq("id", instanceId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error updating instance:", error);
      return { data: null, error };
    }
  }

  // Update a maintenance routine
  static async updateMaintenanceRoutine(
    routineId: string,
    updates: UpdateMaintenanceRoutineData
  ): Promise<{ data: MaintenanceRoutine | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const { data, error } = await supabase
        .from("maintenance_routines")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", routineId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error updating maintenance routine:", error);
      return { data: null, error };
    }
  }

  // Delete a maintenance routine
  static async deleteMaintenanceRoutine(
    routineId: string
  ): Promise<{ error: any }> {
    if (!supabase) {
      return { error: { message: "Supabase not configured" } };
    }

    try {
      const { error } = await supabase
        .from("maintenance_routines")
        .delete()
        .eq("id", routineId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error("Error deleting maintenance routine:", error);
      return { error };
    }
  }

  // Get maintenance statistics for dashboard
  static async getMaintenanceStats(): Promise<{
    data: MaintenanceStats | null;
    error: any;
  }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const start = startOfDay(new Date());
      const today = start;
      const tomorrow = addDays(today, 1);
      const nextWeek = addDays(today, 7);

      // Get total active routines
      const { count: activeRoutinesCount, error: activeRoutinesError } =
        await supabase
          .from("maintenance_routines")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true);
      if (activeRoutinesError) throw activeRoutinesError;

      // Get total instances
      const { count: totalInstancesCount, error: totalInstancesError } =
        await supabase
          .from("routine_instances")
          .select("id", { count: "exact", head: true });
      if (totalInstancesError) throw totalInstancesError;

      // Get completed instances
      const { count: completedInstancesCount, error: completedInstancesError } =
        await supabase
          .from("routine_instances")
          .select("id", { count: "exact", head: true })
          .eq("is_completed", true);
      if (completedInstancesError) throw completedInstancesError;

      // Get overdue instances
      const { count: overdueInstancesCount, error: overdueInstancesError } =
        await supabase
          .from("routine_instances")
          .select("id", { count: "exact", head: true })
          .eq("is_completed", false)
          .eq("is_overdue", true);
      if (overdueInstancesError) throw overdueInstancesError;

      // Get due today instances
      const { count: todayInstancesCount, error: todayInstancesError } =
        await supabase
          .from("routine_instances")
          .select("id", { count: "exact", head: true })
          .eq("is_completed", false)
          .gte("due_date", today.toISOString())
          .lt("due_date", tomorrow.toISOString());
      if (todayInstancesError) throw todayInstancesError;

      // Get due this week instances
      const { count: thisWeekInstancesCount, error: thisWeekInstancesError } =
        await supabase
          .from("routine_instances")
          .select("id", { count: "exact", head: true })
          .eq("is_completed", false)
          .gte("due_date", today.toISOString())
          .lt("due_date", nextWeek.toISOString());
      if (thisWeekInstancesError) throw thisWeekInstancesError;

      const stats: MaintenanceStats = {
        total: activeRoutinesCount || 0,
        completed: completedInstancesCount || 0,
        overdue: overdueInstancesCount || 0,
        dueToday: todayInstancesCount || 0,
        thisWeek: thisWeekInstancesCount || 0,
        completionRate: totalInstancesCount
          ? Math.round(
              ((completedInstancesCount || 0) / totalInstancesCount) * 100
            )
          : 0,
        activeRoutines: activeRoutinesCount || 0,
        totalInstances: totalInstancesCount || 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error("Error fetching maintenance stats:", error);
      return { data: null, error };
    }
  }

  // Get tasks by category
  static async getTasksByCategory(
    category: MaintenanceCategory
  ): Promise<{ data: MaintenanceTask[] | null; error: any }> {
    return this.getMaintenanceTasks({ category });
  }

  // Get tasks by priority
  static async getTasksByPriority(
    priority: Priority
  ): Promise<{ data: MaintenanceTask[] | null; error: any }> {
    return this.getMaintenanceTasks({ priority });
  }

  // Get tasks due in a specific date range
  static async getTasksInDateRange(
    startDate: string,
    endDate: string,
    includeCompleted: boolean = true
  ): Promise<{ data: MaintenanceTask[] | null; error: any }> {
    return this.getMaintenanceTasks({
      due_date_from: startDate,
      due_date_to: endDate,
      show_completed: includeCompleted,
    });
  }

  // Bulk complete multiple instances
  static async bulkCompleteInstances(
    instanceIds: string[]
  ): Promise<{ data: RoutineInstance[] | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    if (!instanceIds.length) {
      return { data: [], error: null };
    }

    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("routine_instances")
        .update({
          is_completed: true,
          completed_at: now,
        })
        .in("id", instanceIds)
        .eq("is_completed", false)
        .select();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error bulk completing instances:", error);
      return { data: null, error };
    }
  }

  // Delete all maintenance data for a user
  static async deleteAllMaintenanceData(): Promise<{
    error: any;
    routinesDeleted?: number;
    instancesDeleted?: number;
  }> {
    if (!supabase) {
      return { error: { message: "Supabase not configured" } };
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error("Not authenticated");

      // Get user's routine IDs
      const { data: userRoutines, error: fetchErr } = await supabase
        .from("maintenance_routines")
        .select("id")
        .eq("user_id", user.id);
      if (fetchErr) throw fetchErr;

      const routineIds = (userRoutines || []).map((r: any) => r.id);
      const routinesCount = routineIds.length;
      let instancesCount = 0;

      if (routineIds.length > 0) {
        // Count instances first
        const { count: instCount, error: instCountErr } = await supabase
          .from("routine_instances")
          .select("id", { count: "exact", head: true })
          .in("routine_id", routineIds);
        if (instCountErr) throw instCountErr;
        instancesCount = instCount || 0;

        // Delete instances first (cascade should handle this, but being explicit)
        const { error: instErr } = await supabase
          .from("routine_instances")
          .delete()
          .in("routine_id", routineIds);
        if (instErr) throw instErr;
      }

      // Delete all routines for this user
      const { error: routinesErr } = await supabase
        .from("maintenance_routines")
        .delete()
        .eq("user_id", user.id);
      if (routinesErr) throw routinesErr;

      return {
        error: null,
        routinesDeleted: routinesCount,
        instancesDeleted: instancesCount,
      };
    } catch (error) {
      console.error("Error deleting all maintenance data:", error);
      return { error };
    }
  }
}
