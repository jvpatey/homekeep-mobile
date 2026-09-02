import { supabase } from "../lib/supabase";

/** Current user's household_id, or null if they are not in a household. */
export async function getViewerHouseholdId(): Promise<string | null> {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .maybeSingle();
  return typeof data?.household_id === "string" ? data.household_id : null;
}
