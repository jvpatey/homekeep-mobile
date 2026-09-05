import { useCallback } from "react";
import { useSubscription } from "../context/SubscriptionContext";

/** Opens HomeKeep + paywall when needed. Returns true if entitled afterward. */
export function useRequirePlus() {
  const { isPlus, presentPaywall } = useSubscription();

  return useCallback(async () => {
    if (isPlus) return true;
    return presentPaywall();
  }, [isPlus, presentPaywall]);
}
