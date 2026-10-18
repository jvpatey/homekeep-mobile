import React, { useState } from "react";
import { Text, Alert, View } from "react-native";
import Animated from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useAppleAuthenticationAvailable, useHaptics } from "../../hooks";
import { offerBiometricLogin } from "../../utils/offerBiometricLogin";
import { styles } from "./styles";
import { AppleContinueButton } from "./AppleContinueButton";
import { GoogleContinueButton } from "./GoogleContinueButton";
import { DesignSystem } from "../../theme/designSystem";

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
  const { signInWithApple, signInWithGoogle } = useAuth();
  const { triggerMedium, triggerError, triggerSuccess } = useHaptics();
  const appleAvailable = useAppleAuthenticationAvailable();
  const [busy, setBusy] = useState(false);

  const handleAppleSignIn = async () => {
    if (disabled || busy) return;

    triggerMedium();
    setBusy(true);

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
        void offerBiometricLogin(data.session);
        onSuccess?.();
      }
    } catch {
      triggerError();
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (disabled || busy) return;

    triggerMedium();
    setBusy(true);

    try {
      const { data, error } = await signInWithGoogle();

      if (error) {
        triggerError();
        Alert.alert(
          "Sign In Error",
          error.message || "Failed to sign in with Google",
        );
      } else if (data?.session) {
        triggerSuccess();
        void offerBiometricLogin(data.session);
        onSuccess?.();
      }
    } catch {
      triggerError();
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={[styles.orText, { color: colors.textSecondary }]}>or</Text>

      <View style={{ gap: DesignSystem.spacing.sm }}>
        <GoogleContinueButton
          onPress={handleGoogleSignIn}
          disabled={disabled || busy}
        />
        {appleAvailable ? (
          <AppleContinueButton
            onPress={handleAppleSignIn}
            // Apple button ignores disabled; busy gate is in handler
          />
        ) : null}
      </View>
    </Animated.View>
  );
}
