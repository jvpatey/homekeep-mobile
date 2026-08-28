import React from "react";
import { View, Text, Alert, Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import Animated from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { styles } from "./styles";

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
  const { colors, isDark } = useTheme();
  const { signInWithApple } = useAuth();
  const { triggerMedium, triggerError, triggerSuccess } = useHaptics();

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

  if (Platform.OS !== "ios") {
    return null;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={[styles.orText, { color: colors.textSecondary }]}>or</Text>

      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={
          isDark
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={DesignSystem.borders.radius.round}
        style={styles.appleButton}
        onPress={handleAppleSignIn}
      />
    </Animated.View>
  );
}
