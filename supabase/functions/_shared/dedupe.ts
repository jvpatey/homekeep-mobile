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

export function dedupeKeyDueSoon(instanceId: string, localDate: string): string {
  return `due_soon:${instanceId}:${localDate}`;
}

export function dedupeKeyOverdue(instanceId: string, localDate: string): string {
  return `overdue:${instanceId}:${localDate}`;
}

export function dedupeKeyDailyDigest(userId: string, localDate: string): string {
  return `daily_digest:${userId}:${localDate}`;
}

export function dedupeKeyWeeklySummary(
  userId: string,
  weekStart: string
): string {
  return `weekly_summary:${userId}:${weekStart}`;
}
