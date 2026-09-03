import React from "react";
import { Text } from "react-native";
import Animated from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { useLogoAnimation, useDevice } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import { HouseMark } from "../../ui/HouseMark";
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
 * LogoSection — HouseMark + wordmark, matching welcome and dashboard.
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

  const logoTextMultiplier =
    isTablet && Math.max(width, height) > 1300
      ? 1.5
      : isTablet
        ? 1.35
        : 1;

  const markSize = compact
    ? 56
    : isTablet
      ? getResponsiveValue(140, 180, 220)
      : variant === "hero"
        ? 132
        : 120;

  return (
    <Animated.View
      style={compact ? styles.logoContainerCompact : styles.logoContainer}
      entering={entering}
    >
      <HouseMark
        size={markSize}
        style={
          variant === "hero" && !compact
            ? { marginBottom: isTablet ? 8 : 4 }
            : undefined
        }
      />
      {showText && (
        <Text
          style={[
            styles.logoText,
            { color: colors.text },
            variant === "hero" &&
              !compact && {
                fontSize: styles.logoText.fontSize * 1.1,
                lineHeight: styles.logoText.lineHeight * 1.1,
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
