import React from "react";
import { View, Image, Text } from "react-native";
import Animated from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useTheme } from "../../../context/ThemeContext";
import { useLogoAnimation, useDevice } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import { styles } from "./styles";

interface LogoSectionProps {
  showText?: boolean;
  compact?: boolean;
}

// LogoSection component for the LogoSection on the onboarding screen
export function LogoSection({
  showText = true,
  compact = false,
}: LogoSectionProps) {
  const { colors, isDark } = useTheme();
  const animatedStyle = useLogoAnimation(0);
  const { isTablet, getResponsiveValue, getFontMultiplier, width, height } = useDevice();
  
  const fontMultiplier = getFontMultiplier();
  // Logo text should be even bigger on large iPads
  const logoTextMultiplier = isTablet && Math.max(width, height) > 1300 
    ? 1.5  // 50% larger on iPad Pro 13-inch
    : isTablet 
    ? 1.35 // 35% larger on standard iPad
    : 1;

  const gradientColors = isDark
    ? [colors.primary, colors.secondary, colors.accent]
    : [colors.primary, colors.secondary, colors.accent];

  return (
    <Animated.View
      style={[
        compact ? styles.logoContainerCompact : styles.logoContainer,
        animatedStyle,
      ]}
    >
      <Image
        source={require("../../../../assets/images/homekeep-logo.png")}
        style={[
          compact ? styles.logoCompact : styles.logo,
          isTablet && !compact && {
            width: getResponsiveValue(380, 520, 620), // Bigger logo for iPads: 520px for standard, 620px for iPad Pro 13"
            height: getResponsiveValue(190, 260, 310), // Proportional height
          },
        ]}
        resizeMode="contain"
      />
      {showText && (
        <MaskedView maskElement={<Text style={[
          styles.logoText,
          isTablet && {
            fontSize: styles.logoText.fontSize * logoTextMultiplier,
            lineHeight: styles.logoText.lineHeight * logoTextMultiplier,
            marginTop: getResponsiveValue(
              DesignSystem.spacing.sm,
              0,
              0,
            ),
            marginBottom: getResponsiveValue(
              0,
              DesignSystem.spacing.sm,
              DesignSystem.spacing.md,
            ),
          },
        ]}>HomeKeep</Text>}>
          <LinearGradient
            colors={gradientColors}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[
              styles.logoText,
              { opacity: 0 },
              isTablet && {
                fontSize: styles.logoText.fontSize * logoTextMultiplier,
                lineHeight: styles.logoText.lineHeight * logoTextMultiplier,
                marginTop: getResponsiveValue(
                  DesignSystem.spacing.sm,
                  DesignSystem.spacing.md,
                  DesignSystem.spacing.lg,
                ),
                marginBottom: getResponsiveValue(
                  0,
                  DesignSystem.spacing.md,
                  DesignSystem.spacing.lg,
                ),
              },
            ]}>HomeKeep</Text>
          </LinearGradient>
        </MaskedView>
      )}
    </Animated.View>
  );
}
