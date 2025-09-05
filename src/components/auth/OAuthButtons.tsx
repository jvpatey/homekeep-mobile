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
import { AntDesign } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useGradients, useHaptics } from "../../hooks";
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
  const { isDark } = useGradients();
  const { triggerMedium, triggerError, triggerSuccess } = useHaptics();
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
      {/* Visual divider with "or" text */}
      <View style={styles.dividerContainer}>
        <View
          style={[styles.dividerLine, { backgroundColor: colors.border }]}
        />
        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
          or
        </Text>
        <View
          style={[styles.dividerLine, { backgroundColor: colors.border }]}
        />
      </View>

      {/* Apple Sign In Button */}
      <TouchableOpacity
        onPress={handleAppleSignIn}
        disabled={disabled || appleLoading}
        style={[
          styles.appleButton,
          {
            backgroundColor: colors.surface,
            borderWidth: 2,
            borderColor: colors.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 3,
            marginHorizontal: DesignSystem.spacing.md,
          },
        ]}
      >
        <View style={styles.buttonContent}>
          <View style={styles.googleIconContainer}>
            {appleLoading ? (
              <ActivityIndicator size={16} color={colors.text} />
            ) : (
              <AntDesign name="apple1" size={16} color={colors.text} />
            )}
          </View>
          <Text style={[styles.buttonLabel, { color: colors.text }]}>
            {appleLoading ? "Signing in..." : "Continue with Apple"}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
