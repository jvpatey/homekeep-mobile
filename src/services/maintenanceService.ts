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
  MaintenanceRoutineResponse,
  MaintenanceRoutinesResponse,
  RoutineInstanceResponse,
  RoutineInstancesResponse,
  MaintenanceTasksResponse,
  DeleteResponse,
  ServiceResponse,
  ServiceError,
} from "../types/maintenance";
import { MaintenanceRoutineService } from "./MaintenanceRoutineService";
import { MaintenanceInstanceService } from "./MaintenanceInstanceService";
import { MaintenanceTaskService } from "./MaintenanceTaskService";
import { MaintenanceStatsService } from "./MaintenanceStatsService";

// Main MaintenanceService that orchestrates other focused services
export class MaintenanceService {
  // ===== ROUTINE OPERATIONS =====
  static async createMaintenanceRoutine(
    routineData: CreateMaintenanceRoutineData
  ): Promise<MaintenanceRoutineResponse> {
    return MaintenanceRoutineService.createMaintenanceRoutine(routineData);
  }

  // Get all maintenance routines for the current user
  static async getMaintenanceRoutines(
    filters?: Partial<MaintenanceFilters>
  ): Promise<MaintenanceRoutinesResponse> {
    return MaintenanceRoutineService.getMaintenanceRoutines(filters);
  }

  // Update a maintenance routine
  static async updateMaintenanceRoutine(
    routineId: string,
    updates: UpdateMaintenanceRoutineData
  ): Promise<MaintenanceRoutineResponse> {
    return MaintenanceRoutineService.updateMaintenanceRoutine(
      routineId,
      updates
    );
  }

  // Delete a maintenance routine
  static async deleteMaintenanceRoutine(
    routineId: string
  ): Promise<DeleteResponse> {
    return MaintenanceRoutineService.deleteMaintenanceRoutine(routineId);
  }

  // ===== INSTANCE OPERATIONS =====

  // Complete a routine instance
  static async completeInstance(
    instanceId: string,
    notes?: string
  ): Promise<RoutineInstanceResponse> {
    return MaintenanceInstanceService.completeInstance(instanceId, notes);
  }

  // Uncomplete a routine instance
  static async uncompleteInstance(
    instanceId: string
  ): Promise<RoutineInstanceResponse> {
    return MaintenanceInstanceService.uncompleteInstance(instanceId);
  }

  // Update a routine instance
  static async updateInstance(
    instanceId: string,
    updates: UpdateRoutineInstanceData
  ): Promise<RoutineInstanceResponse> {
    return MaintenanceInstanceService.updateInstance(instanceId, updates);
  }

  // Bulk complete multiple instances
  static async bulkCompleteInstances(
    instanceIds: string[]
  ): Promise<RoutineInstancesResponse> {
    return MaintenanceInstanceService.bulkCompleteInstances(instanceIds);
  }

  // ===== TASK OPERATIONS =====

  // Get maintenance tasks (routines + instances) for dashboard
  static async getMaintenanceTasks(
    filters?: MaintenanceFilters
  ): Promise<MaintenanceTasksResponse> {
    return MaintenanceTaskService.getMaintenanceTasks(filters);
  }

  // Get upcoming maintenance tasks
  static async getUpcomingTasks(
    timeRange: number | "all" = 60
  ): Promise<MaintenanceTasksResponse> {
    return MaintenanceTaskService.getUpcomingTasks(timeRange);
  }

  // Get overdue maintenance tasks
  static async getOverdueTasks(
    lookbackDays: number | "all" = 14
  ): Promise<MaintenanceTasksResponse> {
    return MaintenanceTaskService.getOverdueTasks(lookbackDays);
  }

  // Get completed maintenance tasks
  static async getCompletedTasks(
    lookbackDays: number | "all" = 14
  ): Promise<MaintenanceTasksResponse> {
    return MaintenanceTaskService.getCompletedTasks(lookbackDays);
  }

  // Get tasks by category
  static async getTasksByCategory(
    category: MaintenanceCategory
  ): Promise<MaintenanceTasksResponse> {
    return MaintenanceTaskService.getTasksByCategory(category);
  }

  // Get tasks by priority
  static async getTasksByPriority(
    priority: Priority
  ): Promise<MaintenanceTasksResponse> {
    return MaintenanceTaskService.getTasksByPriority(priority);
  }

  // Get next open instance for a routine
  static async getNextOpenInstanceForRoutine(routineId: string) {
    return MaintenanceTaskService.getNextOpenInstanceForRoutine(routineId);
  }

  // Get tasks due in a specific date range
  static async getTasksInDateRange(
    startDate: string,
    endDate: string,
    includeCompleted: boolean = true
  ): Promise<MaintenanceTasksResponse> {
    return MaintenanceTaskService.getTasksInDateRange(
      startDate,
      endDate,
      includeCompleted
    );
  }

  // ===== STATISTICS =====

  // Get maintenance statistics for dashboard
  static async getMaintenanceStats(): Promise<
    ServiceResponse<MaintenanceStats>
  > {
    return MaintenanceStatsService.getMaintenanceStats();
  }

  // ===== BULK OPERATIONS =====

  // Delete all maintenance data for a user
  static async deleteAllMaintenanceData(): Promise<{
    error: ServiceError | null;
    routinesDeleted?: number;
    instancesDeleted?: number;
  }> {
    try {
      // Get user's routine IDs
      const { data: routineIds, error: routineIdsError } =
        await MaintenanceRoutineService.getUserRoutineIds();

      if (routineIdsError) throw routineIdsError;
      if (!routineIds || routineIds.length === 0) {
        return { error: null, routinesDeleted: 0, instancesDeleted: 0 };
      }

      // Delete instances first
      const { error: instancesError, instancesDeleted } =
        await MaintenanceInstanceService.deleteInstancesByRoutineIds(
          routineIds
        );

      if (instancesError) throw instancesError;

      // Delete all routines for this user
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { error: routinesError } = await supabase
        .from("maintenance_routines")
        .delete()
        .in("id", routineIds);

      if (routinesError) throw routinesError;

      return {
        error: null,
        routinesDeleted: routineIds.length,
        instancesDeleted: instancesDeleted || 0,
      };
    } catch (error) {
      console.error("Error deleting all maintenance data:", error);
      return {
        error: {
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          details: String(error),
        },
      };
    }
  }

  // ===== UTILITY OPERATIONS =====
  // Update overdue status for all routine instances
  static async updateOverdueStatus(): Promise<ServiceResponse<null>> {
    return MaintenanceTaskService.updateOverdueStatus();
  }

  // ===== ACCOUNT DELETION =====
  // Delete user account completely (profile + auth + all data)
  static async deleteUserAccount(): Promise<{
    error: ServiceError | null;
    success: boolean;
  }> {
    if (!supabase) {
      return {
        error: { message: "Supabase not configured" },
        success: false,
      };
    }

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          error: { message: "User not authenticated" },
          success: false,
        };
      }

      console.log("Starting account deletion for user:", user.id);

      // Call the Supabase Edge Function to delete the user and all data
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        return {
          error: { message: "No valid session found" },
          success: false,
        };
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error deleting user account:", errorData);
        return {
          error: {
            message: errorData.error || "Failed to delete user account",
            details: errorData.message,
          },
          success: false,
        };
      }

      const result = await response.json();
      console.log("Account deletion completed successfully:", result);

      return { error: null, success: true };
    } catch (error) {
      console.error("Error deleting user account:", error);
      return {
        error: {
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          details: String(error),
        },
        success: false,
      };
    }
  }
}
