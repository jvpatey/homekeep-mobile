import { supabase } from "../lib/supabase";
import { getViewerHouseholdId } from "./householdScope";
import { HomeContact, HomeContactInput } from "../types/homeContact";
import { logServiceFailure } from "../utils/serviceError";

type Result<T> = { data: T | null; error: { message: string } | null };

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toRow(input: HomeContactInput) {
  return {
    name: input.name.trim(),
    company: clean(input.company),
    trade: input.trade ?? null,
    phone: clean(input.phone),
    email: clean(input.email),
    website: clean(input.website),
    notes: clean(input.notes),
  };
}

function isMissingTable(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    (/home_contacts/i.test(error?.message ?? "") &&
      /does not exist|could not find/i.test(error?.message ?? ""))
  );
}

const MISSING_MESSAGE =
  "Pros aren't available yet. The app's database needs an update.";

/** Trusted pros, shared across the household like equipment. */
export class HomeContactService {
  static async list(): Promise<Result<HomeContact[]>> {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not signed in" } };

    const householdId = await getViewerHouseholdId();
    let query = supabase
      .from("home_contacts")
      .select("*")
      .order("last_used_at", { ascending: false, nullsFirst: false })
      .order("name", { ascending: true });
    query = householdId
      ? query.eq("household_id", householdId)
      : query.eq("user_id", user.id);

    const { data, error } = await query;
    if (error) {
      if (isMissingTable(error)) return { data: [], error: null };
      logServiceFailure("Error listing pros:", error);
      return { data: null, error: { message: "Couldn't load your pros" } };
    }
    return { data: (data ?? []) as HomeContact[], error: null };
  }

  static async create(input: HomeContactInput): Promise<Result<HomeContact>> {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not signed in" } };

    const householdId = await getViewerHouseholdId();
    const { data, error } = await supabase
      .from("home_contacts")
      .insert({ ...toRow(input), user_id: user.id, household_id: householdId })
      .select("*")
      .single();
    if (error) {
      logServiceFailure("Error creating pro:", error);
      return {
        data: null,
        error: {
          message: isMissingTable(error)
            ? MISSING_MESSAGE
            : "Couldn't save this pro",
        },
      };
    }
    return { data: data as HomeContact, error: null };
  }

  static async update(
    id: string,
    input: HomeContactInput
  ): Promise<Result<HomeContact>> {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("home_contacts")
      .update(toRow(input))
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      logServiceFailure("Error updating pro:", error);
      return { data: null, error: { message: "Couldn't save changes" } };
    }
    return { data: data as HomeContact, error: null };
  }

  static async remove(
    id: string
  ): Promise<{ error: { message: string } | null }> {
    if (!supabase) return { error: { message: "Supabase not configured" } };
    const { error } = await supabase
      .from("home_contacts")
      .delete()
      .eq("id", id);
    if (error) {
      logServiceFailure("Error deleting pro:", error);
      return { error: { message: "Couldn't delete this pro" } };
    }
    return { error: null };
  }

  /** Keeps recently hired pros at the top of pickers. Best effort. */
  static async touch(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from("home_contacts")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", id);
    if (error && !isMissingTable(error)) {
      logServiceFailure("Error bumping pro last_used_at:", error);
    }
  }
}
