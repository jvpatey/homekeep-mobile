import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { useTasks } from "../../context/TasksContext";
import { useTaskActions } from "../../context/TaskActionsContext";
import { useHaptics } from "../../hooks";
import {
  isPlusRequiredError,
  useRequirePlusOrFreeAction,
} from "../../hooks/useRequirePlus";
import { useSubscription } from "../../context/SubscriptionContext";
import {
  ClimateAlert,
  WeatherService,
  pickTemperatureUnit,
} from "../../services/WeatherService";
import {
  buildWeatherChecklistPayloads,
  weatherChecklistForKind,
} from "../../data/weatherChecklists";
import {
  hasAppliedWeatherChecklist,
  markWeatherChecklistApplied,
} from "../../utils/weatherChecklistStorage";
import {
  CampaignProgress,
  computeCampaignProgress,
  hasCelebratedCampaign,
  markCampaignCelebrated,
} from "../../utils/campaignProgress";
import { getAppliedPlanIds } from "../../data/maintenancePlans";
import { recommendInSeasonPlanId } from "../../utils/homeSeason";
import { TodayAlertCard } from "../ui";
import { WeatherAlertCard } from "../Dashboard/WeatherAlertCard";
import {
  InspectionImportCard,
  useInspectionImportPrompt,
} from "../Dashboard/InspectionImportCard";
import { CampaignPlanStrip } from "../Dashboard/CampaignPlanStrip";
import { PlusStatusBanner, usePlusStatusPrompt } from "../plus";

type AlertKey = "weather" | "inspection" | "campaign" | "plus";

/** Dismissed for this app session only; they come back on the next launch. */
const dismissedThisSession = new Set<AlertKey>();

/** Freeze/heat/storm alert for the home's location, plus the prep-task action. */
export function useClimateAlert() {
  const { profile } = useProfile();
  const { createTasks } = useTasks();
  const { refresh } = useTaskActions();
  const { triggerLight } = useHaptics();
  const { requireAccess, sync } = useRequirePlusOrFreeAction();
  const { presentPaywall } = useSubscription();
  const [alert, setAlert] = useState<ClimateAlert | null>(null);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (profile?.latitude == null || profile?.longitude == null) {
      setAlert(null);
      setApplied(false);
      return;
    }
    let cancelled = false;
    void WeatherService.getClimateAlert(
      profile.latitude,
      profile.longitude,
      pickTemperatureUnit(profile.country)
    ).then(async (next) => {
      const done = next ? await hasAppliedWeatherChecklist(next.kind) : false;
      if (cancelled) return;
      setAlert(next);
      setApplied(done);
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.latitude, profile?.longitude, profile?.country]);

  const addPrepTasks = useCallback(async () => {
    if (!alert || applying) return;
    if (!(await requireAccess())) return;

    const count = weatherChecklistForKind(alert.kind).length;
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "Add prep tasks?",
        `Add ${count} one-time prep task${count === 1 ? "" : "s"} for this alert?`,
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          { text: "Add", onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    });
    if (!confirmed) return;

    setApplying(true);
    try {
      const result = await createTasks(buildWeatherChecklistPayloads(alert.kind));
      if (!result.success) {
        if (isPlusRequiredError(result.error)) {
          await presentPaywall({ force: true, reason: "free_exhausted" });
          return;
        }
        Alert.alert("Could not add tasks", result.error || "Please try again.");
        return;
      }
      await sync();
      await markWeatherChecklistApplied(alert.kind);
      setApplied(true);
      await triggerLight();
      void refresh();
    } finally {
      setApplying(false);
    }
  }, [
    alert,
    applying,
    createTasks,
    presentPaywall,
    refresh,
    requireAccess,
    sync,
    triggerLight,
  ]);

  return {
    alert: alert && !applied ? alert : null,
    /** The raw alert, even after prep tasks were added; used for "why" copy. */
    current: alert,
    applying,
    addPrepTasks,
  };
}

/** This season's plan progress, with a one-time "complete" note per year. */
export function useCampaignProgress(): CampaignProgress | null {
  const { profile } = useProfile();
  const { upcomingTasks, overdueTasks, completedTasks } = useTasks();
  const { activeRoutines } = useTaskActions();
  const [celebrated, setCelebrated] = useState(true);
  const planId = recommendInSeasonPlanId(new Date().getMonth(), profile?.latitude);

  const progress = useMemo(() => {
    if (!planId) return null;
    if (!getAppliedPlanIds(activeRoutines).has(planId)) return null;
    return computeCampaignProgress(
      planId,
      activeRoutines,
      [...upcomingTasks, ...overdueTasks],
      completedTasks
    );
  }, [planId, activeRoutines, upcomingTasks, overdueTasks, completedTasks]);

  useEffect(() => {
    if (!progress?.planId) {
      setCelebrated(true);
      return;
    }
    let cancelled = false;
    void hasCelebratedCampaign(progress.planId).then((done) => {
      if (!cancelled) setCelebrated(done);
    });
    return () => {
      cancelled = true;
    };
  }, [progress?.planId]);

  useEffect(() => {
    if (!progress?.isComplete || celebrated) return;
    void (async () => {
      await markCampaignCelebrated(progress.planId);
      setCelebrated(true);
      Alert.alert(
        `${progress.title} complete`,
        `You finished ${progress.total} seasonal reminder${
          progress.total === 1 ? "" : "s"
        }. Nice work.`
      );
    })();
  }, [progress, celebrated]);

  return progress;
}

interface TodayAlertSlotProps {
  climate: ReturnType<typeof useClimateAlert>;
  campaign: CampaignProgress | null;
  onOpenCampaign: (planId: string) => void;
}

/**
 * At most one alert on Today. Priority: tasks failed to load, weather,
 * inspection import, seasonal plan, then Plus status.
 */
export function TodayAlertSlot({
  climate,
  campaign,
  onOpenCampaign,
}: TodayAlertSlotProps) {
  const { colors } = useTheme();
  const { error: tasksError, refreshTasks } = useTasks();
  const inspection = useInspectionImportPrompt();
  const plus = usePlusStatusPrompt();
  const [, setDismissTick] = useState(0);

  const dismiss = (key: AlertKey) => () => {
    dismissedThisSession.add(key);
    setDismissTick((n) => n + 1);
  };
  const open = (key: AlertKey) => !dismissedThisSession.has(key);

  if (tasksError) {
    return (
      <TodayAlertCard
        icon="cloud-offline-outline"
        tint={colors.error}
        title="Couldn’t load your tasks"
        body={tasksError}
        actionLabel="Try again"
        actionIcon="refresh"
        onAction={() => void refreshTasks()}
      />
    );
  }

  if (climate.alert && open("weather")) {
    return (
      <WeatherAlertCard
        alert={climate.alert}
        applying={climate.applying}
        onAddPrepTasks={() => void climate.addPrepTasks()}
        onDismiss={dismiss("weather")}
      />
    );
  }

  if (inspection.visible && open("inspection")) {
    return <InspectionImportCard prompt={inspection} />;
  }

  if (campaign && open("campaign")) {
    return (
      <CampaignPlanStrip
        progress={campaign}
        onPress={() => onOpenCampaign(campaign.planId)}
        onDismiss={dismiss("campaign")}
      />
    );
  }

  if (plus && open("plus")) {
    return <PlusStatusBanner prompt={plus} onDismiss={dismiss("plus")} />;
  }

  return null;
}
