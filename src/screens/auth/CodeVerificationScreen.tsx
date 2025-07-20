import React, { useState } from "react";
import { View, Text, Alert, TouchableOpacity } from "react-native";
import { Button, TextInput, Card } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { LogoSection } from "../../components/LogoSection/LogoSection";
import { useAuthAnimation, useDynamicSpacing, useAuthHaptics } from "./hooks";
import { authStyles } from "./styles/authStyles";

/**
 * CodeVerificationScreen - Handles email verification code input and validation
 * Allows users to enter a 6-digit verification code sent to their email
 * and provides options to resend the code if needed.
 */
export function CodeVerificationScreen() {
  const { colors, isDark } = useTheme();
  const { supabase } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();

  // Shared hooks
  const formAnimatedStyle = useAuthAnimation();
  const { dynamicTopSpacing } = useDynamicSpacing();
  const { triggerSuccess, triggerError, triggerLight } = useAuthHaptics();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get email from route params (passed from signup)
  const params = route.params as any;
  const email = params?.email || "";

  /**
   * Validates and submits the verification code
   */
  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit code");
      triggerError();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        triggerSuccess();
        Alert.alert(
          "Email Verified!",
          "Your account has been verified successfully. Welcome to HomeKeep!",
          [
            {
              text: "Continue",
              onPress: () => {},
            },
          ]
        );
      } else {
        throw new Error("Verification completed but no session created");
      }
    } catch (error: any) {
      console.error("Code verification error:", error);
      triggerError();

      let errorMessage = "Invalid or expired code. Please try again.";
      if (error.message?.includes("expired")) {
        errorMessage =
          "This verification code has expired. Please request a new one.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles back navigation with haptic feedback
   */
  const handleBackPress = () => {
    triggerLight();
    navigation.goBack();
  };

  /**
   * Resends verification code to user's email
   */
  const handleResendCode = async () => {
    if (!email) {
      Alert.alert(
        "Error",
        "Email address not found. Please go back and sign up again."
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: "homekeep://auth/verify",
        },
      });

      if (error) {
        throw error;
      }

      triggerSuccess();
      Alert.alert(
        "Code Sent",
        "A new verification code has been sent to your email."
      );
    } catch (error: any) {
      triggerError();
      Alert.alert(
        "Error",
        error.message || "Failed to resend code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Define gradient colors for the button based on theme
  const gradientColors = (
    isDark
      ? [colors.primary, colors.secondary]
      : [colors.primary, colors.secondary]
  ) as [string, string];

  return (
    <View
      style={[authStyles.container, { backgroundColor: colors.background }]}
    >
      <View style={[authStyles.content, { paddingTop: dynamicTopSpacing }]}>
        <LogoSection showText={false} compact={true} />

        <Animated.View style={formAnimatedStyle}>
          <Card
            style={[authStyles.formCard, { backgroundColor: colors.surface }]}
            elevation={2}
          >
            <Card.Content style={authStyles.formContent}>
              {/* Header section with title and email display */}
              <View style={authStyles.headerContainer}>
                <Text style={[authStyles.title, { color: colors.text }]}>
                  Verify Your Email
                </Text>
                <Text
                  style={[authStyles.subtitle, { color: colors.textSecondary }]}
                >
                  Enter the 6-digit code sent to
                </Text>
                <Text style={[authStyles.email, { color: colors.primary }]}>
                  {email}
                </Text>
              </View>

              {/* Verification code input */}
              <TextInput
                label="Verification Code"
                value={code}
                onChangeText={(text) => {
                  setCode(text.replace(/[^0-9]/g, "").substring(0, 6));
                  setError("");
                }}
                mode="outlined"
                style={[
                  authStyles.input,
                  {
                    fontSize: 18,
                    textAlign: "center",
                    letterSpacing: 4,
                  },
                ]}
                error={!!error}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="123456"
                autoComplete="one-time-code"
                left={<TextInput.Icon icon="lock-check" />}
                theme={{
                  colors: {
                    primary: colors.primary,
                    outline: error ? colors.error : colors.border,
                    surface: colors.surface,
                    background: colors.surface,
                    onSurface: colors.text,
                    onSurfaceVariant: colors.textSecondary,
                  },
                }}
              />

              {/* Error message display */}
              {error ? (
                <Text style={[authStyles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
              ) : null}

              {/* Verify button with gradient background */}
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[authStyles.gradientButton, { marginTop: 24 }]}
              >
                <Button
                  mode="contained"
                  onPress={handleVerifyCode}
                  loading={loading}
                  disabled={loading || code.length !== 6}
                  style={authStyles.primaryButton}
                  contentStyle={authStyles.buttonContent}
                  labelStyle={[
                    authStyles.buttonLabel,
                    { color: isDark ? colors.text : "white" },
                  ]}
                >
                  Verify & Sign In
                </Button>
              </LinearGradient>

              {/* Resend code option */}
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={loading}
                style={authStyles.linkContainer}
              >
                <Text
                  style={[authStyles.linkText, { color: colors.textSecondary }]}
                >
                  Didn't receive a code?{" "}
                  <Text style={[authStyles.link, { color: colors.primary }]}>
                    Send again
                  </Text>
                </Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Back button */}
        <View style={authStyles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={handleBackPress}
            style={[authStyles.outlineButton, { borderColor: colors.primary }]}
            disabled={loading}
            contentStyle={authStyles.buttonContent}
            labelStyle={[
              authStyles.outlineButtonLabel,
              { color: colors.primary },
            ]}
          >
            Back
          </Button>
        </View>
      </View>
    </View>
  );
}
