import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import Animated from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useScalePress } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  accessibilityLabel,
}: ButtonProps) {
  const { colors } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = useScalePress();
  const isDisabled = disabled || loading;

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: "transparent",
      labelColor: "#FFFFFF",
    },
    secondary: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      labelColor: colors.text,
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      labelColor: colors.primary,
    },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: variantStyles.backgroundColor,
            borderColor: variantStyles.borderColor,
            opacity: isDisabled ? 0.55 : 1,
          },
          variant !== "ghost" && DesignSystem.shadows.softKey,
          animatedStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === "primary" ? "#FFFFFF" : colors.primary}
          />
        ) : (
          <Text
            style={[
              styles.label,
              {
                color: variantStyles.labelColor,
              },
            ]}
          >
            {label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

/** Text-only link styled as a tertiary action. */
export function TextLink({
  prefix,
  linkText,
  onPress,
}: {
  prefix?: string;
  linkText: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={styles.textLinkContainer}
      accessibilityRole="link"
      accessibilityLabel={prefix ? `${prefix} ${linkText}` : linkText}
    >
      {prefix ? (
        <Text style={[styles.textLinkPrefix, { color: colors.textSecondary }]}>
          {prefix}{" "}
          <Text style={[styles.textLink, { color: colors.primary }]}>
            {linkText}
          </Text>
        </Text>
      ) : (
        <Text style={[styles.textLink, { color: colors.primary }]}>
          {linkText}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: DesignSystem.components.buttonLarge,
    borderRadius: DesignSystem.borders.radius.round,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: DesignSystem.spacing.xl,
    borderWidth: DesignSystem.borders.hairline,
  },
  label: {
    ...DesignSystem.typography.button,
    fontSize: 17,
  },
  textLinkContainer: {
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.sm,
    minHeight: DesignSystem.components.minTouchTarget,
    justifyContent: "center",
  },
  textLinkPrefix: {
    ...DesignSystem.typography.callout,
    textAlign: "center",
  },
  textLink: {
    fontWeight: "600",
  },
});
