import { useCallback, useEffect, useState } from "react";
import { useSubscription } from "../context/SubscriptionContext";
import { useAuth } from "../context/AuthContext";
import { AI_FREE_SCAN_LIMIT, AiService } from "../services/AiService";

/** Shared across screens so a scan in the sheet updates the list's entry point. */
let cachedRemaining: { userId: string; value: number } | null = null;
const listeners = new Set<(value: number) => void>();

export function setScanRemaining(userId: string, value: number) {
  cachedRemaining = { userId, value: Math.max(0, value) };
  listeners.forEach((listener) => listener(cachedRemaining!.value));
}

/**
 * Label scanning: HomeKeep + scans freely; free accounts get a few lifetime
 * scans (counted server-side). `remaining` is null for Plus or while loading.
 */
export function useAiScanAccess() {
  const { isPlus, loading, presentPaywall } = useSubscription();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [remaining, setRemaining] = useState<number | null>(
    cachedRemaining && cachedRemaining.userId === userId
      ? cachedRemaining.value
      : null
  );

  useEffect(() => {
    listeners.add(setRemaining);
    return () => {
      listeners.delete(setRemaining);
    };
  }, []);

  useEffect(() => {
    if (isPlus || loading || !userId) return;
    if (cachedRemaining?.userId === userId) {
      setRemaining(cachedRemaining.value);
      return;
    }
    let cancelled = false;
    void AiService.scansUsed().then((used) => {
      if (!cancelled) setScanRemaining(userId, AI_FREE_SCAN_LIMIT - used);
    });
    return () => {
      cancelled = true;
    };
  }, [isPlus, loading, userId]);

  const canScan = isPlus || (remaining ?? AI_FREE_SCAN_LIMIT) > 0;

  /** True if a scan may start; opens the paywall when free scans are gone. */
  const requireAccess = useCallback(async (): Promise<boolean> => {
    if (isPlus || (remaining ?? AI_FREE_SCAN_LIMIT) > 0) return true;
    return presentPaywall({ force: true, reason: "scan" });
  }, [isPlus, presentPaywall, remaining]);

  /** Sync with the count the server returned after a scan. */
  const recordRemaining = useCallback(
    (value: number | null) => {
      if (value === null || !userId) return;
      setScanRemaining(userId, value);
    },
    [userId]
  );

  return {
    isPlus,
    canScan,
    remaining: isPlus ? null : remaining,
    requireAccess,
    recordRemaining,
  };
}
