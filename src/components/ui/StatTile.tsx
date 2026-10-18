import React from "react";
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { IconChip } from "./IconChip";

interface StatTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  value: string;
  label: string;
  locked?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Small stat: icon chip, value, and label. Tappable with `onPress`; locks for Plus-only data. */
export function StatTile({
  icon,
  tint,
  value,
  label,
  locked,
  onPress,
  style,
}: StatTileProps) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();

  return (
    <Pressable
      onPress={
        onPress
          ? () => {
              void triggerLight();
              onPress();
            }
          : undefined
      }
      disabled={!onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: colors.surface, borderColor: colors.border },
        DesignSystem.shadows.softAmbient,
        pressed && { opacity: 0.7 },
        style,
      ]}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={locked ? `${label}, HomeKeep Plus` : `${label}: ${value}`}
    >
      <IconChip icon={icon} tint={tint} size={28} style={styles.iconChip} />
      {locked ? (
        <View style={styles.lockRow}>
          <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
        </View>
      ) : (
        <Text
          style={[styles.value, { color: colors.text }]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}
        >
          {value}
        </Text>
      )}
      <Text
        style={[styles.label, { color: colors.textSecondary }]}
        numberOfLines={2}
        maxFontSizeMultiplier={1.4}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 132,
    minHeight: 112,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  iconChip: {
    marginBottom: 2,
  },
  lockRow: {
    height: 26,
    justifyContent: "center",
  },
  value: {
    fontFamily: DesignSystem.fonts.displaySemiBold,
    fontSize: 20,
    lineHeight: 26,
    fontVariant: ["tabular-nums"],
  },
  label: {
    ...DesignSystem.typography.caption,
  },
});
