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
  /** When false, Plus-required rows show a badge. */
  isPlus?: boolean;
}

/** Checklist of home-record setup steps; each row opens where that step is done. */
export function RecordChecklistCard({
  items,
  done,
  total,
  onStart,
  isPlus = false,
}: RecordChecklistCardProps) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  const nextKey = items.find((item) => !item.done)?.key ?? null;
  if (!nextKey) return null;

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
          Set up your home
        </Text>
        <Text
          style={[styles.count, { color: colors.textSecondary }]}
          accessibilityLabel={`${done} of ${total} done`}
          maxFontSizeMultiplier={1.3}
        >
          {done} of {total} done
        </Text>
      </View>

      <Text
        style={[styles.support, { color: colors.textSecondary }]}
        maxFontSizeMultiplier={1.3}
      >
        Shutoffs, appliances, and who helps — add what you have.
      </Text>

      <View style={styles.list} accessibilityRole="list">
        {items.map((item) => {
          const isNext = item.key === nextKey;
          const showPlus = !isPlus && !item.done && Boolean(item.plusRequired);
          return (
            <Pressable
              key={item.key}
              onPress={() => start(item.key)}
              disabled={item.done}
              style={({ pressed }) => [
                styles.row,
                isNext && {
                  backgroundColor: colors.primary + "12",
                  borderColor: colors.primary + "33",
                },
                !isNext && { borderColor: "transparent" },
                pressed && !item.done && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ checked: item.done, disabled: item.done }}
              accessibilityLabel={
                item.done
                  ? `${item.label}, done`
                  : `${isNext ? `Next: ${item.cta}` : item.cta}${
                      showPlus ? ", HomeKeep Plus" : ""
                    }`
              }
            >
              <View
                style={[
                  styles.icon,
                  {
                    backgroundColor: item.done
                      ? colors.success + "22"
                      : isNext
                        ? colors.primary + "1F"
                        : colors.fieldFill,
                  },
                ]}
              >
                <Ionicons
                  name={item.done ? "checkmark" : item.icon}
                  size={16}
                  color={
                    item.done
                      ? colors.success
                      : isNext
                        ? colors.primary
                        : colors.textSecondary
                  }
                />
              </View>
              <View style={styles.labelBlock}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: item.done ? colors.textSecondary : colors.text,
                    },
                    item.done && styles.labelDone,
                  ]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.4}
                >
                  {item.label}
                </Text>
                {showPlus ? (
                  <View
                    style={[
                      styles.plusBadge,
                      { backgroundColor: colors.secondary + "1F" },
                    ]}
                  >
                    <Text
                      style={[styles.plusText, { color: colors.secondary }]}
                    >
                      Plus
                    </Text>
                  </View>
                ) : null}
              </View>
              {item.done ? (
                <Text
                  style={[styles.doneTag, { color: colors.success }]}
                  maxFontSizeMultiplier={1.2}
                >
                  Done
                </Text>
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={isNext ? colors.primary : colors.textSecondary}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </HearthSurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
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
  support: {
    ...DesignSystem.typography.footnote,
    marginBottom: DesignSystem.spacing.xs,
  },
  list: {
    gap: DesignSystem.spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md - 4,
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: DesignSystem.components.minTouchTarget,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  labelBlock: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  label: {
    ...DesignSystem.typography.subhead,
    fontWeight: "600",
    flexShrink: 1,
  },
  labelDone: {
    textDecorationLine: "line-through",
    fontWeight: "500",
  },
  plusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: DesignSystem.borders.radius.round,
  },
  plusText: {
    ...DesignSystem.typography.captionSemiBold,
  },
  doneTag: {
    ...DesignSystem.typography.captionSemiBold,
  },
});
