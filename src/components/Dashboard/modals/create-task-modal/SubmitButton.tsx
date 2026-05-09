import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../../context/ThemeContext";
import { useGradients, useDevice } from "../../../../hooks";
import { DesignSystem } from "../../../../theme/designSystem";
import { authStyles } from "../../../../screens/auth/styles/authStyles";

interface SubmitButtonProps {
  onPress: () => void;
  disabled: boolean;
  title: string;
}

/** Primary CTA — matches Login / SignUp solid + specular highlight. */
export function SubmitButton({ onPress, disabled, title }: SubmitButtonProps) {
  const { colors, isDark } = useTheme();
  const { ctaHighlight } = useGradients();
  const { isTablet, getFontMultiplier } = useDevice();
  const fontMultiplier = getFontMultiplier();

  return (
    <View style={{ backgroundColor: "transparent", paddingTop: DesignSystem.spacing.md }}>
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
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
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
            isTablet && {
              paddingVertical: DesignSystem.spacing.md * (1 + (fontMultiplier - 1) * 0.15),
              minHeight: DesignSystem.components.buttonLarge * (1 + (fontMultiplier - 1) * 0.12),
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
              {
                color: "white",
                fontWeight: "600",
                fontSize: 17,
              },
              isTablet && {
                fontSize: 17 * fontMultiplier,
              },
            ]}
          >
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
