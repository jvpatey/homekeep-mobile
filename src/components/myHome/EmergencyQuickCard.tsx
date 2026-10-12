import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { HearthSurfaceCard } from "../ui";
import { buildEmergencySpots } from "../emergency/emergencySpots";
import type { HomeEmergencyFacts } from "../../types/homeEmergency";
import type { HomeSystems } from "../../data/maintenancePlans/homeSystems";

interface EmergencyQuickCardProps {
  facts: HomeEmergencyFacts | null | undefined;
  home: HomeSystems | null | undefined;
  onPress: () => void;
}

/** Shutoffs and the panel, readable at a glance from My Home. */
export function EmergencyQuickCard({
  facts,
  home,
  onPress,
}: EmergencyQuickCardProps) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  const spots = useMemo(() => buildEmergencySpots(facts, home), [facts, home]);
  const builtIn = spots.filter((spot) => spot.builtInKey);
  const customCount = spots.length - builtIn.length;
  const filled = spots.filter((spot) => spot.filled).length;
  const total = spots.length;
  const empty = filled === 0;

  const summary = empty
    ? "Note where your shutoffs are before you need them."
    : filled === total
      ? `All ${total} spots saved`
      : `${filled} of ${total} spots saved`;

  return (
    <Pressable
      onPress={() => {
        void triggerLight();
        onPress();
      }}
      style={({ pressed }) => pressed && { opacity: 0.85 }}
      accessibilityRole="button"
      accessibilityLabel={[
        "In an emergency",
        summary,
        ...builtIn.map(
          (spot) =>
            `${spot.label}: ${spot.filled ? spot.note.trim() || "saved" : "not saved"}`
        ),
      ].join(". ")}
      accessibilityHint="Opens emergency info"
    >
      <HearthSurfaceCard
        emphasis="tinted"
        tint={colors.error}
        style={styles.card}
      >
        <View style={styles.header}>
          <View
            style={[styles.headerIcon, { backgroundColor: colors.error + "26" }]}
          >
            <Ionicons name="flash" size={16} color={colors.error} />
          </View>
          <View style={styles.headerText}>
            <Text
              style={[styles.title, { color: colors.text }]}
              maxFontSizeMultiplier={1.4}
            >
              In an emergency
            </Text>
            <Text
              style={[styles.summary, { color: colors.textSecondary }]}
              maxFontSizeMultiplier={1.4}
            >
              {summary}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textSecondary}
          />
        </View>

        <View style={styles.grid}>
          {builtIn.map((spot) => (
            <View
              key={spot.id}
              style={[
                styles.spot,
                spot.filled
                  ? { backgroundColor: colors.surface, borderColor: colors.border }
                  : styles.spotEmpty,
                !spot.filled && { borderColor: colors.textSecondary + "66" },
              ]}
            >
              <View style={styles.spotTop}>
                <Ionicons
                  name={spot.icon}
                  size={14}
                  color={spot.filled ? spot.tint : colors.textSecondary}
                />
                <Text
                  style={[styles.spotLabel, { color: colors.text }]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.3}
                >
                  {spot.label}
                </Text>
                {spot.filled ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={colors.success}
                  />
                ) : null}
              </View>
              <Text
                style={[styles.spotNote, { color: colors.textSecondary }]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.3}
              >
                {spot.filled
                  ? spot.note.trim() || (spot.photoPath ? "Photo saved" : "Saved")
                  : "Not saved yet"}
              </Text>
            </View>
          ))}
        </View>

        {customCount > 0 ? (
          <Text
            style={[styles.more, { color: colors.textSecondary }]}
            maxFontSizeMultiplier={1.3}
          >
            +{customCount} more {customCount === 1 ? "spot" : "spots"}
          </Text>
        ) : null}
      </HearthSurfaceCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md - 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md - 4,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...DesignSystem.typography.headline,
  },
  summary: {
    ...DesignSystem.typography.footnote,
    marginTop: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
  },
  spot: {
    flexBasis: "47%",
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  spotEmpty: {
    borderWidth: 1,
    borderStyle: "dashed",
  },
  spotTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  spotLabel: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    flex: 1,
    minWidth: 0,
  },
  spotNote: {
    ...DesignSystem.typography.caption,
  },
  more: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
  },
});
