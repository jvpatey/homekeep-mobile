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
import { MaintenanceRoutineService } from "./MaintenanceRoutineService";
import { MaintenanceInstanceService } from "./MaintenanceInstanceService";
import { MaintenanceTaskService } from "./MaintenanceTaskService";
import { MaintenanceStatsService } from "./MaintenanceStatsService";

// Main MaintenanceService that orchestrates other focused services
export class MaintenanceService {
  // ===== ROUTINE OPERATIONS =====
  static async createMaintenanceRoutine(
    routineData: CreateMaintenanceRoutineData
  ): Promise<{ data: MaintenanceRoutine | null; error: any }> {
    return MaintenanceRoutineService.createMaintenanceRoutine(routineData);
  }

  // Get all maintenance routines for the current user
  static async getMaintenanceRoutines(
    filters?: Partial<MaintenanceFilters>
  ): Promise<{ data: MaintenanceRoutine[] | null; error: any }> {
    return MaintenanceRoutineService.getMaintenanceRoutines(filters);
  }

  // Update a maintenance routine
  static async updateMaintenanceRoutine(
    routineId: string,
    updates: UpdateMaintenanceRoutineData
  ): Promise<{ data: MaintenanceRoutine | null; error: any }> {
    return MaintenanceRoutineService.updateMaintenanceRoutine(
      routineId,
      updates
    );
  }

  // Delete a maintenance routine
  static async deleteMaintenanceRoutine(
    routineId: string
  ): Promise<{ error: any }> {
    return MaintenanceRoutineService.deleteMaintenanceRoutine(routineId);
  }

  // ===== INSTANCE OPERATIONS =====

  // Complete a routine instance
  static async completeInstance(
    instanceId: string,
    notes?: string
  ): Promise<{ data: RoutineInstance | null; error: any }> {
    return MaintenanceInstanceService.completeInstance(instanceId, notes);
  }

  // Uncomplete a routine instance
  static async uncompleteInstance(
    instanceId: string
  ): Promise<{ data: RoutineInstance | null; error: any }> {
    return MaintenanceInstanceService.uncompleteInstance(instanceId);
  }

  // Update a routine instance
  static async updateInstance(
    instanceId: string,
    updates: UpdateRoutineInstanceData
  ): Promise<{ data: RoutineInstance | null; error: any }> {
    return MaintenanceInstanceService.updateInstance(instanceId, updates);
  }

  // Bulk complete multiple instances
  static async bulkCompleteInstances(
    instanceIds: string[]
  ): Promise<{ data: RoutineInstance[] | null; error: any }> {
    return MaintenanceInstanceService.bulkCompleteInstances(instanceIds);
  }

  // ===== TASK OPERATIONS =====

  // Get maintenance tasks (routines + instances) for dashboard
  static async getMaintenanceTasks(
    filters?: MaintenanceFilters
  ): Promise<{ data: MaintenanceTask[] | null; error: any }> {
    return MaintenanceTaskService.getMaintenanceTasks(filters);
  }

  // Get upcoming maintenance tasks
  static async getUpcomingTasks(
    timeRange: number | "all" = 60
  ): Promise<{ data: MaintenanceTask[] | null; error: any }> {
    return MaintenanceTaskService.getUpcomingTasks(timeRange);
  }

  // Get overdue maintenance tasks
  static async getOverdueTasks(
    lookbackDays: number | "all" = 14
  ): Promise<{ data: MaintenanceTask[] | null; error: any }> {
    return MaintenanceTaskService.getOverdueTasks(lookbackDays);
  }

  // Get completed maintenance tasks
  static async getCompletedTasks(
    lookbackDays: number | "all" = 14
  ): Promise<{ data: MaintenanceTask[] | null; error: any }> {
    return MaintenanceTaskService.getCompletedTasks(lookbackDays);
  }

  // Get tasks by category
  static async getTasksByCategory(
    category: MaintenanceCategory
  ): Promise<{ data: MaintenanceTask[] | null; error: any }> {
    return MaintenanceTaskService.getTasksByCategory(category);
  }

  // Get tasks by priority
  static async getTasksByPriority(
    priority: Priority
  ): Promise<{ data: MaintenanceTask[] | null; error: any }> {
    return MaintenanceTaskService.getTasksByPriority(priority);
  }

  // Get tasks due in a specific date range
  static async getTasksInDateRange(
    startDate: string,
    endDate: string,
    includeCompleted: boolean = true
  ): Promise<{ data: MaintenanceTask[] | null; error: any }> {
    return MaintenanceTaskService.getTasksInDateRange(
      startDate,
      endDate,
      includeCompleted
    );
  }

  // ===== STATISTICS =====

  // Get maintenance statistics for dashboard
  static async getMaintenanceStats(): Promise<{
    data: MaintenanceStats | null;
    error: any;
  }> {
    return MaintenanceStatsService.getMaintenanceStats();
  }

  // ===== BULK OPERATIONS =====

  // Delete all maintenance data for a user
  static async deleteAllMaintenanceData(): Promise<{
    error: any;
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
      return { error };
    }
  }
}
