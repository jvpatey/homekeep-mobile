import { addDays, parseISO, isValid } from "date-fns";
import { supabase } from "../lib/supabase";
import {
  CreateRoutineInstanceData,
  RoutineInstance,
  SkipRoutineInstanceParams,
  SkipRoutineInstanceResponse,
  UpdateRoutineInstanceData,
  RoutineInstanceResponse,
  RoutineInstancesResponse,
  DeleteResponse,
} from "../types/maintenance";

function toServiceError(error: unknown) {
  return {
    message:
      error instanceof Error ? error.message : "Unknown error occurred",
    details: String(error),
  };
}

function isMissingCompleterColumn(error: { message?: string } | null): boolean {
  const message = error?.message ?? "";
  return (
    /completed_by/i.test(message) &&
    /column|schema|could not find/i.test(message)
  );
}

async function currentCompleter(): Promise<{
  id: string | null;
  name: string | null;
}> {
  if (!supabase) return { id: null, name: null };
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { id: null, name: null };
  const metaName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  return {
    id: user.id,
    name: metaName || user.email?.trim() || null,
  };
}

/** Next occurrence due date at local noon (matches start_date reschedule in useTasks). */
export function computeNextOccurrenceDueDate(
  dueDate: string,
  intervalDays: number
): Date {
  const base = parseISO(dueDate);
  const start = isValid(base) ? base : new Date(dueDate);
  const next = addDays(start, intervalDays);
  next.setHours(12, 0, 0, 0);
  return next;
}

export class MaintenanceInstanceService {
  // Complete a routine instance
  static async completeInstance(
    instanceId: string,
    extras?: {
      notes?: string;
      cost_amount?: number | null;
      labor_type?: "diy" | "hired" | null;
      photo_storage_path?: string | null;
    }
  ): Promise<RoutineInstanceResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const now = new Date().toISOString();
      const completer = await currentCompleter();
      const updateData: UpdateRoutineInstanceData = {
        is_completed: true,
        completed_at: now,
        completed_by: completer.id,
        completed_by_name: completer.name,
      };

      if (extras?.notes) {
        updateData.notes = extras.notes;
      }
      if (extras?.cost_amount != null) {
        updateData.cost_amount = extras.cost_amount;
      }
      if (extras?.labor_type) {
        updateData.labor_type = extras.labor_type;
      }
      if (extras?.photo_storage_path) {
        updateData.photo_storage_path = extras.photo_storage_path;
      }

      let { data, error } = await supabase
        .from("routine_instances")
        .update(updateData)
        .eq("id", instanceId)
        .select()
        .single();

      if (error && isMissingCompleterColumn(error)) {
        const {
          completed_by: _completedBy,
          completed_by_name: _completedByName,
          ...withoutCompleter
        } = updateData;
        const retry = await supabase
          .from("routine_instances")
          .update(withoutCompleter)
          .eq("id", instanceId)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

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
      let { data, error } = await supabase
        .from("routine_instances")
        .update({
          is_completed: false,
          completed_at: null,
          completed_by: null,
          completed_by_name: null,
        })
        .eq("id", instanceId)
        .select()
        .single();

      if (error && isMissingCompleterColumn(error)) {
        const retry = await supabase
          .from("routine_instances")
          .update({
            is_completed: false,
            completed_at: null,
          })
          .eq("id", instanceId)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

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
      const completer = await currentCompleter();

      let { data, error } = await supabase
        .from("routine_instances")
        .update({
          is_completed: true,
          completed_at: now,
          completed_by: completer.id,
          completed_by_name: completer.name,
        })
        .in("id", instanceIds)
        .eq("is_completed", false)
        .select();

      if (error && isMissingCompleterColumn(error)) {
        const retry = await supabase
          .from("routine_instances")
          .update({
            is_completed: true,
            completed_at: now,
          })
          .in("id", instanceIds)
          .eq("is_completed", false)
          .select();
        data = retry.data;
        error = retry.error;
      }

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

  static async deleteInstance(instanceId: string): Promise<DeleteResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const { error } = await supabase
        .from("routine_instances")
        .delete()
        .eq("id", instanceId);

      if (error) throw error;

      return { data: null, error: null };
    } catch (error) {
      console.error("Error deleting instance:", error);
      return { data: null, error: toServiceError(error) };
    }
  }

  static async createInstance(
    payload: CreateRoutineInstanceData
  ): Promise<RoutineInstanceResponse> {
    if (!supabase) {
      return { data: null, error: { message: "Supabase not configured" } };
    }

    try {
      const now = new Date().toISOString();
      const row = {
        routine_id: payload.routine_id,
        due_date: payload.due_date,
        is_completed: payload.is_completed ?? false,
        is_overdue: payload.is_overdue ?? false,
        created_at: now,
      };

      const { data, error } = await supabase
        .from("routine_instances")
        .insert([row])
        .select()
        .single();

      if (error) throw error;

      return { data: data as RoutineInstance, error: null };
    } catch (error) {
      console.error("Error creating instance:", error);
      return { data: null, error: toServiceError(error) };
    }
  }

  static async skipRoutineInstance(
    params: SkipRoutineInstanceParams
  ): Promise<SkipRoutineInstanceResponse> {
    const { instanceId, routineId, dueDate, intervalDays } = params;

    if (intervalDays <= 0) {
      return {
        data: null,
        error: { message: "Cannot skip a non-recurring task occurrence" },
      };
    }

    const nextDue = computeNextOccurrenceDueDate(dueDate, intervalDays);
    const nextDueIso = nextDue.toISOString();

    const createResult = await this.createInstance({
      routine_id: routineId,
      due_date: nextDueIso,
      is_completed: false,
      is_overdue: false,
    });

    if (createResult.error) {
      return { data: null, error: createResult.error };
    }

    const deleteResult = await this.deleteInstance(instanceId);
    if (deleteResult.error) {
      console.error(
        "Skip: created next occurrence but failed to delete old:",
        deleteResult.error
      );
    }

    return {
      data: createResult.data,
      error: null,
      nextDueDate: nextDueIso,
    };
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
