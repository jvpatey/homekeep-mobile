import { useCallback } from "react";
import type { Ionicons } from "@expo/vector-icons";
import { useSubscription } from "../context/SubscriptionContext";

/** Parts of the home record that need HomeKeep +. The schedule stays free. */
export type PlusFeatureKey =
  "history" | "ledger" | "documents" | "pros" | "pdf" | "homeshare";

export interface PlusFeature {
  /** Short name for lock overlays, e.g. "Spend". */
  title: string;
  /** Paywall headline when this feature was tapped. */
  headline: string;
  blurb: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Index into the paywall's value lines to highlight. */
  valueLine: number;
}

export const PLUS_FEATURES: Record<PlusFeatureKey, PlusFeature> = {
  history: {
    title: "Full history",
    headline: "See every job you've done",
    blurb:
      "Keep the date, cost, photo, and who did it for every task, as far back as you go.",
    icon: "time",
    valueLine: 0,
  },
  ledger: {
    title: "Spend",
    headline: "Know what the house costs",
    blurb:
      "Totals by year and category, and how much went to pros versus doing it yourself.",
    icon: "wallet",
    valueLine: 1,
  },
  documents: {
    title: "Documents",
    headline: "Keep the house paperwork with the house",
    blurb:
      "Store manuals, receipts, warranties, insurance policies, inspection reports, and permits in one place.",
    icon: "document-text",
    valueLine: 2,
  },
  pros: {
    title: "Pros",
    headline: "Keep your trusted pros in one place",
    blurb:
      "Tap to call the plumber who did it last time, and see every job and what you paid.",
    icon: "people",
    valueLine: 2,
  },
  pdf: {
    title: "Home history PDF",
    headline: "Hand over your home's history",
    blurb:
      "Export a clean record of maintenance, equipment, and costs for buyers and insurers.",
    icon: "document-attach",
    valueLine: 3,
  },
  homeshare: {
    title: "HomeShare",
    headline: "Share the home with everyone who lives there",
    blurb:
      "One schedule and one record for the whole household, with HomeKeep + included for everyone.",
    icon: "home",
    valueLine: 4,
  },
};

export function isPlusFeatureKey(value: unknown): value is PlusFeatureKey {
  return typeof value === "string" && value in PLUS_FEATURES;
}

/**
 * `locked` is false while the subscription is still loading so paying users
 * never see a lock flash. `unlock` opens the paywall with this feature's
 * copy and resolves true if the user is entitled afterward.
 */
export function usePlusFeature(key: PlusFeatureKey) {
  const { isPlus, loading, presentPaywall } = useSubscription();
  const unlock = useCallback(
    () => (isPlus ? Promise.resolve(true) : presentPaywall({ reason: key })),
    [isPlus, key, presentPaywall]
  );
  return { locked: !isPlus && !loading, unlock, feature: PLUS_FEATURES[key] };
}
