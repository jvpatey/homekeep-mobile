// deno-lint-ignore-file no-explicit-any

export type AiFeature = "scan_nameplate" | "assistant_chat" | "extract_inspection";

export interface FeaturePolicy {
  /** Lifetime successful calls for free users; 0 = Plus only. */
  freeLifetime: number;
  /** Rolling 24h cap for Plus users (cost guard). */
  plusDaily: number;
}

export const AI_POLICY: Record<AiFeature, FeaturePolicy> = {
  scan_nameplate: { freeLifetime: 3, plusDaily: 30 },
  assistant_chat: { freeLifetime: 0, plusDaily: 60 },
  extract_inspection: { freeLifetime: 0, plusDaily: 5 },
};

export type QuotaDecision =
  | { ok: true; isPlus: boolean; remainingAfter: number | null }
  | { ok: false; code: "plus_required" | "quota_exhausted" | "rate_limited" };

export async function checkQuota(
  supabase: any,
  userId: string,
  feature: AiFeature
): Promise<QuotaDecision> {
  const { data, error } = await supabase
    .rpc("ai_quota_status", { p_user_id: userId, p_feature: feature })
    .single();
  if (error) throw error;

  const policy = AI_POLICY[feature];
  const isPlus = data?.is_plus === true;
  const usedTotal = Number(data?.used_total ?? 0);
  const usedToday = Number(data?.used_today ?? 0);

  if (isPlus) {
    if (usedToday >= policy.plusDaily) return { ok: false, code: "rate_limited" };
    return { ok: true, isPlus, remainingAfter: null };
  }
  if (policy.freeLifetime === 0) return { ok: false, code: "plus_required" };
  if (usedTotal >= policy.freeLifetime) {
    return { ok: false, code: "quota_exhausted" };
  }
  return {
    ok: true,
    isPlus,
    remainingAfter: Math.max(0, policy.freeLifetime - usedTotal - 1),
  };
}

/** Free calls left for a feature without consuming one (null = Plus). */
export async function remainingFor(
  supabase: any,
  userId: string,
  feature: AiFeature
): Promise<number | null> {
  const { data, error } = await supabase
    .rpc("ai_quota_status", { p_user_id: userId, p_feature: feature })
    .single();
  if (error) throw error;
  if (data?.is_plus === true) return null;
  return Math.max(0, AI_POLICY[feature].freeLifetime - Number(data?.used_total ?? 0));
}

export async function logUsage(
  supabase: any,
  row: {
    userId: string;
    householdId: string | null;
    feature: AiFeature;
    status: "ok" | "error" | "rejected";
    model?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
  }
): Promise<void> {
  const { error } = await supabase.from("ai_usage").insert({
    user_id: row.userId,
    household_id: row.householdId,
    feature: row.feature,
    status: row.status,
    model: row.model ?? null,
    input_tokens: row.inputTokens ?? null,
    output_tokens: row.outputTokens ?? null,
  });
  if (error) console.warn("ai_usage insert failed", error);
}
