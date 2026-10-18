import React from "react";
import { TodayAlertCard } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { CampaignProgress } from "../../utils/campaignProgress";

interface CampaignPlanStripProps {
  progress: CampaignProgress;
  onPress: () => void;
  onDismiss?: () => void;
}

export function CampaignPlanStrip({
  progress,
  onPress,
  onDismiss,
}: CampaignPlanStripProps) {
  const { colors } = useTheme();
  return (
    <TodayAlertCard
      icon={progress.isComplete ? "checkmark-circle" : "leaf-outline"}
      tint={colors.secondary}
      title={`${progress.title} · ${progress.done} of ${progress.total} done`}
      body={
        progress.isComplete
          ? "Season checklist complete"
          : "Keep going on this season’s plan"
      }
      onPress={onPress}
      onDismiss={onDismiss}
    />
  );
}
