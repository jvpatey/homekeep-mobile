import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { useGradients, useHaptics, useReducedMotion } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import { HOME_MAINTENANCE_CATEGORIES } from "../../../types/maintenance";

type IconName = keyof typeof Ionicons.glyphMap;

const CATEGORY_ICON_OVERRIDES: Partial<Record<string, IconName>> = {
  HVAC: "thermometer-outline",
};

export function categoryIcon(category: string): IconName {
  return (
    CATEGORY_ICON_OVERRIDES[category] ??
    (HOME_MAINTENANCE_CATEGORIES[
      category as keyof typeof HOME_MAINTENANCE_CATEGORIES
    ]?.icon as IconName | undefined) ??
    "construct-outline"
  );
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round((minutes / 60) * 2) / 2;
  return `${hours} hr`;
}

type SummaryItem = { interval_days: number; estimated_duration_minutes: number };

/** "How much work is this?" — count, cadence, and yearly time for the selected tasks. */
export function ScheduleSummary({ items }: { items: SummaryItem[] }) {
  const { colors } = useTheme();
  const { glowGradient } = useGradients();

  const perYear = items.reduce(
    (sum, item) => sum + 365 / Math.max(1, item.interval_days),
    0
  );
  const minutesPerYear = items.reduce(
    (sum, item) =>
      sum +
      (365 / Math.max(1, item.interval_days)) * item.estimated_duration_minutes,
    0
  );
  const perMonth = Math.max(items.length > 0 ? 1 : 0, Math.round(perYear / 12));
  const hoursPerYear = Math.max(
    items.length > 0 ? 1 : 0,
    Math.round(minutesPerYear / 60)
  );

  return (
    <View
      style={[
        styles.summary,
        { backgroundColor: colors.surface, borderColor: colors.border },
        DesignSystem.shadows.softKey,
      ]}
      accessible
      accessibilityLabel={`${items.length} tasks. About ${perMonth} a month, ${hoursPerYear} hours a year.`}
    >
      <LinearGradient
        colors={glowGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.summaryTop}>
        <Text style={[styles.summaryCount, { color: colors.primary }]}>
          {items.length}
        </Text>
        <View style={styles.summaryCopy}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
            {items.length === 1 ? "task in your plan" : "tasks in your plan"}
          </Text>
          <Text
            style={[styles.summarySubtitle, { color: colors.textSecondary }]}
          >
            Spread out so nothing piles up.
          </Text>
        </View>
      </View>
      <View style={styles.summaryStats}>
        <SummaryStat icon="calendar-outline" label={`~${perMonth} a month`} />
        <SummaryStat icon="time-outline" label={`~${hoursPerYear} hrs a year`} />
      </View>
    </View>
  );
}

function SummaryStat({ icon, label }: { icon: IconName; label: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.stat,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      <Ionicons name={icon} size={14} color={colors.secondary} />
      <Text style={[styles.statLabel, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

export type ReviewRow = {
  key: string;
  title: string;
  meta: string;
  selected: boolean;
  onToggle: () => void;
  accessibilityLabel?: string;
};

/** Collapsible category card: preview of titles when closed, toggle rows when open. */
export function ScheduleGroup({
  title,
  icon,
  rows,
  initiallyOpen = false,
  tint,
  selectedIcon = "checkmark-circle",
}: {
  title: string;
  icon: IconName;
  rows: ReviewRow[];
  initiallyOpen?: boolean;
  tint?: string;
  selectedIcon?: IconName;
}) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(initiallyOpen);
  const accent = tint ?? colors.primary;

  const selected = rows.filter((row) => row.selected);
  const preview =
    selected.length === 0
      ? "None selected"
      : selected.map((row) => row.title).join(" · ");

  return (
    <Animated.View
      layout={reducedMotion ? undefined : LinearTransition.duration(220)}
      style={[
        styles.group,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Pressable
        onPress={() => {
          triggerLight();
          setOpen((prev) => !prev);
        }}
        style={({ pressed }) => [styles.groupHeader, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${selected.length} of ${rows.length} selected`}
        accessibilityState={{ expanded: open }}
      >
        <View style={[styles.groupIcon, { backgroundColor: accent + "1F" }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>
        <View style={styles.groupCopy}>
          <Text style={[styles.groupTitle, { color: colors.text }]}>
            {title}
          </Text>
          {!open ? (
            <Text
              style={[styles.groupPreview, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {preview}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.groupCount, { color: colors.textSecondary }]}>
          {selected.length}/{rows.length}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.textSecondary}
        />
      </Pressable>

      {open ? (
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.duration(200)}
        >
          {rows.map((row) => (
            <Pressable
              key={row.key}
              onPress={() => {
                triggerLight();
                row.onToggle();
              }}
              style={({ pressed }) => [
                styles.row,
                { borderTopColor: colors.border },
                pressed && styles.pressed,
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: row.selected }}
              accessibilityLabel={row.accessibilityLabel ?? row.title}
            >
              <View style={[styles.rowCopy, !row.selected && styles.rowOff]}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  {row.title}
                </Text>
                <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                  {row.meta}
                </Text>
              </View>
              <Ionicons
                name={row.selected ? selectedIcon : "ellipse-outline"}
                size={24}
                color={row.selected ? accent : colors.textSecondary}
              />
            </Pressable>
          ))}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  summary: {
    borderRadius: DesignSystem.borders.radius.xlarge,
    borderWidth: StyleSheet.hairlineWidth,
    padding: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.lg,
    overflow: "hidden",
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md,
  },
  summaryCount: {
    ...DesignSystem.typography.display,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -1.5,
    fontVariant: ["tabular-nums"],
  },
  summaryCopy: {
    flex: 1,
  },
  summaryTitle: {
    ...DesignSystem.typography.bodySemiBold,
  },
  summarySubtitle: {
    ...DesignSystem.typography.footnote,
    marginTop: 2,
  },
  summaryStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.md,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: 6,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statLabel: {
    ...DesignSystem.typography.smallMedium,
  },
  group: {
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: DesignSystem.spacing.sm,
    overflow: "hidden",
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md,
    minHeight: 64,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
  },
  groupIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  groupCopy: {
    flex: 1,
    minWidth: 0,
  },
  groupTitle: {
    ...DesignSystem.typography.bodySemiBold,
  },
  groupPreview: {
    ...DesignSystem.typography.footnote,
    marginTop: 2,
  },
  groupCount: {
    ...DesignSystem.typography.smallMedium,
    fontVariant: ["tabular-nums"],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md,
    minHeight: 56,
    paddingVertical: DesignSystem.spacing.sm,
    paddingLeft: DesignSystem.spacing.md + 36 + DesignSystem.spacing.md,
    paddingRight: DesignSystem.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowCopy: {
    flex: 1,
  },
  rowOff: {
    opacity: 0.45,
  },
  rowTitle: {
    ...DesignSystem.typography.smallMedium,
  },
  rowMeta: {
    ...DesignSystem.typography.footnote,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.7,
  },
});
