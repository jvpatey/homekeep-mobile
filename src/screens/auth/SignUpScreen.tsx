import React, { useState } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity } from "react-native";
import { TextInput, HelperText, ProgressBar } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { GradientDivider } from "../../components/GradientDivider/GradientDivider";
import { LogoSection } from "../../components/LogoSection/LogoSection";
import { OAuthButtons } from "../../components/OAuthButtons/OAuthButtons";
import {
  useAuthStaggeredAnimation,
  useDynamicSpacing,
  useAuthHaptics,
  useAuthForm,
  useAuthGradient,
  useAuthInputTheme,
} from "./hooks";
import { authStyles } from "./styles/authStyles";
import { DesignSystem } from "../../theme/designSystem";

/**
 * SignUpScreen - Handles user registration with comprehensive form validation
 * Provides progress tracking, field validation, and integration with Supabase auth
 * Includes OAuth options and automatic profile creation via database triggers
 * Updated with modern 2025 design language matching the dashboard
 */
export function SignUpScreen() {
  const { colors } = useTheme();
  const { isConfigured, signUp } = useAuth();
  const navigation = useNavigation();

  // Shared hooks
  const { dynamicTopSpacing, dynamicBottomSpacing } = useDynamicSpacing();
  const { triggerMedium, triggerError, triggerSuccess, triggerLight } =
    useAuthHaptics();
  const { gradientColors, isDark } = useAuthGradient();
  const { getInputTheme } = useAuthInputTheme();
  const { headerAnimatedStyle, formAnimatedStyle, buttonAnimatedStyle } =
    useAuthStaggeredAnimation();

  // Form management with validation
  const { errors, setFieldValue, validateForm, getFieldValue } = useAuthForm({
    fullName: { required: true, minLength: 2 },
    email: { required: true, email: true },
    password: { required: true, minLength: 6 },
    confirmPassword: { required: true, match: "password" },
  });

  const fullName = getFieldValue("fullName");
  const email = getFieldValue("email");
  const password = getFieldValue("password");
  const confirmPassword = getFieldValue("confirmPassword");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /**
   * Calculates form completion progress based on filled fields
   */
  const getFormProgress = () => {
    const fields = [fullName, email, password, confirmPassword];
    const filledFields = fields.filter((field) => field.trim() !== "").length;
    return filledFields / fields.length;
  };

  /**
   * Handles the sign-up process with validation and error handling
   */
  const handleSignUp = async () => {
    triggerMedium();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data, error } = await signUp(email, password, fullName);

      if (error) {
        triggerError();
        Alert.alert("Sign Up Error", error.message);
      } else {
        triggerSuccess();
        Alert.alert(
          "Account Created!",
          "Please check your email to verify your account. You can click the verification link for automatic sign-in, or use the 6-digit code manually in the app.",
          [
            {
              text: "Enter Code Manually",
              style: "default",
              onPress: () =>
                (navigation as any).navigate("CodeVerification", { email }),
            },
            {
              text: "OK",
              style: "default",
            },
          ]
        );
      }
    } catch (error) {
      triggerError();
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
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
   * Handles password visibility toggle with haptic feedback
   */
  const handlePasswordToggle = () => {
    triggerLight();
    setShowPassword(!showPassword);
  };

  /**
   * Handles confirm password visibility toggle with haptic feedback
   */
  const handleConfirmPasswordToggle = () => {
    triggerLight();
    setShowConfirmPassword(!showConfirmPassword);
  };

  /**
   * Navigates to sign in screen
   */
  const handleSignIn = () => {
    triggerLight();
    navigation.navigate("Login");
  };

  return (
    <View
      style={[authStyles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={authStyles.scrollView}
        contentContainerStyle={[
          authStyles.scrollContent,
          {
            paddingTop: dynamicTopSpacing,
            paddingBottom: dynamicBottomSpacing,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animated.View
          style={[authStyles.headerContainer, headerAnimatedStyle]}
        >
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
            Create Account
          </Text>
          <Text style={[authStyles.subtitle, { color: colors.textSecondary }]}>
            Join HomeKeep to start managing your home maintenance
          </Text>

          {/* Progress Bar */}
          <View style={authStyles.progressContainer}>
            <Text
              style={[
                authStyles.progressLabel,
                { color: colors.textSecondary },
              ]}
            >
              Form Progress
            </Text>
            <ProgressBar
              progress={getFormProgress()}
              color={colors.primary}
              style={authStyles.progressBar}
            />
          </View>
        </Animated.View>

        {/* Form Section */}
        <Animated.View style={[authStyles.formCard, formAnimatedStyle]}>
          <View style={authStyles.formContent}>
            <TextInput
              label="Full Name"
              value={fullName}
              onChangeText={(text) => setFieldValue("fullName", text)}
              style={authStyles.input}
              theme={getInputTheme()}
              autoCapitalize="words"
              autoComplete="name"
            />
            {errors.fullName && (
              <HelperText type="error" visible={!!errors.fullName}>
                {errors.fullName}
              </HelperText>
            )}

            <TextInput
              label="Email"
              value={email}
              onChangeText={(text) => setFieldValue("email", text)}
              style={authStyles.input}
              theme={getInputTheme()}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            {errors.email && (
              <HelperText type="error" visible={!!errors.email}>
                {errors.email}
              </HelperText>
            )}

            <TextInput
              label="Password"
              value={password}
              onChangeText={(text) => setFieldValue("password", text)}
              style={authStyles.input}
              theme={getInputTheme()}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={handlePasswordToggle}
                />
              }
            />
            {errors.password && (
              <HelperText type="error" visible={!!errors.password}>
                {errors.password}
              </HelperText>
            )}

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={(text) => setFieldValue("confirmPassword", text)}
              style={authStyles.input}
              theme={getInputTheme()}
              secureTextEntry={!showConfirmPassword}
              autoComplete="new-password"
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? "eye-off" : "eye"}
                  onPress={handleConfirmPasswordToggle}
                />
              }
            />
            {errors.confirmPassword && (
              <HelperText type="error" visible={!!errors.confirmPassword}>
                {errors.confirmPassword}
              </HelperText>
            )}
          </View>
        </Animated.View>

        {/* Sign Up Button */}
        <Animated.View
          style={[authStyles.buttonContainer, buttonAnimatedStyle]}
        >
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            style={authStyles.gradientButton}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={authStyles.primaryButton}
            >
              <View style={authStyles.buttonContent}>
                <Text style={[authStyles.buttonLabel, { color: "white" }]}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* OAuth Section */}
        <OAuthButtons />

        {/* Sign In Link */}
        <View style={authStyles.linkContainer}>
          <Text style={[authStyles.linkText, { color: colors.textSecondary }]}>
            Already have an account?{" "}
            <Text
              style={[authStyles.link, { color: colors.primary }]}
              onPress={handleSignIn}
            >
              Sign in
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
