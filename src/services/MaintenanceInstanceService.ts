import { supabase } from "../context/AuthContext";
import {
  RoutineInstance,
  UpdateRoutineInstanceData,
  RoutineInstanceResponse,
  RoutineInstancesResponse,
  DeleteResponse,
  ServiceResponse,
} from "../types/maintenance";

export class MaintenanceInstanceService {
  // Complete a routine instance
  static async completeInstance(
    instanceId: string,
    notes?: string
  ): Promise<RoutineInstanceResponse> {
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

  // Uncomplete a routine instance
  static async uncompleteInstance(
    instanceId: string
  ): Promise<RoutineInstanceResponse> {
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

  // Update a routine instance
  static async updateInstance(
    instanceId: string,
    updates: UpdateRoutineInstanceData
  ): Promise<RoutineInstanceResponse> {
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

  // Bulk complete multiple instances
  static async bulkCompleteInstances(
    instanceIds: string[]
  ): Promise<RoutineInstancesResponse> {
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

  // Delete instances by routine IDs
  static async deleteInstancesByRoutineIds(
    routineIds: string[]
  ): Promise<DeleteResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    if (!routineIds.length) {
      return { data: null, error: null, instancesDeleted: 0 };
    }

    try {
      // Count instances first
      const { count: instCount, error: instCountErr } = await supabase
        .from("routine_instances")
        .select("id", { count: "exact", head: true })
        .in("routine_id", routineIds);
      if (instCountErr) throw instCountErr;

      // Delete instances
      const { error: instErr } = await supabase
        .from("routine_instances")
        .delete()
        .in("routine_id", routineIds);
      if (instErr) throw instErr;

      return {
        data: null,
        error: null,
        instancesDeleted: instCount || 0,
      };
    } catch (error) {
      console.error("Error deleting instances by routine IDs:", error);
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
}
