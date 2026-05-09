import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../context/ThemeContext";
import { useGradients } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import { authStyles } from "../../../screens/auth/styles/authStyles";

export type PopupPrimaryButtonTone = "primary" | "secondary" | "accent";

interface PopupPrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Fills + shadow use this theme token (default `primary`). */
  tone?: PopupPrimaryButtonTone;
}

/** Solid theme CTA + specular highlight — same chrome as auth / create-task submit. */
export function PopupPrimaryButton({
  label,
  onPress,
  disabled = false,
  tone = "primary",
}: PopupPrimaryButtonProps) {
  const { colors, isDark } = useTheme();
  const { ctaHighlight } = useGradients();

  const fill =
    tone === "secondary"
      ? colors.secondary
      : tone === "accent"
        ? colors.accent
        : colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <View
        style={[
          authStyles.primaryButton,
          {
            position: "relative",
            overflow: "hidden",
            backgroundColor: fill,
            shadowColor: fill,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 18,
            elevation: 5,
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.12)"
              : "rgba(255, 255, 255, 0.22)",
            opacity: disabled ? 0.55 : 1,
          },
        ]}
      >
        <LinearGradient
          colors={ctaHighlight}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "45%",
          }}
          pointerEvents="none"
        />
        <Text
          style={[
            authStyles.buttonLabel,
            { color: "white", fontWeight: "600", fontSize: 17 },
          ]}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
