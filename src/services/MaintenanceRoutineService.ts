import { supabase } from "../lib/supabase";
import { getViewerHouseholdId } from "./householdScope";
import {
  MaintenanceRoutine,
  CreateMaintenanceRoutineData,
  UpdateMaintenanceRoutineData,
  MaintenanceFilters,
  MaintenanceRoutineResponse,
  MaintenanceRoutinesResponse,
  DeleteResponse,
  ServiceResponse,
} from "../types/maintenance";

export class MaintenanceRoutineService {
  // Create a new maintenance routine
  static async createMaintenanceRoutine(
    routineData: CreateMaintenanceRoutineData
  ): Promise<MaintenanceRoutineResponse> {
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

      const householdId = await getViewerHouseholdId();
      const routineWithUserId = {
        ...routineData,
        user_id: user.id,
        household_id: householdId,
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

  /** Insert multiple routines in one request (atomic single-statement insert). */
  static async createMaintenanceRoutines(
    routinesData: CreateMaintenanceRoutineData[]
  ): Promise<MaintenanceRoutinesResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    if (routinesData.length === 0) {
      return { data: [], error: null };
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const now = new Date().toISOString();
      const householdId = await getViewerHouseholdId();
      const rows = routinesData.map((routineData) => ({
        ...routineData,
        user_id: user.id,
        household_id: householdId,
        created_at: now,
        updated_at: now,
      }));

      const { data, error } = await supabase
        .from("maintenance_routines")
        .insert(rows)
        .select();

      if (error) throw error;

      return { data: data ?? [], error: null };
    } catch (error) {
      console.error("Error creating maintenance routines:", error);
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

  // Get all maintenance routines for the current user
  static async getMaintenanceRoutines(
    filters?: Partial<MaintenanceFilters>
  ): Promise<MaintenanceRoutinesResponse> {
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

      const householdId = await getViewerHouseholdId();
      let query = supabase
        .from("maintenance_routines")
        .select("*")
        .order("created_at", { ascending: false });

      if (householdId) {
        query = query.eq("household_id", householdId);
      } else {
        query = query.eq("user_id", user.id);
      }

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

  // Update a maintenance routine
  static async updateMaintenanceRoutine(
    routineId: string,
    updates: UpdateMaintenanceRoutineData
  ): Promise<MaintenanceRoutineResponse> {
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

  // Delete a maintenance routine
  static async deleteMaintenanceRoutine(
    routineId: string
  ): Promise<DeleteResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const { error } = await supabase
        .from("maintenance_routines")
        .delete()
        .eq("id", routineId);

      if (error) throw error;

      return { data: null, error: null };
    } catch (error) {
      console.error("Error deleting maintenance routine:", error);
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

  // Get user's routine IDs for bulk operations
  static async getUserRoutineIds(): Promise<ServiceResponse<string[]>> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error("Not authenticated");

      const { data, error } = await supabase
        .from("maintenance_routines")
        .select("id")
        .eq("user_id", user.id);

      if (error) throw error;

      const routineIds = (data || []).map((r: { id: string }) => r.id);
      return { data: routineIds, error: null };
    } catch (error) {
      console.error("Error fetching user routine IDs:", error);
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
