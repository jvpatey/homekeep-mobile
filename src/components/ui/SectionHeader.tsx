import React from "react";
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";

interface SectionHeaderProps {
  title: string;
  count?: number;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Section title with an optional count and trailing "See all" style link. */
export function SectionHeader({
  title,
  count,
  actionLabel,
  onAction,
  style,
}: SectionHeaderProps) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();

  return (
    <View style={[styles.row, style]}>
      <View style={styles.titleWrap}>
        <Text
          style={[styles.title, { color: colors.text }]}
          accessibilityRole="header"
          maxFontSizeMultiplier={1.4}
        >
          {title}
        </Text>
        {count != null && count > 0 ? (
          <View style={[styles.count, { backgroundColor: colors.fieldFill }]}>
            <Text style={[styles.countText, { color: colors.textSecondary }]}>
              {count}
            </Text>
          </View>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={() => {
            void triggerLight();
            onAction();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          <Text style={[styles.action, { color: colors.primary }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: DesignSystem.spacing.sm,
    minHeight: 28,
    marginBottom: DesignSystem.spacing.sm,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    flexShrink: 1,
  },
  title: {
    ...DesignSystem.typography.headline,
  },
  count: {
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: DesignSystem.borders.radius.round,
    alignItems: "center",
  },
  countText: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  action: {
    ...DesignSystem.typography.subhead,
    fontWeight: "600",
  },
});
