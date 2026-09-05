import React from "react";
import { Text, Alert } from "react-native";
import Animated from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useAppleAuthenticationAvailable, useHaptics } from "../../hooks";
import { styles } from "./styles";
import { AppleContinueButton } from "./AppleContinueButton";

interface OAuthButtonsProps {
  onSuccess?: () => void;
  disabled?: boolean;
  animatedStyle?: any;
}

export function OAuthButtons({
  onSuccess,
  disabled = false,
  animatedStyle,
}: OAuthButtonsProps) {
  const { colors } = useTheme();
  const { signInWithApple } = useAuth();
  const { triggerMedium, triggerError, triggerSuccess } = useHaptics();
  const appleAvailable = useAppleAuthenticationAvailable();

  const handleAppleSignIn = async () => {
    if (disabled) return;

    triggerMedium();

    try {
      const { data, error } = await signInWithApple();

      if (error) {
        triggerError();
        Alert.alert(
          "Sign In Error",
          error.message || "Failed to sign in with Apple",
        );
      } else if (data?.session) {
        triggerSuccess();
        onSuccess?.();
      }
    } catch {
      triggerError();
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
  };

  if (!appleAvailable) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={[styles.orText, { color: colors.textSecondary }]}>or</Text>

      <AppleContinueButton onPress={handleAppleSignIn} />
    </Animated.View>
  );
}
