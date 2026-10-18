import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";

export type PillTone = "neutral" | "primary" | "success" | "warning" | "error";

interface PillProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: PillTone;
  /** Filter-chip state; only meaningful with `onPress`. */
  selected?: boolean;
  onPress?: () => void;
  size?: "small" | "medium";
  /** Trailing glyph, e.g. a chevron or close icon. */
  trailingIcon?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Status pill, or a selectable filter chip when given `onPress`. */
export function Pill({
  label,
  icon,
  tone = "neutral",
  selected,
  onPress,
  size = "small",
  trailingIcon,
  accessibilityLabel,
  style,
}: PillProps) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();

  const toneColor = {
    neutral: colors.textSecondary,
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  }[tone];

  const filter = onPress != null && selected != null;
  const background = filter
    ? selected
      ? colors.text
      : colors.surface
    : tone === "neutral"
      ? colors.fieldFill
      : toneColor + "1F";
  const foreground = filter
    ? selected
      ? colors.background
      : colors.text
    : toneColor;
  const borderColor = filter
    ? selected
      ? colors.text
      : colors.border
    : "transparent";

  const body = (
    <>
      {icon ? (
        <Ionicons
          name={icon}
          size={size === "small" ? 12 : 14}
          color={foreground}
        />
      ) : null}
      <Text
        style={[
          size === "small" ? styles.labelSmall : styles.labelMedium,
          { color: foreground },
        ]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.4}
      >
        {label}
      </Text>
      {trailingIcon ? (
        <Ionicons
          name={trailingIcon}
          size={size === "small" ? 12 : 14}
          color={foreground}
        />
      ) : null}
    </>
  );

  const pillStyle = [
    styles.pill,
    size === "small" ? styles.small : styles.medium,
    { backgroundColor: background, borderColor },
    style,
  ];

  if (!onPress) {
    return (
      <View style={pillStyle} accessibilityLabel={accessibilityLabel}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => {
        void triggerLight();
        onPress();
      }}
      hitSlop={6}
      style={({ pressed }) => [pillStyle, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityState={filter ? { selected } : undefined}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  small: {
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  medium: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  labelSmall: {
    ...DesignSystem.typography.captionSemiBold,
  },
  labelMedium: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
  },
});
