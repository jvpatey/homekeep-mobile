// deno-lint-ignore-file no-explicit-any

export type PreferenceFlag =
  | "due_soon_reminder"
  | "overdue_reminder"
  | "weekly_summary";

export async function isTypeEnabled(
  supabase: any,
  userId: string,
  type: PreferenceFlag
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("notification_preferences")
      .select(`enabled, ${type}`)
      .eq("user_id", userId)
      .eq("enabled", true)
      .eq(type, true)
      .limit(1);
    if (error || !data?.length) return false;
    return true;
  } catch {
    return false;
  }
}

export async function isMasterEnabled(
  supabase: any,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("enabled")
      .eq("user_id", userId)
      .eq("enabled", true)
      .limit(1);
    if (error || !data?.length) return false;
    return true;
  } catch {
    return false;
  }
}
