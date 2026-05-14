import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useHaptics, useDevice } from "../../hooks";
import { styles } from "./styles";
import { DesignSystem } from "../../theme/designSystem";

interface OAuthButtonsProps {
  onSuccess?: () => void;
  disabled?: boolean;
  animatedStyle?: any; // This is for Animated.View style prop - should be left typed as any
}

// OAuthButtons - A component that provides Google OAuth sign-in functionality
export function OAuthButtons({
  onSuccess,
  disabled = false,
  animatedStyle,
}: OAuthButtonsProps) {
  const { colors } = useTheme();
  const { signInWithApple } = useAuth();
  const { triggerMedium, triggerError, triggerSuccess } = useHaptics();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const fontMultiplier = getFontMultiplier();
  const [appleLoading, setAppleLoading] = useState(false);

  // Handles Apple OAuth sign-in process with haptic feedback and error handling
  const handleAppleSignIn = async () => {
    if (disabled) return;

    // Provide haptic feedback for button press
    triggerMedium();
    setAppleLoading(true);

    try {
      const { data, error } = await signInWithApple();

      if (error) {
        // Haptic feedback for error
        triggerError();
        Alert.alert(
          "Sign In Error",
          error.message || "Failed to sign in with Apple"
        );
      } else if (data?.session) {
        // Haptic feedback for success
        triggerSuccess();
        onSuccess?.();
      }
    } catch (error) {
      // Handle unexpected errors
      triggerError();
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* "or" text without divider lines */}
      <Text
        style={[
          styles.orText,
          { color: colors.textSecondary },
          isTablet && {
            marginHorizontal: 0,
            marginTop: getResponsiveValue(
              DesignSystem.spacing.md,
              DesignSystem.spacing.lg,
              DesignSystem.spacing.lg,
            ),
            marginBottom: getResponsiveValue(
              DesignSystem.spacing.md,
              DesignSystem.spacing.lg,
              DesignSystem.spacing.lg,
            ),
            fontSize: DesignSystem.typography.body.fontSize * fontMultiplier,
          },
        ]}
      >
        or
      </Text>

      {/* Apple Sign In Button */}
      <TouchableOpacity
        onPress={handleAppleSignIn}
        disabled={disabled || appleLoading}
        activeOpacity={0.8}
        style={{
          marginHorizontal: isTablet ? 0 : DesignSystem.spacing.md,
        }}
      >
        <View
          style={[
            styles.appleButton,
            {
              backgroundColor: colors.glass,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 3,
              minHeight: isTablet
                ? getResponsiveValue(52, 56, 60)
                : styles.appleButton.minHeight,
              paddingVertical: isTablet
                ? getResponsiveValue(
                    DesignSystem.spacing.md,
                    DesignSystem.spacing.md + 2,
                    DesignSystem.spacing.lg,
                  )
                : DesignSystem.spacing.md,
            },
          ]}
        >
          <View style={styles.buttonContent}>
            <View style={styles.googleIconContainer}>
              {appleLoading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Ionicons
                  name="logo-apple"
                  size={isTablet ? 22 * fontMultiplier : 18}
                  color={colors.text}
                />
              )}
            </View>
            <Text
              style={[
                styles.buttonLabel,
                {
                  color: colors.text,
                  fontWeight: "600",
                  fontSize: (isTablet ? 18 : 16) * fontMultiplier,
                },
              ]}
            >
              {appleLoading ? "Signing in..." : "Continue with Apple"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
