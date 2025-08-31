import { supabase } from "../context/AuthContext";
import {
  MaintenanceStats,
  ServiceResponse,
  CountResponse,
} from "../types/maintenance";
import { addDays, startOfDay } from "date-fns";

export class MaintenanceStatsService {
  // Get maintenance statistics for dashboard
  static async getMaintenanceStats(): Promise<
    ServiceResponse<MaintenanceStats>
  > {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const start = startOfDay(new Date());
      const today = start;
      const tomorrow = addDays(today, 1);
      const nextWeek = addDays(today, 7);

      // Get all the counts in parallel for better performance
      const [
        activeRoutinesResult,
        totalInstancesResult,
        completedInstancesResult,
        overdueInstancesResult,
        todayInstancesResult,
        thisWeekInstancesResult,
      ] = await Promise.all([
        this.getActiveRoutinesCount(),
        this.getTotalInstancesCount(),
        this.getCompletedInstancesCount(),
        this.getOverdueInstancesCount(),
        this.getTodayInstancesCount(today, tomorrow),
        this.getThisWeekInstancesCount(today, nextWeek),
      ]);

      // Check for errors
      if (activeRoutinesResult.error) throw activeRoutinesResult.error;
      if (totalInstancesResult.error) throw totalInstancesResult.error;
      if (completedInstancesResult.error) throw completedInstancesResult.error;
      if (overdueInstancesResult.error) throw overdueInstancesResult.error;
      if (todayInstancesResult.error) throw todayInstancesResult.error;
      if (thisWeekInstancesResult.error) throw thisWeekInstancesResult.error;

      const stats: MaintenanceStats = {
        total: activeRoutinesResult.data || 0,
        completed: completedInstancesResult.data || 0,
        overdue: overdueInstancesResult.data || 0,
        dueToday: todayInstancesResult.data || 0,
        thisWeek: thisWeekInstancesResult.data || 0,
        completionRate: totalInstancesResult.data
          ? Math.round(
              ((completedInstancesResult.data || 0) /
                totalInstancesResult.data) *
                100
            )
          : 0,
        activeRoutines: activeRoutinesResult.data || 0,
        totalInstances: totalInstancesResult.data || 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error("Error fetching maintenance stats:", error);
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

  // Get count of active routines
  private static async getActiveRoutinesCount(): Promise<CountResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    const { count, error } = await supabase
      .from("maintenance_routines")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    return { data: count, error };
  }

  // Get total count of instances
  private static async getTotalInstancesCount(): Promise<CountResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    const { count, error } = await supabase
      .from("routine_instances")
      .select("id", { count: "exact", head: true });

    return { data: count, error };
  }

  // Get count of completed instances
  private static async getCompletedInstancesCount(): Promise<CountResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    const { count, error } = await supabase
      .from("routine_instances")
      .select("id", { count: "exact", head: true })
      .eq("is_completed", true);

    return { data: count, error };
  }

  // Get count of overdue instances
  private static async getOverdueInstancesCount(): Promise<CountResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    const { count, error } = await supabase
      .from("routine_instances")
      .select("id", { count: "exact", head: true })
      .eq("is_completed", false)
      .eq("is_overdue", true);

    return { data: count, error };
  }

  // Get count of instances due today
  private static async getTodayInstancesCount(
    today: Date,
    tomorrow: Date
  ): Promise<CountResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    const { count, error } = await supabase
      .from("routine_instances")
      .select("id", { count: "exact", head: true })
      .eq("is_completed", false)
      .gte("due_date", today.toISOString())
      .lt("due_date", tomorrow.toISOString());

    return { data: count, error };
  }

  // Get count of instances due this week
  private static async getThisWeekInstancesCount(
    today: Date,
    nextWeek: Date
  ): Promise<CountResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    const { count, error } = await supabase
      .from("routine_instances")
      .select("id", { count: "exact", head: true })
      .eq("is_completed", false)
      .gte("due_date", today.toISOString())
      .lt("due_date", nextWeek.toISOString());

    return { data: count, error };
  }
}
