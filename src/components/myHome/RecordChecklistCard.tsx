import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { HearthSurfaceCard } from "../ui";
import {
  HomeRecordItem,
  HomeRecordItemKey,
} from "../../utils/homeRecordProgress";

interface RecordChecklistCardProps {
  items: HomeRecordItem[];
  done: number;
  total: number;
  onStart: (key: HomeRecordItemKey) => void;
}

/** Steps left to fill in the home record; each step opens where it's done. */
export function RecordChecklistCard({
  items,
  done,
  total,
  onStart,
}: RecordChecklistCardProps) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  const missing = items.filter((item) => !item.done);
  const next = missing[0];
  if (!next) return null;
  const rest = missing.slice(1);

  const start = (key: HomeRecordItemKey) => {
    void triggerLight();
    onStart(key);
  };

  return (
    <HearthSurfaceCard style={styles.card}>
      <View style={styles.header}>
        <Text
          style={[styles.title, { color: colors.text }]}
          accessibilityRole="header"
          maxFontSizeMultiplier={1.4}
        >
          Finish your home record
        </Text>
        <Text
          style={[styles.count, { color: colors.textSecondary }]}
          maxFontSizeMultiplier={1.3}
        >
          {done} of {total}
        </Text>
      </View>

      <View
        style={styles.segments}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Home record ${done} of ${total} complete`}
        accessibilityValue={{ min: 0, max: total, now: done }}
      >
        {items.map((item) => (
          <View
            key={item.key}
            style={[
              styles.segment,
              {
                backgroundColor: item.done ? colors.secondary : colors.fieldFill,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.nextRow}>
        <View
          style={[styles.nextIcon, { backgroundColor: colors.primary + "1F" }]}
        >
          <Ionicons name={next.icon} size={18} color={colors.primary} />
        </View>
        <View style={styles.nextText}>
          <Text
            style={[styles.nextEyebrow, { color: colors.textSecondary }]}
            maxFontSizeMultiplier={1.3}
          >
            Next up
          </Text>
          <Text
            style={[styles.nextLabel, { color: colors.text }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.4}
          >
            {next.label}
          </Text>
        </View>
        <Pressable
          onPress={() => start(next.key)}
          hitSlop={6}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={next.cta}
        >
          <Text
            style={styles.buttonText}
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}
          >
            {next.cta}
          </Text>
        </Pressable>
      </View>

      {rest.length > 0 ? (
        <View style={styles.chips}>
          {rest.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => start(item.key)}
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: colors.fieldFill },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={item.cta}
            >
              <Ionicons name={item.icon} size={13} color={colors.textSecondary} />
              <Text
                style={[styles.chipText, { color: colors.text }]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.3}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </HearthSurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md - 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: DesignSystem.spacing.sm,
  },
  title: {
    ...DesignSystem.typography.headline,
    flexShrink: 1,
  },
  count: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  segments: {
    flexDirection: "row",
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  nextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md - 4,
    marginTop: DesignSystem.spacing.xs,
  },
  nextIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: {
    flex: 1,
    minWidth: 0,
  },
  nextEyebrow: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontSize: 10,
  },
  nextLabel: {
    ...DesignSystem.typography.subhead,
    fontWeight: "600",
  },
  button: {
    paddingHorizontal: DesignSystem.spacing.md - 2,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.round,
    minHeight: 36,
    maxWidth: "55%",
    justifyContent: "center",
  },
  buttonText: {
    ...DesignSystem.typography.footnote,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.xs + 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: DesignSystem.borders.radius.round,
  },
  chipText: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
  },
});
