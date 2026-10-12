import { supabase } from "../lib/supabase";
import { getViewerHouseholdId } from "./householdScope";
import { EquipmentRecall } from "../types/equipmentRecall";
import { logServiceFailure } from "../utils/serviceError";

type Result<T> = { data: T | null; error: { message: string } | null };

function isMissingTable(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    (/equipment_recalls/i.test(error?.message ?? "") &&
      /does not exist|could not find/i.test(error?.message ?? ""))
  );
}

/** Recalls are written by the server; the app only reads and dismisses. */
export class EquipmentRecallService {
  /** Open (undismissed) recalls for the household, newest first. */
  static async listOpen(): Promise<Result<EquipmentRecall[]>> {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not signed in" } };

    const householdId = await getViewerHouseholdId();
    let query = supabase
      .from("equipment_recalls")
      .select("*")
      .is("dismissed_at", null)
      .order("created_at", { ascending: false });
    query = householdId
      ? query.eq("household_id", householdId)
      : query.eq("user_id", user.id);

    const { data, error } = await query;
    if (error) {
      if (isMissingTable(error)) return { data: [], error: null };
      logServiceFailure("Error listing recalls:", error);
      return { data: null, error: { message: "Couldn't check for recalls" } };
    }
    return { data: (data ?? []) as EquipmentRecall[], error: null };
  }

  static async dismiss(id: string): Promise<Result<true>> {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { error } = await supabase
      .from("equipment_recalls")
      .update({ dismissed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      logServiceFailure("Error dismissing recall:", error);
      return { data: null, error: { message: "Couldn't dismiss the recall" } };
    }
    return { data: true, error: null };
  }
}
