import React from "react";
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";

interface StatTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  value: string;
  label: string;
  locked?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Small tappable stat: icon chip, value, and label. Locks for Plus-only data. */
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
      onPress={() => {
        void triggerLight();
        onPress();
      }}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: colors.surface, borderColor: colors.border },
        DesignSystem.shadows.softAmbient,
        pressed && { opacity: 0.7 },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={locked ? `${label}, HomeKeep Plus` : `${label}: ${value}`}
    >
      <View style={[styles.iconChip, { backgroundColor: tint + "1F" }]}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
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
