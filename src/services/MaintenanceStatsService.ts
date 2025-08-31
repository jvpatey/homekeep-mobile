import { supabase } from "../context/AuthContext";
import { MaintenanceStats } from "../types/maintenance";
import { addDays, startOfDay } from "date-fns";

export class MaintenanceStatsService {
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
        total: activeRoutinesResult.count || 0,
        completed: completedInstancesResult.count || 0,
        overdue: overdueInstancesResult.count || 0,
        dueToday: todayInstancesResult.count || 0,
        thisWeek: thisWeekInstancesResult.count || 0,
        completionRate: totalInstancesResult.count
          ? Math.round(
              ((completedInstancesResult.count || 0) /
                totalInstancesResult.count) *
                100
            )
          : 0,
        activeRoutines: activeRoutinesResult.count || 0,
        totalInstances: totalInstancesResult.count || 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error("Error fetching maintenance stats:", error);
      return { data: null, error };
    }
  }

  // Get count of active routines
  private static async getActiveRoutinesCount(): Promise<{
    count: number | null;
    error: any;
  }> {
    if (!supabase) {
      return { count: null, error: { message: "Supabase not configured" } };
    }

    const { count, error } = await supabase
      .from("maintenance_routines")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    return { count, error };
  }

  // Get total count of instances
  private static async getTotalInstancesCount(): Promise<{
    count: number | null;
    error: any;
  }> {
    if (!supabase) {
      return { count: null, error: { message: "Supabase not configured" } };
    }

    const { count, error } = await supabase
      .from("routine_instances")
      .select("id", { count: "exact", head: true });

    return { count, error };
  }

  // Get count of completed instances
  private static async getCompletedInstancesCount(): Promise<{
    count: number | null;
    error: any;
  }> {
    if (!supabase) {
      return { count: null, error: { message: "Supabase not configured" } };
    }

    const { count, error } = await supabase
      .from("routine_instances")
      .select("id", { count: "exact", head: true })
      .eq("is_completed", true);

    return { count, error };
  }

  // Get count of overdue instances
  private static async getOverdueInstancesCount(): Promise<{
    count: number | null;
    error: any;
  }> {
    if (!supabase) {
      return { count: null, error: { message: "Supabase not configured" } };
    }

    const { count, error } = await supabase
      .from("routine_instances")
      .select("id", { count: "exact", head: true })
      .eq("is_completed", false)
      .eq("is_overdue", true);

    return { count, error };
  }

  // Get count of instances due today
  private static async getTodayInstancesCount(
    today: Date,
    tomorrow: Date
  ): Promise<{ count: number | null; error: any }> {
    if (!supabase) {
      return { count: null, error: { message: "Supabase not configured" } };
    }

    const { count, error } = await supabase
      .from("routine_instances")
      .select("id", { count: "exact", head: true })
      .eq("is_completed", false)
      .gte("due_date", today.toISOString())
      .lt("due_date", tomorrow.toISOString());

    return { count, error };
  }

  // Get count of instances due this week
  private static async getThisWeekInstancesCount(
    today: Date,
    nextWeek: Date
  ): Promise<{ count: number | null; error: any }> {
    if (!supabase) {
      return { count: null, error: { message: "Supabase not configured" } };
    }

    const { count, error } = await supabase
      .from("routine_instances")
      .select("id", { count: "exact", head: true })
      .eq("is_completed", false)
      .gte("due_date", today.toISOString())
      .lt("due_date", nextWeek.toISOString());

    return { count, error };
  }
}
