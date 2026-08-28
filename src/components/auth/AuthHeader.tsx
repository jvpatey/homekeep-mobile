import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion, useScalePress } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";

interface AuthHeaderProps {
  title: string;
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
  const reducedMotion = useReducedMotion();
  const { animatedStyle, onPressIn, onPressOut } = useScalePress(0.96);

  const Wrapper = animated && !reducedMotion ? Animated.View : View;
  const entering =
    animated && !reducedMotion
      ? FadeIn.duration(DesignSystem.motion.duration.fast)
      : undefined;

  return (
    <Wrapper
      {...(entering ? { entering } : {})}
      style={styles.container}
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
              size={28}
              color={colors.text}
            />
          </Animated.View>
        </Pressable>
      ) : (
        <View style={styles.backPlaceholder} />
      )}

      <Text
        style={[styles.title, { color: colors.text }]}
        maxFontSizeMultiplier={1.3}
      >
        {title}
      </Text>

      {!!subtitle && (
        <Text
          style={[styles.subtitle, { color: colors.textSecondary }]}
          maxFontSizeMultiplier={1.4}
        >
          {subtitle}
        </Text>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: DesignSystem.spacing.lg,
  },
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
