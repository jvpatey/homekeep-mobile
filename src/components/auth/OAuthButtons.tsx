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
  const { signInWithGoogle, signInWithApple } = useAuth();
  const { accentGradient, isDark } = useGradients();
  const { triggerMedium, triggerError, triggerSuccess } = useHaptics();
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  // Handles Google OAuth sign-in process with haptic feedback and error handling
  const handleGoogleSignIn = async () => {
    if (disabled) return;

    // Provide haptic feedback for button press
    triggerMedium();
    setLoading(true);

    try {
      const { data, error } = await signInWithGoogle();

      if (error) {
        // Haptic feedback for error
        triggerError();
        Alert.alert(
          "Sign In Error",
          error.message || "Failed to sign in with Google"
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
      setLoading(false);
    }
  };

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

      {/* Google Sign In Button with gradient background */}
      <TouchableOpacity
        onPress={handleGoogleSignIn}
        disabled={disabled || loading}
        style={[
          styles.gradientButton,
          { marginHorizontal: DesignSystem.spacing.md },
        ]}
      >
        <LinearGradient
          colors={accentGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.googleButton}
        >
          <View style={styles.buttonContent}>
            <View style={styles.googleIconContainer}>
              {loading ? (
                <ActivityIndicator size={16} color="white" />
              ) : (
                <AntDesign name="google" size={16} color="white" />
              )}
            </View>
            <Text style={[styles.buttonLabel, { color: "white" }]}>
              {loading ? "Signing in..." : "Continue with Google"}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Apple Sign In Button with custom styling to match Google button */}
      <TouchableOpacity
        onPress={handleAppleSignIn}
        disabled={disabled || appleLoading}
        style={[
          styles.gradientButton,
          {
            marginHorizontal: DesignSystem.spacing.md,
            marginTop: DesignSystem.spacing.sm,
          },
        ]}
      >
        <LinearGradient
          colors={isDark ? ["#000000", "#333333"] : ["#000000", "#1a1a1a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.appleButton}
        >
          <View style={styles.buttonContent}>
            <View style={styles.googleIconContainer}>
              {appleLoading ? (
                <ActivityIndicator size={16} color="white" />
              ) : (
                <AntDesign name="apple1" size={16} color="white" />
              )}
            </View>
            <Text style={[styles.buttonLabel, { color: "white" }]}>
              {appleLoading ? "Signing in..." : "Continue with Apple"}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}
