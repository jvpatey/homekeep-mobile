import React, { useState } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity } from "react-native";
import { TextInput, HelperText } from "react-native-paper";
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
 * LoginScreen - Handles user authentication with email/password and OAuth
 * Provides form validation, error handling, and integration with Supabase auth
 * Includes OAuth options and email verification link for password reset
 * Updated with modern 2025 design language matching the dashboard
 */
export function LoginScreen() {
  const { colors } = useTheme();
  const { isConfigured, signIn } = useAuth();
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
    email: { required: true, email: true },
    password: { required: true },
  });

  const email = getFieldValue("email");
  const password = getFieldValue("password");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Handles the sign-in process with validation and error handling
   */
  const handleSignIn = async () => {
    triggerMedium();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        triggerError();
        Alert.alert("Sign In Error", error.message);
      } else {
        triggerSuccess();
        // User is automatically redirected to dashboard on successful sign in
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
   * Navigates to email entry for verification
   */
  const handleEmailVerification = () => {
    triggerLight();
    navigation.navigate("EmailVerification");
  };

  /**
   * Navigates to sign up screen
   */
  const handleSignUp = () => {
    triggerLight();
    navigation.navigate("SignUp");
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

          <Text style={[authStyles.title, { color: colors.text }]}>
            Welcome Back
          </Text>
          <Text style={[authStyles.subtitle, { color: colors.textSecondary }]}>
            Sign in to continue managing your home
          </Text>
        </Animated.View>

        {/* Form Section */}
        <Animated.View style={[authStyles.formCard, formAnimatedStyle]}>
          <View style={authStyles.formContent}>
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
              autoComplete="password"
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

            <TouchableOpacity
              onPress={handleEmailVerification}
              style={authStyles.verificationContainer}
            >
              <Text
                style={[authStyles.verificationText, { color: colors.primary }]}
              >
                Forgot your password?
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Sign In Button */}
        <Animated.View
          style={[authStyles.buttonContainer, buttonAnimatedStyle]}
        >
          <TouchableOpacity
            onPress={handleSignIn}
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
                  {loading ? "Signing In..." : "Sign In"}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* OAuth Section */}
        <OAuthButtons />

        {/* Sign Up Link */}
        <View style={authStyles.linkContainer}>
          <Text style={[authStyles.linkText, { color: colors.textSecondary }]}>
            Don't have an account?{" "}
            <Text
              style={[authStyles.link, { color: colors.primary }]}
              onPress={handleSignUp}
            >
              Sign up
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
