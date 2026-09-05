import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useDevice, useReducedMotion, useScalePress } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";

interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  animated?: boolean;
}

export function AuthHeader({
  title,
  subtitle,
  onBack,
  animated = true,
}: AuthHeaderProps) {
  const { colors } = useTheme();
  const { isRegularWidth, getResponsiveValue } = useDevice();
  const reducedMotion = useReducedMotion();
  const { animatedStyle, onPressIn, onPressOut } = useScalePress(0.96);

  const titleFontSize = isRegularWidth
    ? getResponsiveValue(32, 36, 40)
    : DesignSystem.typography.title1.fontSize;
  const titleLineHeight = isRegularWidth
    ? getResponsiveValue(38, 42, 46)
    : DesignSystem.typography.title1.lineHeight;
  const subtitleFontSize = isRegularWidth
    ? getResponsiveValue(16, 17, 18)
    : DesignSystem.typography.callout.fontSize;
  const subtitleLineHeight = isRegularWidth
    ? getResponsiveValue(22, 24, 26)
    : DesignSystem.typography.callout.lineHeight;
  const headerPaddingBottom = isRegularWidth
    ? getResponsiveValue(
        DesignSystem.spacing.lg,
        DesignSystem.spacing.xl,
        DesignSystem.spacing.xl,
      )
    : DesignSystem.spacing.lg;
  const backIconSize = isRegularWidth ? getResponsiveValue(28, 30, 32) : 28;

  const Wrapper = animated && !reducedMotion ? Animated.View : View;
  const entering =
    animated && !reducedMotion
      ? FadeIn.duration(DesignSystem.motion.duration.fast)
      : undefined;

  return (
    <Wrapper
      {...(entering ? { entering } : {})}
      style={{ paddingBottom: headerPaddingBottom }}
    >
      {onBack ? (
        <Pressable
          onPress={onBack}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          hitSlop={8}
          style={styles.backHit}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Animated.View style={animatedStyle}>
            <Ionicons
              name="chevron-back"
              size={backIconSize}
              color={colors.text}
            />
          </Animated.View>
        </Pressable>
      ) : (
        <View style={styles.backPlaceholder} />
      )}

      {!!title && (
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: titleFontSize,
              lineHeight: titleLineHeight,
            },
          ]}
          maxFontSizeMultiplier={1.3}
        >
          {title}
        </Text>
      )}

      {!!subtitle && (
        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
              fontSize: subtitleFontSize,
              lineHeight: subtitleLineHeight,
            },
          ]}
          maxFontSizeMultiplier={1.4}
        >
          {subtitle}
        </Text>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  backHit: {
    minWidth: DesignSystem.components.minTouchTarget,
    minHeight: DesignSystem.components.minTouchTarget,
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.sm,
    marginLeft: -DesignSystem.spacing.xs,
  },
  backPlaceholder: {
    height: DesignSystem.spacing.sm,
  },
  title: {
    ...DesignSystem.typography.title1,
  },
  subtitle: {
    ...DesignSystem.typography.callout,
    marginTop: DesignSystem.spacing.sm,
  },
});
