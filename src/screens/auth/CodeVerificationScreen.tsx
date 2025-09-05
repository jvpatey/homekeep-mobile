import React, { useState } from "react";
import { View, Text, Alert, TouchableOpacity } from "react-native";
import { TextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { LogoSection } from "../../components/onboarding";
import { useAuthAnimation, useAuthHaptics } from "./hooks";
import { useDynamicSpacing } from "../../hooks";
import { authStyles } from "./styles/authStyles";
import { DesignSystem } from "../../theme/designSystem";

// CodeVerificationScreen for the CodeVerificationScreen on the home screen
export function CodeVerificationScreen() {
  const { colors, isDark } = useTheme();
  const { supabase } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const formAnimatedStyle = useAuthAnimation();
  const { dynamicTopSpacing } = useDynamicSpacing();
  const { triggerSuccess, triggerError, triggerLight } = useAuthHaptics();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const params = route.params as any;
  const email = params?.email || "";

  // handleVerifyCode for the handleVerifyCode on the home screen
  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit code");
      triggerError();
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!supabase) {
        throw new Error("Supabase not configured");
      }
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
    } catch (error) {
      const errorObj = error as Error;
      console.error("Code verification error:", errorObj);
      triggerError();

      let errorMessage = "Invalid or expired code. Please try again.";
      if (errorObj.message?.includes("expired")) {
        errorMessage =
          "This verification code has expired. Please request a new one.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // handleBackPress for the handleBackPress on the home screen
  const handleBackPress = () => {
    triggerLight();
    navigation.goBack();
  };

  // handleResendCode for the handleResendCode on the home screen
  const handleResendCode = async () => {
    triggerLight();
    setError("");

    try {
      if (!supabase) {
        throw new Error("Supabase not configured");
      }
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        throw error;
      }

      Alert.alert(
        "Code Resent",
        "A new verification code has been sent to your email."
      );
    } catch (error) {
      const errorObj = error as Error;
      console.error("Resend error:", errorObj);
      setError("Failed to resend code. Please try again.");
    }
  };

  // handleSignIn for the handleSignIn on the home screen
  const handleSignIn = () => {
    triggerLight();
    navigation.navigate("Login" as any);
  };

  // getInputTheme for the getInputTheme on the home screen
  const getInputTheme = () => ({
    colors: {
      primary: colors.primary,
      outline: error ? colors.error : colors.border,
      surface: colors.surface,
      background: colors.surface,
      onSurface: colors.text,
      onSurfaceVariant: colors.textSecondary,
    },
  });

  return (
    <View
      style={[authStyles.container, { backgroundColor: colors.background }]}
    >
      <View style={{ paddingTop: dynamicTopSpacing, flex: 1 }}>
        {/* Header */}
        <View style={authStyles.headerContainer}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              padding: DesignSystem.spacing.sm,
              zIndex: 10,
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 18 }}>← Back</Text>
          </TouchableOpacity>

          <LogoSection showText={false} compact={true} />

          <Text style={[authStyles.largeTitle, { color: colors.text }]}>
            Verify Your Email
          </Text>
          <Text style={[authStyles.subtitle, { color: colors.textSecondary }]}>
            Enter the 6-digit code sent to {email}
          </Text>
        </View>

        {/* Form Section */}
        <Animated.View style={[authStyles.formCard, formAnimatedStyle]}>
          <View style={authStyles.formContent}>
            <TextInput
              label="Verification Code"
              value={code}
              onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ""))}
              style={authStyles.input}
              theme={getInputTheme()}
              keyboardType="numeric"
              maxLength={6}
              placeholder="123456"
              autoFocus
            />
            {error && (
              <Text style={[authStyles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Verify Button */}
        <View style={authStyles.buttonContainer}>
          <TouchableOpacity
            onPress={handleVerifyCode}
            disabled={loading || code.length !== 6}
            style={[
              authStyles.primaryButton,
              {
                backgroundColor: colors.primary,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 6,
                opacity: code.length !== 6 ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[authStyles.buttonLabel, { color: "white" }]}>
              {loading ? "Verifying..." : "Verify Code"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Resend Code */}
        <View style={authStyles.linkContainer}>
          <Text style={[authStyles.linkText, { color: colors.textSecondary }]}>
            Didn't receive the code?{" "}
            <Text
              style={[authStyles.link, { color: colors.primary }]}
              onPress={handleResendCode}
            >
              Resend
            </Text>
          </Text>
        </View>

        {/* Sign In Link */}
        <View style={authStyles.linkContainer}>
          <Text style={[authStyles.linkText, { color: colors.textSecondary }]}>
            Already verified?{" "}
            <Text
              style={[authStyles.link, { color: colors.primary }]}
              onPress={handleSignIn}
            >
              Sign in
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
