import React, { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import {
  Button,
  TextInput,
  HelperText,
  Card,
  ProgressBar,
} from "react-native-paper";
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

/**
 * SignUpScreen - Handles user registration with comprehensive form validation
 * Provides progress tracking, field validation, and integration with Supabase auth
 * Includes OAuth options and automatic profile creation via database triggers
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
              onPress: () => navigation.goBack(),
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

  const formProgress = getFormProgress();

  return (
    <ScrollView
      style={[authStyles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: dynamicTopSpacing,
        paddingBottom: dynamicBottomSpacing,
        flexGrow: 1,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={authStyles.content}>
        {/* Logo Section */}
        <LogoSection showText={false} compact={true} />

        {/* Header with account creation message */}
        <Animated.View
          style={[authStyles.headerContainer, headerAnimatedStyle]}
        >
          <Text style={[authStyles.largeTitle, { color: colors.text }]}>
            Create Account
          </Text>
          <Text style={[authStyles.subtitle, { color: colors.textSecondary }]}>
            Join HomeKeep today
          </Text>
        </Animated.View>

        <GradientDivider />

        {!isConfigured ? (
          // Configuration required message
          <Animated.View style={[formAnimatedStyle]}>
            <Card
              style={[
                authStyles.configCard,
                { backgroundColor: colors.surface },
              ]}
            >
              <Card.Content style={authStyles.configContent}>
                <Text
                  style={[authStyles.configTitle, { color: colors.primary }]}
                >
                  Supabase Setup Required
                </Text>
                <Text
                  style={[
                    authStyles.configText,
                    { color: colors.textSecondary },
                  ]}
                >
                  To enable authentication, you need to configure your Supabase
                  credentials.
                  {"\n\n"}Check the SUPABASE_SETUP.md file in your project root
                  for setup instructions.
                </Text>
              </Card.Content>
            </Card>
          </Animated.View>
        ) : (
          // Signup form with progress tracking
          <Animated.View style={[formAnimatedStyle]}>
            <Card
              style={[authStyles.formCard, { backgroundColor: colors.surface }]}
              elevation={2}
            >
              <Card.Content style={authStyles.compactFormContent}>
                {/* Progress indicator */}
                <View style={authStyles.progressContainer}>
                  <Text
                    style={[
                      authStyles.progressLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Profile completion: {Math.round(formProgress * 100)}%
                  </Text>
                  <ProgressBar
                    progress={formProgress}
                    color={colors.primary}
                    style={authStyles.progressBar}
                  />
                </View>

                {/* Full name input */}
                <TextInput
                  label="Full Name"
                  value={fullName}
                  onChangeText={(text) => setFieldValue("fullName", text)}
                  mode="outlined"
                  style={authStyles.input}
                  error={!!errors.fullName}
                  autoCapitalize="words"
                  autoComplete="name"
                  left={<TextInput.Icon icon="account" />}
                  theme={getInputTheme(!!errors.fullName)}
                />
                <HelperText
                  type="error"
                  visible={!!errors.fullName}
                  style={authStyles.helperText}
                >
                  {errors.fullName}
                </HelperText>

                {/* Email input */}
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={(text) => setFieldValue("email", text)}
                  mode="outlined"
                  style={authStyles.input}
                  error={!!errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  left={<TextInput.Icon icon="email" />}
                  theme={getInputTheme(!!errors.email)}
                />
                <HelperText
                  type="error"
                  visible={!!errors.email}
                  style={authStyles.helperText}
                >
                  {errors.email}
                </HelperText>

                {/* Password input with visibility toggle */}
                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={(text) => setFieldValue("password", text)}
                  mode="outlined"
                  style={authStyles.input}
                  error={!!errors.password}
                  secureTextEntry={!showPassword}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={handlePasswordToggle}
                    />
                  }
                  autoComplete="new-password"
                  theme={getInputTheme(!!errors.password)}
                />
                <HelperText
                  type="error"
                  visible={!!errors.password}
                  style={authStyles.helperText}
                >
                  {errors.password}
                </HelperText>

                {/* Confirm password input with visibility toggle */}
                <TextInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={(text) =>
                    setFieldValue("confirmPassword", text)
                  }
                  mode="outlined"
                  style={authStyles.input}
                  error={!!errors.confirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  left={<TextInput.Icon icon="lock-check" />}
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? "eye-off" : "eye"}
                      onPress={handleConfirmPasswordToggle}
                    />
                  }
                  autoComplete="new-password"
                  theme={getInputTheme(!!errors.confirmPassword)}
                />
                <HelperText
                  type="error"
                  visible={!!errors.confirmPassword}
                  style={authStyles.helperText}
                >
                  {errors.confirmPassword}
                </HelperText>
              </Card.Content>
            </Card>
          </Animated.View>
        )}

        {/* Action buttons */}
        <Animated.View
          style={[authStyles.buttonContainerWithGap, buttonAnimatedStyle]}
        >
          {isConfigured && (
            // Create account button with gradient
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={authStyles.gradientButton}
            >
              <Button
                mode="contained"
                onPress={handleSignUp}
                loading={loading}
                disabled={loading}
                style={authStyles.primaryButton}
                contentStyle={authStyles.buttonContent}
                labelStyle={[
                  authStyles.buttonLabel,
                  { color: isDark ? colors.text : "white" },
                ]}
              >
                Create Account
              </Button>
            </LinearGradient>
          )}

          {/* OAuth authentication options */}
          {isConfigured && (
            <OAuthButtons
              disabled={loading}
              onSuccess={() => {
                // User will be automatically navigated by AuthContext
              }}
            />
          )}

          {/* Back to home button */}
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
            Back to Home
          </Button>

          {/* Terms of service footer */}
          {isConfigured && (
            <Text
              style={[authStyles.footerText, { color: colors.textSecondary }]}
            >
              By creating an account, you agree to our Terms of Service
            </Text>
          )}
        </Animated.View>
      </View>
    </ScrollView>
  );
}
