// deno-lint-ignore-file no-explicit-any

export async function shouldSendNotification(
  supabase: any,
  userId: string,
  category: string,
  type: string
): Promise<boolean> {
  try {
    const { data: preferences, error } = await supabase
      .from("notification_preferences")
      .select(`enabled, ${type}`)
      .eq("user_id", userId)
      .eq("category", category)
      .single();
    if (error || !preferences) return false;
    return preferences.enabled && preferences[type];
  } catch {
    return false;
  }
}
