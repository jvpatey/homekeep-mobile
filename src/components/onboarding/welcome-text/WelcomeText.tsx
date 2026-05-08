import React from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { useTextAnimation, useDevice } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import { styles } from "./styles";

/**
 * WelcomeText — 2026 redesign.
 *
 * Type animates opacity-only (no scale, no translateY) to avoid sub-pixel
 * blur during the tween. Both lines fade in at t=0 alongside the logo as
 * one hero group.
 */
export function WelcomeText() {
  const { colors } = useTheme();
  const { headlineEntering, subtitleEntering } = useTextAnimation();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();

  const fontMultiplier = getFontMultiplier();

  return (
    <View
      style={[
        styles.textContainer,
        isTablet && {
          maxWidth: getResponsiveValue(280, 480, 620),
          marginTop: getResponsiveValue(
            DesignSystem.spacing.lg,
            DesignSystem.spacing.sm,
            DesignSystem.spacing.md,
          ),
        },
      ]}
    >
      <Animated.Text
        style={[
          styles.headline,
          { color: colors.text },
          isTablet && {
            fontSize: styles.headline.fontSize * fontMultiplier,
            lineHeight: styles.headline.lineHeight * fontMultiplier,
            marginBottom: getResponsiveValue(
              DesignSystem.spacing.md,
              DesignSystem.spacing.lg,
              DesignSystem.spacing.xl,
            ),
          },
        ]}
        entering={headlineEntering}
      >
        Never miss home maintenance again.
      </Animated.Text>
      <Animated.Text
        style={[
          styles.subtitle,
          { color: colors.textSecondary },
          isTablet && {
            fontSize: styles.subtitle.fontSize * fontMultiplier,
            lineHeight: styles.subtitle.lineHeight * fontMultiplier,
          },
        ]}
        entering={subtitleEntering}
      >
        Track, schedule, and complete home maintenance.
      </Animated.Text>
    </View>
  );
}
