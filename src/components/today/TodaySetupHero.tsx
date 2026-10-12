import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { HearthSurfaceCard } from "../ui";
import { BuildingMark, FloatingChip, Sparkle } from "../ui/hero/heroKit";

interface TodaySetupHeroProps {
  userName: string;
  /** True until the home profile (address and systems) is filled in. */
  needsHomeSetup: boolean;
  onSetUpHome: () => void;
  onBrowseLibrary: () => void;
}

const SPARKLES = [
  { x: -92, y: -38, size: 6, delay: 0 },
  { x: 96, y: -30, size: 5, delay: 500 },
  { x: -70, y: 40, size: 4, delay: 900 },
  { x: 84, y: 44, size: 6, delay: 300 },
];

/** Today's first card before there's anything to score. */
export function TodaySetupHero({
  userName,
  needsHomeSetup,
  onSetUpHome,
  onBrowseLibrary,
}: TodaySetupHeroProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  const title = needsHomeSetup
    ? `Welcome${userName ? `, ${userName}` : ""}`
    : "Add your first reminders";
  const body = needsHomeSetup
    ? "Tell HomeKeep about your home and it builds a care schedule around it. It takes about two minutes."
    : "Pick a few routines from the library and Today starts tracking your upkeep.";

  return (
    <HearthSurfaceCard emphasis="hero">
      <View style={styles.scene} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {SPARKLES.map((sparkle, index) => (
          <Sparkle
            key={index}
            {...sparkle}
            color={index % 2 === 0 ? colors.primary : colors.secondary}
            reducedMotion={reducedMotion}
          />
        ))}
        <View
          style={[
            styles.plate,
            { backgroundColor: colors.surface, borderColor: colors.border },
            DesignSystem.shadows.softKey,
          ]}
        >
          <BuildingMark size={44} delay={120} reducedMotion={reducedMotion} />
        </View>
        <FloatingChip
          label="Filters"
          icon="leaf"
          x={-104}
          y={-18}
          color={colors.secondary}
          popDelay={420}
          bobDelay={0}
          bobDuration={2600}
          reducedMotion={reducedMotion}
        />
        <FloatingChip
          label="Smoke alarms"
          icon="flame"
          x={62}
          y={-34}
          color={colors.primary}
          popDelay={560}
          bobDelay={400}
          bobDuration={2900}
          reducedMotion={reducedMotion}
        />
        <FloatingChip
          label="Gutters"
          icon="water"
          x={58}
          y={34}
          color={colors.secondary}
          popDelay={700}
          bobDelay={800}
          bobDuration={2400}
          reducedMotion={reducedMotion}
        />
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          {title}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{body}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={needsHomeSetup ? onSetUpHome : onBrowseLibrary}
          style={({ pressed }) => [
            styles.primary,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryLabel}>
            {needsHomeSetup ? "Set up my home" : "Browse the task library"}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
        {needsHomeSetup ? (
          <Pressable
            onPress={onBrowseLibrary}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={[styles.secondaryLabel, { color: colors.primary }]}>
              Browse the task library
            </Text>
          </Pressable>
        ) : null}
      </View>
    </HearthSurfaceCard>
  );
}

const styles = StyleSheet.create({
  scene: {
    height: 148,
    alignItems: "center",
    justifyContent: "center",
  },
  plate: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    paddingHorizontal: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.xs,
    alignItems: "center",
  },
  title: {
    fontFamily: DesignSystem.fonts.displaySemiBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  body: {
    ...DesignSystem.typography.subhead,
    textAlign: "center",
  },
  actions: {
    padding: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.xs,
  },
  primary: {
    minHeight: 50,
    borderRadius: DesignSystem.borders.radius.round,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DesignSystem.spacing.xs + 2,
  },
  primaryLabel: {
    ...DesignSystem.typography.headline,
    color: "#FFFFFF",
  },
  secondary: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryLabel: {
    ...DesignSystem.typography.subhead,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.75,
  },
});
