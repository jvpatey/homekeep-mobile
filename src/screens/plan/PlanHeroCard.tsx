import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { getHomeSeason, homeSeasonLabel } from "../../utils/homeSeason";
import { DesignSystem } from "../../theme/designSystem";

interface PlanHeroCardProps {
  latitude?: number | null;
  activeReminders: number | null;
  dueThisWeek: number | null;
  bundlesAdded: number;
  onPressReminders: () => void;
  onPressDue: () => void;
  onPressBundles: () => void;
}

function seasonIcon(
  month: number,
  latitude?: number | null
): keyof typeof Ionicons.glyphMap {
  const season = getHomeSeason(month, latitude);
  if (season === "spring") return "flower-outline";
  if (season === "fall") return "snow-outline";
  const southern = (latitude ?? 0) < 0;
  const summer = southern
    ? month >= 11 || month <= 1
    : month >= 5 && month <= 7;
  return summer ? "sunny-outline" : "calendar-outline";
}

export function PlanHeroCard({
  latitude,
  activeReminders,
  dueThisWeek,
  bundlesAdded,
  onPressReminders,
  onPressDue,
  onPressBundles,
}: PlanHeroCardProps) {
  const { colors, isDark } = useTheme();
  const month = new Date().getMonth();
  const icon = seasonIcon(month, latitude);
  const hasReminders = (activeReminders ?? 0) > 0;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        DesignSystem.shadows.softKey,
      ]}
    >
      <LinearGradient
        colors={[colors.primary + (isDark ? "30" : "1A"), "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Ionicons
        name={icon}
        size={148}
        color={colors.primary}
        style={[styles.watermark, { opacity: isDark ? 0.08 : 0.06 }]}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      />

      <View style={styles.top}>
        <View
          style={[
            styles.mark,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Ionicons name="repeat" size={24} color={colors.primary} />
        </View>
        <View style={styles.topText}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>
            {homeSeasonLabel(month, latitude)}
          </Text>
          <Text
            style={[styles.title, { color: colors.text }]}
            accessibilityRole="header"
          >
            Your maintenance plan
          </Text>
        </View>
      </View>

      <Text style={[styles.body, { color: colors.textSecondary }]}>
        {hasReminders
          ? "The recurring care behind your Home schedule. Add a bundle from the library, or fine-tune the reminders you already track."
          : "Pick a bundle below to get started. Each one adds a few recurring reminders that show up on Home when they’re due."}
      </Text>

      <View style={[styles.stats, { borderTopColor: colors.border }]}>
        <Stat
          value={activeReminders}
          label={activeReminders === 1 ? "reminder" : "reminders"}
          accessibilityHint="Shows your reminders"
          onPress={onPressReminders}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Stat
          value={dueThisWeek}
          label="due this week"
          accessibilityHint="Opens your Home schedule"
          onPress={onPressDue}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Stat
          value={bundlesAdded}
          label={bundlesAdded === 1 ? "bundle added" : "bundles added"}
          accessibilityHint="Shows the task library"
          onPress={onPressBundles}
        />
      </View>
    </View>
  );
}

function Stat({
  value,
  label,
  accessibilityHint,
  onPress,
}: {
  value: number | null;
  label: string;
  accessibilityHint: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  return (
    <Pressable
      onPress={() => {
        triggerLight();
        onPress();
      }}
      style={({ pressed }) => [styles.stat, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={value == null ? label : `${value} ${label}`}
      accessibilityHint={accessibilityHint}
    >
      <Text
        style={[styles.statValue, { color: colors.text }]}
        numberOfLines={1}
      >
        {value == null ? "—" : String(value)}
      </Text>
      <Text
        style={[styles.statLabel, { color: colors.textSecondary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: DesignSystem.borders.radius.xlarge,
    borderWidth: StyleSheet.hairlineWidth,
    padding: DesignSystem.spacing.lg,
    overflow: "hidden",
  },
  watermark: {
    position: "absolute",
    top: -28,
    right: -32,
    transform: [{ rotate: "-12deg" }],
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md,
  },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  topText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    ...DesignSystem.typography.captionSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    ...DesignSystem.typography.title2,
  },
  body: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
    marginTop: DesignSystem.spacing.md,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.xs,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
  },
  statValue: {
    fontFamily: DesignSystem.fonts.displaySemiBold,
    fontSize: 22,
    lineHeight: 28,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    ...DesignSystem.typography.caption,
    marginTop: 2,
  },
});
