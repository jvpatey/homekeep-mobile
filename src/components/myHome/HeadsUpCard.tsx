import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { HearthSurfaceCard, SectionHeader } from "../ui";
import type { HeadsUpItem } from "../../utils/homeHeadsUp";

interface HeadsUpCardProps {
  items: HeadsUpItem[];
  total: number;
  onPressItem: (item: HeadsUpItem) => void;
}

/** Warranties and documents that expire soon or just lapsed. */
export function HeadsUpCard({ items, total, onPressItem }: HeadsUpCardProps) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  if (items.length === 0) return null;

  return (
    <View>
      <SectionHeader title="Heads up" count={total} />
      <HearthSurfaceCard>
        {items.map((item, index) => {
          const tone = item.expired ? colors.error : colors.warning;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                void triggerLight();
                onPressItem(item);
              }}
              style={({ pressed }) => [
                styles.row,
                index > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: colors.border,
                },
                pressed && { backgroundColor: colors.fieldFill },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.detail}`}
            >
              <View style={[styles.icon, { backgroundColor: tone + "1F" }]}>
                <Ionicons
                  name={item.kind === "warranty" ? "ribbon" : "document-text"}
                  size={16}
                  color={tone}
                />
              </View>
              <View style={styles.text}>
                <Text
                  style={[styles.title, { color: colors.text }]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.4}
                >
                  {item.title}
                </Text>
                <Text
                  style={[styles.detail, { color: tone }]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.4}
                >
                  {item.detail}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </Pressable>
          );
        })}
      </HearthSurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md - 4,
    minHeight: 60,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 2,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...DesignSystem.typography.subhead,
    fontWeight: "600",
  },
  detail: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    marginTop: 2,
  },
});
