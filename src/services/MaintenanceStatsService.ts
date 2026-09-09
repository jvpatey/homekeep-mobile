import { supabase } from "../lib/supabase";
import {
  MaintenanceStats,
  ServiceResponse,
  CountResponse,
} from "../types/maintenance";
import { addDays, startOfDay } from "date-fns";
import { toServiceError } from "../utils/serviceError";

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

      const takeCount = (result: CountResponse, label: string): number => {
        if (result.error) {
          console.warn(
            `Maintenance stats (${label}) failed:`,
            toServiceError(result.error)
          );
          return 0;
        }
        return result.data ?? 0;
      };

      const activeRoutines = takeCount(activeRoutinesResult, "active routines");
      const totalInstances = takeCount(totalInstancesResult, "total instances");
      const completed = takeCount(completedInstancesResult, "completed");
      const overdue = takeCount(overdueInstancesResult, "overdue");
      const dueToday = takeCount(todayInstancesResult, "due today");
      const thisWeek = takeCount(thisWeekInstancesResult, "this week");

      const stats: MaintenanceStats = {
        total: activeRoutines,
        completed,
        overdue,
        dueToday,
        thisWeek,
        completionRate: totalInstances
          ? Math.round((completed / totalInstances) * 100)
          : 0,
        activeRoutines,
        totalInstances,
      };

      return { data: stats, error: null };
    } catch (error) {
      const serviceError = toServiceError(
        error,
        "Couldn't load maintenance stats"
      );
      console.error("Error fetching maintenance stats:", serviceError);
      return {
        data: null,
        error: serviceError,
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
