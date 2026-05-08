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
  /** Optional brand accent: render "Keep" in `colors.accent`. */
  accentKeep?: boolean;
  /** Slightly larger/tighter wordmark for hero contexts (e.g. Welcome). */
  variant?: "default" | "hero";
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
  accentKeep = false,
  variant = "default",
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
          variant === "hero" && !compact && { marginBottom: -10 },
          isTablet && !compact && {
            width: getResponsiveValue(380, 520, 620),
            height: getResponsiveValue(190, 260, 310),
          },
          variant === "hero" && isTablet && !compact && { marginBottom: -14 },
        ]}
        resizeMode="contain"
      />
      {showText && (
        <Text
          style={[
            styles.logoText,
            { color: colors.text },
            variant === "hero" && !compact && {
              fontSize: styles.logoText.fontSize * 1.1,
              lineHeight: styles.logoText.lineHeight * 1.1,
              marginTop: -16,
            },
            isTablet && {
              fontSize:
                styles.logoText.fontSize *
                logoTextMultiplier *
                (variant === "hero" && !compact ? 1.06 : 1),
              lineHeight:
                styles.logoText.lineHeight *
                logoTextMultiplier *
                (variant === "hero" && !compact ? 1.06 : 1),
              marginTop: variant === "hero" && !compact ? -22 : 0,
              marginBottom: getResponsiveValue(
                0,
                DesignSystem.spacing.sm,
                DesignSystem.spacing.md,
              ),
            },
          ]}
        >
          Home
          {accentKeep ? (
            <Text style={{ color: colors.accent }}>Keep</Text>
          ) : (
            "Keep"
          )}
        </Text>
      )}
    </Animated.View>
  );
}
