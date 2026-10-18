import { useCallback } from "react";
import { useSubscription } from "../context/SubscriptionContext";
import { useProfile } from "../context/ProfileContext";
import { FREE_ACTION_LIMIT } from "../lib/purchases";

/** Opens HomeKeep + paywall when needed. Returns true if entitled afterward. */
export function useRequirePlus() {
  const { isPlus, presentPaywall } = useSubscription();

  return useCallback(async () => {
    if (isPlus) return true;
    return presentPaywall();
  }, [isPlus, presentPaywall]);
}

/**
 * Allow Plus users freely, or unpaid users who still have free actions.
 * Does NOT consume — call `consume` after client-gated mutations (skip/pause),
 * or `sync` after server-enforced complete/create.
 */
export function useCanUseFreeAction(): boolean {
  const { isPlus } = useSubscription();
  const { profile } = useProfile();
  if (isPlus) return true;
  return (profile?.free_actions_used ?? 0) < FREE_ACTION_LIMIT;
}

/** True when Postgres raised our plus_required schedule gate. */
export function isPlusRequiredError(error: unknown): boolean {
  const message =
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
      ? (error as { message: string }).message
      : typeof error === "string"
        ? error
        : "";
  return /plus_required/i.test(message);
}

/**
 * Gate schedule mutations: Plus always; otherwise free-action quota.
 *
 * `requireAccess` checks quota (does not consume).
 * `consume` increments via RPC — use for skip/pause/resume/edit (client-only gates).
 * `sync` re-reads the counter after server triggers consume on complete/create.
 */
export function useRequirePlusOrFreeAction() {
  const { isPlus, presentPaywall } = useSubscription();
  const { profile, consumeFreeAction, refreshFreeActions } = useProfile();

  const requireAccess = useCallback(async (): Promise<boolean> => {
    if (isPlus) return true;
    const used = profile?.free_actions_used ?? 0;
    if (used < FREE_ACTION_LIMIT) return true;
    return presentPaywall({ force: true, reason: "free_exhausted" });
  }, [isPlus, presentPaywall, profile?.free_actions_used]);

  const consume = useCallback(async (): Promise<void> => {
    if (isPlus) return;
    await consumeFreeAction();
  }, [isPlus, consumeFreeAction]);

  const sync = useCallback(async (): Promise<void> => {
    if (isPlus) return;
    await refreshFreeActions();
  }, [isPlus, refreshFreeActions]);

  const remaining = isPlus
    ? null
    : Math.max(0, FREE_ACTION_LIMIT - (profile?.free_actions_used ?? 0));

  return { requireAccess, consume, sync, remaining, isPlus };
}
