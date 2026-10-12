import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { IconChip } from "./IconChip";

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tint?: string;
  busy?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

/** Equal-width action tile: soft icon chip above a label. Place in a row. */
export function QuickAction({
  icon,
  label,
  tint,
  busy,
  disabled,
  onPress,
}: QuickActionProps) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  const color = tint ?? colors.primary;

  return (
    <Pressable
      onPress={() => {
        void triggerLight();
        onPress();
      }}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: colors.surface, borderColor: colors.border },
        DesignSystem.shadows.softAmbient,
        { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || busy, busy }}
    >
      {busy ? (
        <View style={styles.busy}>
          <ActivityIndicator size="small" color={color} />
        </View>
      ) : (
        <IconChip icon={icon} tint={color} size={36} />
      )}
      <Text
        style={[styles.label, { color: colors.text }]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: "center",
    gap: DesignSystem.spacing.xs + 2,
    paddingVertical: DesignSystem.spacing.md - 4,
    paddingHorizontal: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  busy: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
  },
});
