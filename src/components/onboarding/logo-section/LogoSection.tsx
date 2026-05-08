import React from "react";
import { Image, Text } from "react-native";
import Animated from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { useLogoAnimation, useDevice } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import { styles } from "./styles";

interface LogoSectionProps {
  showText?: boolean;
  compact?: boolean;
}

/**
 * LogoSection — 2026 redesign.
 *
 * The wordmark renders as a solid `colors.text` Text element with tighter
 * tracking and an 800 weight. The previous tri-color masked gradient is
 * gone; iOS 26 type is monochrome and lets the halo behind the logo carry
 * any color story.
 */
export function LogoSection({
  showText = true,
  compact = false,
}: LogoSectionProps) {
  const { colors } = useTheme();
  const { entering } = useLogoAnimation(0);
  const { isTablet, getResponsiveValue, width, height } = useDevice();

  // Logo text should be even bigger on large iPads
  const logoTextMultiplier =
    isTablet && Math.max(width, height) > 1300
      ? 1.5 // 50% larger on iPad Pro 13-inch
      : isTablet
        ? 1.35 // 35% larger on standard iPad
        : 1;

  return (
    <Animated.View
      style={compact ? styles.logoContainerCompact : styles.logoContainer}
      entering={entering}
    >
      <Image
        source={require("../../../../assets/images/homekeep-logo.png")}
        style={[
          compact ? styles.logoCompact : styles.logo,
          isTablet && !compact && {
            width: getResponsiveValue(380, 520, 620),
            height: getResponsiveValue(190, 260, 310),
          },
        ]}
        resizeMode="contain"
      />
      {showText && (
        <Text
          style={[
            styles.logoText,
            { color: colors.text },
            isTablet && {
              fontSize: styles.logoText.fontSize * logoTextMultiplier,
              lineHeight: styles.logoText.lineHeight * logoTextMultiplier,
              marginTop: 0,
              marginBottom: getResponsiveValue(
                0,
                DesignSystem.spacing.sm,
                DesignSystem.spacing.md,
              ),
            },
          ]}
        >
          HomeKeep
        </Text>
      )}
    </Animated.View>
  );
}
