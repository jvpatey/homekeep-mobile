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
 * Does NOT consume — call `consumeFreeAction` after a successful complete/create.
 */
export function useCanUseFreeAction(): boolean {
  const { isPlus } = useSubscription();
  const { profile } = useProfile();
  if (isPlus) return true;
  return (profile?.free_actions_used ?? 0) < FREE_ACTION_LIMIT;
}

/**
 * Gate complete/create: Plus always; otherwise consume one free action after
 * the caller succeeds — use `requireAccess` before work and `consume` after.
 *
 * `requireAccess` returns true if Plus or free quota remains (does not consume).
 * When quota is exhausted, presents paywall with free-exhausted messaging.
 */
export function useRequirePlusOrFreeAction() {
  const { isPlus, presentPaywall } = useSubscription();
  const { profile, consumeFreeAction } = useProfile();

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

  const remaining = isPlus
    ? null
    : Math.max(0, FREE_ACTION_LIMIT - (profile?.free_actions_used ?? 0));

  return { requireAccess, consume, remaining, isPlus };
}
