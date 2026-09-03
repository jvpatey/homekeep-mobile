import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useDevice, useDynamicSpacing, useScalePress } from "../../hooks";
import { GlassCard } from "../ui/glass-card";
import { HouseMark } from "../ui/HouseMark";
import { DesignSystem } from "../../theme/designSystem";

interface AuthTopHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  animatedStyle?: any;
}

export function AuthTopHeader({
  title,
  subtitle,
  onBack,
  animatedStyle,
}: AuthTopHeaderProps) {
  const { colors } = useTheme();
  const { dynamicTopSpacing } = useDynamicSpacing();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const fontMultiplier = getFontMultiplier();

  // Parent hero containers already include their own top padding (e.g. `authStyles.heroSection`).
  // Only add the *extra* inset beyond that baseline to avoid a large gap on notched iPhones.
  // iPad uses a lower baseline so the hero stays compact; phones keep the original md baseline.
  const heroBaselineTopPadding = isTablet
    ? DesignSystem.spacing.sm
    : DesignSystem.spacing.md;
  const safeTopPadding = Math.max(0, dynamicTopSpacing - heroBaselineTopPadding);

  const {
    animatedStyle: backAnimatedStyle,
    onPressIn: onBackPressIn,
    onPressOut: onBackPressOut,
  } = useScalePress(0.98);

  const backChipRadius = getResponsiveValue(18, 20, 22);
  const backChipPaddingH = getResponsiveValue(
    DesignSystem.spacing.md,
    DesignSystem.spacing.lg,
    DesignSystem.spacing.lg,
  );
  const backChipPaddingV = getResponsiveValue(
    DesignSystem.spacing.xs,
    DesignSystem.spacing.sm,
    DesignSystem.spacing.sm,
  );
  const backChipMinWidth = getResponsiveValue(44, 48, 52);
  const brandLogoSize = isTablet
    ? getResponsiveValue(30, 36, 40)
    : 34;

  return (
    <Animated.View style={animatedStyle}>
      <View
        style={{
          width: "100%",
          paddingTop: safeTopPadding,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <View style={{ minWidth: backChipMinWidth, alignItems: "flex-start" }}>
            {onBack ? (
              <Pressable
                onPress={onBack}
                onPressIn={onBackPressIn}
                onPressOut={onBackPressOut}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <Animated.View style={backAnimatedStyle}>
                  <GlassCard
                    material="regular"
                    radius={backChipRadius}
                    style={{
                      paddingHorizontal: backChipPaddingH,
                      paddingVertical: backChipPaddingV,
                      minWidth: backChipMinWidth,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 18 * fontMultiplier,
                        fontWeight: "700",
                        opacity: 0.85,
                      }}
                    >
                      ‹
                    </Text>
                  </GlassCard>
                </Animated.View>
              </Pressable>
            ) : null}
          </View>

          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <HouseMark size={brandLogoSize} inline />
              <Text
                style={
                  isTablet
                    ? {
                        color: colors.textSecondary,
                        fontWeight: "700",
                        letterSpacing: -0.6,
                        fontSize: 18 * fontMultiplier,
                        lineHeight: 20 * fontMultiplier,
                        opacity: 0.9,
                      }
                    : {
                        color: colors.text,
                        fontWeight: "800",
                        letterSpacing: -0.6,
                        fontSize: 18,
                        lineHeight: 20,
                      }
                }
              >
                Home
                <Text style={{ color: colors.accent }}>Keep</Text>
              </Text>
            </View>
          </View>

          {/* Spacer to keep brand perfectly centered */}
          <View style={{ minWidth: backChipMinWidth }} />
        </View>
      </View>

      <View
        style={{
          marginTop: isTablet
            ? getResponsiveValue(
                DesignSystem.spacing.md,
                DesignSystem.spacing.sm,
                DesignSystem.spacing.xs,
              )
            : DesignSystem.spacing.lg,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            ...DesignSystem.typography.h1,
            color: colors.text,
            textAlign: "center",
            marginBottom: isTablet
              ? DesignSystem.spacing.sm
              : DesignSystem.spacing.md,
            fontSize: DesignSystem.typography.h1.fontSize * fontMultiplier,
            lineHeight: DesignSystem.typography.h1.lineHeight * fontMultiplier,
          }}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text
            style={{
              ...DesignSystem.typography.body,
              color: colors.textSecondary,
              textAlign: "center",
              fontSize: DesignSystem.typography.body.fontSize * fontMultiplier,
              lineHeight: DesignSystem.typography.body.lineHeight * fontMultiplier,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

