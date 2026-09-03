// deno-lint-ignore-file no-explicit-any

export async function tryRecordDelivery(
  supabase: any,
  userId: string,
  dedupeKey: string,
  notificationType: string
): Promise<boolean> {
  const { error } = await supabase.from("notification_deliveries").insert({
    user_id: userId,
    dedupe_key: dedupeKey,
    notification_type: notificationType,
  });

  if (!error) return true;

  if (error.code === "23505") {
    return false;
  }

  console.error("Dedupe insert error:", error);
  return false;
}

export async function releaseDelivery(
  supabase: any,
  userId: string,
  dedupeKey: string
): Promise<void> {
  const { error } = await supabase
    .from("notification_deliveries")
    .delete()
    .eq("user_id", userId)
    .eq("dedupe_key", dedupeKey);
  if (error) {
    console.error("Dedupe release error:", error);
  }
}

export function dedupeKeyUpcoming(userId: string, localDate: string): string {
  return `upcoming:${userId}:${localDate}`;
}

export function dedupeKeyMorning(userId: string, localDate: string): string {
  return `morning:${userId}:${localDate}`;
}

export function dedupeKeyHouseholdJoin(
  householdId: string,
  actorId: string
): string {
  return `household_join:${householdId}:${actorId}`;
}

export function dedupeKeyHouseholdLeave(
  householdId: string,
  actorId: string
): string {
  return `household_leave:${householdId}:${actorId}`;
}
