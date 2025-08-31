import { supabase } from "../context/AuthContext";
import {
  MaintenanceRoutine,
  CreateMaintenanceRoutineData,
  UpdateMaintenanceRoutineData,
  MaintenanceFilters,
} from "../types/maintenance";

export class MaintenanceRoutineService {
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

  // Get user's routine IDs for bulk operations
  static async getUserRoutineIds(): Promise<{
    data: string[] | null;
    error: any;
  }> {
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

      const routineIds = (data || []).map((r: any) => r.id);
      return { data: routineIds, error: null };
    } catch (error) {
      console.error("Error fetching user routine IDs:", error);
      return { data: null, error };
    }
  }
}
