import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";
import { CampaignProgress } from "../../utils/campaignProgress";

interface CampaignPlanStripProps {
  progress: CampaignProgress;
  onPress: () => void;
}

export function CampaignPlanStrip({
  progress,
  onPress,
}: CampaignPlanStripProps) {
  const { colors, isDark } = useTheme();
  const progressLabel = `${progress.done} of ${progress.total} done`;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.wrap,
        {
          backgroundColor: isDark
            ? "rgba(35, 37, 38, 0.45)"
            : "rgba(255, 255, 255, 0.55)",
          borderColor: colors.glassStroke,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${progress.title}, ${progressLabel}. Open plan.`}
    >
      <Ionicons
        name={progress.isComplete ? "checkmark-circle" : "leaf-outline"}
        size={18}
        color={colors.primary}
      />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {progress.title} · {progressLabel}
        </Text>
        <Text
          style={[styles.meta, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {progress.isComplete
            ? "Season checklist complete"
            : "Keep going on this season’s plan"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...DesignSystem.typography.smallSemiBold,
  },
  meta: {
    ...DesignSystem.typography.caption,
    marginTop: 2,
  },
});
