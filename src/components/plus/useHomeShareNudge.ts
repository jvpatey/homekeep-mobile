import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { useSubscription } from "../../context/SubscriptionContext";
import {
  hasFinishedHomeShareNudge,
  markHomeShareNudgeFinished,
} from "../../utils/plusOfferStorage";

export interface HomeShareNudgePrompt {
  title: string;
  body: string;
  open: () => void;
  dismiss: () => void;
}

/**
 * Once for engaged solo free users after setup: invite someone to share the home.
 */
export function useHomeShareNudge(
  onOpenInvite: () => void
): HomeShareNudgePrompt | null {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { isPlus, loading } = useSubscription();
  const [eligible, setEligible] = useState(false);

  const setupDone = Boolean(profile?.home_setup_set_at);
  const solo = !profile?.household_id;
  const engaged = (profile?.free_actions_used ?? 0) >= 2;

  useEffect(() => {
    const userId = user?.id;
    if (!userId || loading || isPlus || !setupDone || !solo || !engaged) {
      setEligible(false);
      return;
    }
    let cancelled = false;
    void hasFinishedHomeShareNudge(userId).then((done) => {
      if (!cancelled) setEligible(!done);
    });
    return () => {
      cancelled = true;
    };
  }, [
    user?.id,
    loading,
    isPlus,
    setupDone,
    solo,
    engaged,
    profile?.free_actions_used,
  ]);

  const finish = useCallback(() => {
    setEligible(false);
    const userId = user?.id;
    if (userId) void markHomeShareNudgeFinished(userId);
  }, [user?.id]);

  if (!eligible) return null;

  return {
    title: "Anyone else help with this home?",
    body: "Invite a partner or roommate to share the schedule with HomeShare.",
    open: () => {
      finish();
      onOpenInvite();
    },
    dismiss: finish,
  };
}
