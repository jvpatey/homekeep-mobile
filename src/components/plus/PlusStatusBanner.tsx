import React from "react";
import { TodayAlertCard } from "../ui";
import { useProfile } from "../../context/ProfileContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { FREE_ACTION_LIMIT } from "../../lib/purchases";

export interface PlusStatusPrompt {
  title: string;
  subtitle: string;
  open: () => void;
}

/** Trial-ending, free-actions-left, or lapsed message; null when nothing to say. */
export function usePlusStatusPrompt(): PlusStatusPrompt | null {
  const { profile } = useProfile();
  const { isPlus, status, daysRemaining, presentPaywall, loading } =
    useSubscription();

  const setupDone = Boolean(profile?.home_setup_set_at);
  const trialEnding =
    isPlus &&
    (status === "trialing" || status === "promo") &&
    daysRemaining != null &&
    daysRemaining <= 2;
  const freeUsed = profile?.free_actions_used ?? 0;
  const freeRemaining = Math.max(0, FREE_ACTION_LIMIT - freeUsed);
  const freeTrialActions =
    setupDone && !isPlus && !loading && freeRemaining > 0;
  const lapsed = setupDone && !isPlus && !loading && freeRemaining === 0;

  if (!trialEnding && !lapsed && !freeTrialActions) return null;

  const title = trialEnding
    ? daysRemaining === 1
      ? "1 day left on us"
      : `${daysRemaining} days left on us`
    : freeTrialActions
      ? freeRemaining === 1
        ? "1 free action left"
        : `${freeRemaining} free actions left`
      : "Subscribe to keep completing";
  const subtitle = trialEnding
    ? "View your plan and billing."
    : freeTrialActions
      ? "Your schedule is free. HomeKeep + keeps the record behind it."
      : "You've used your free tasks. Subscribe to check things off and keep every job on the record.";

  return {
    title,
    subtitle,
    open: () =>
      void presentPaywall({
        force: true,
        reason: freeTrialActions ? undefined : "free_exhausted",
      }),
  };
}

export function PlusStatusBanner({
  prompt,
  onDismiss,
}: {
  prompt: PlusStatusPrompt;
  onDismiss?: () => void;
}) {
  return (
    <TodayAlertCard
      icon="sparkles-outline"
      title={prompt.title}
      body={prompt.subtitle}
      onPress={prompt.open}
      onDismiss={onDismiss}
    />
  );
}
