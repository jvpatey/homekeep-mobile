import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { HearthSurfaceCard, HouseMark } from "../ui";

export interface HeroStat {
  value: string;
  label: string;
  locked?: boolean;
  onPress: () => void;
}

interface HomeIdentityHeroProps {
  street: string;
  /** e.g. "Halifax, NS · Built 1987 (38 years)". */
  meta: string | null;
  sinceLabel: string;
  stats: HeroStat[];
}

/** My Home's opening card: which home this is, and its record at a glance. */
export function HomeIdentityHero({
  street,
  meta,
  sinceLabel,
  stats,
}: HomeIdentityHeroProps) {
  const { colors } = useTheme();

  return (
    <HearthSurfaceCard emphasis="hero" style={styles.card}>
      <View style={styles.top}>
        <View
          style={[
            styles.mark,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <HouseMark size={28} inline />
        </View>
        <View style={styles.text}>
          <Text
            style={[styles.street, { color: colors.text }]}
            numberOfLines={2}
            maxFontSizeMultiplier={1.3}
            accessibilityRole="header"
          >
            {street}
          </Text>
          {meta ? (
            <Text
              style={[styles.meta, { color: colors.textSecondary }]}
              numberOfLines={2}
              maxFontSizeMultiplier={1.4}
            >
              {meta}
            </Text>
          ) : null}
        </View>
      </View>
      <Text
        style={[styles.since, { color: colors.textSecondary }]}
        maxFontSizeMultiplier={1.4}
      >
        {sinceLabel}
      </Text>
      <View style={[styles.stats, { borderTopColor: colors.border }]}>
        {stats.map((stat, index) => (
          <React.Fragment key={stat.label}>
            {index > 0 ? (
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
            ) : null}
            <Stat {...stat} />
          </React.Fragment>
        ))}
      </View>
    </HearthSurfaceCard>
  );
}

function Stat({ value, label, locked, onPress }: HeroStat) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  return (
    <Pressable
      onPress={() => {
        void triggerLight();
        onPress();
      }}
      style={({ pressed }) => [styles.stat, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={
        locked ? `${label}, HomeKeep Plus` : `${value} ${label}`
      }
    >
      {locked ? (
        <View style={styles.statLocked}>
          <Ionicons name="lock-closed" size={18} color={colors.textSecondary} />
        </View>
      ) : (
        <Text
          style={[
            styles.statValue,
            { color: colors.text },
            value.length >= 10
              ? styles.statValueSmall
              : value.length >= 8 && styles.statValueMedium,
          ]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.2}
        >
          {value}
        </Text>
      )}
      <Text
        style={[styles.statLabel, { color: colors.textSecondary }]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: DesignSystem.spacing.lg - 4,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md,
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  street: {
    ...DesignSystem.typography.title2,
  },
  meta: {
    ...DesignSystem.typography.footnote,
  },
  since: {
    ...DesignSystem.typography.footnote,
    marginTop: DesignSystem.spacing.md - 4,
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
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
  },
  statLocked: {
    height: 28,
    justifyContent: "center",
  },
  statValue: {
    fontFamily: DesignSystem.fonts.displaySemiBold,
    fontSize: 22,
    lineHeight: 28,
    fontVariant: ["tabular-nums"],
  },
  // Sized by length rather than adjustsFontSizeToFit, which iOS can collapse
  // to a sliver when the flex column is measured before it has a width.
  statValueMedium: {
    fontSize: 18,
  },
  statValueSmall: {
    fontSize: 15,
  },
  statLabel: {
    ...DesignSystem.typography.caption,
    marginTop: 2,
  },
});
