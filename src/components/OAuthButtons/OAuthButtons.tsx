import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Button, ActivityIndicator } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useGradients, useHaptics } from "../../hooks";
import { styles } from "./styles";

interface OAuthButtonsProps {
  onSuccess?: () => void;
  disabled?: boolean;
}

/**
 * OAuthButtons - A component that provides Google OAuth sign-in functionality
 * with haptic feedback, loading states, and error handling. Displays a divider
 * with "or" text and a gradient-styled Google sign-in button.
 */
export function OAuthButtons({
  onSuccess,
  disabled = false,
}: OAuthButtonsProps) {
  const { colors } = useTheme();
  const { signInWithGoogle } = useAuth();
  const { accentGradient, isDark } = useGradients();
  const { triggerMedium, triggerError, triggerSuccess } = useHaptics();
  const [loading, setLoading] = useState(false);

  /**
   * Handles Google OAuth sign-in process with haptic feedback and error handling
   */
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
    } catch (error: any) {
      // Handle unexpected errors
      triggerError();
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
      <LinearGradient
        colors={accentGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientButton}
      >
        <Button
          mode="contained"
          onPress={handleGoogleSignIn}
          loading={loading}
          disabled={disabled || loading}
          style={styles.googleButton}
          contentStyle={styles.buttonContent}
          labelStyle={[
            styles.buttonLabel,
            { color: isDark ? colors.text : "white" },
          ]}
          icon={() => (
            <View style={styles.googleIconContainer}>
              {loading ? (
                <ActivityIndicator size={16} color="white" />
              ) : (
                <AntDesign name="google" size={16} color="white" />
              )}
            </View>
          )}
        >
          {loading ? "Signing in..." : "Continue with Google"}
        </Button>
      </LinearGradient>
    </View>
  );
}
