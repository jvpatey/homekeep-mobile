import React, { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { Button, TextInput, HelperText, Card } from "react-native-paper";
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
 * LoginScreen - Handles user authentication with email/password and OAuth
 * Provides form validation, error handling, and integration with Supabase auth
 * Includes OAuth options and email verification link for password reset
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
        Alert.alert("Welcome Back!", "You have successfully signed in.");
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
    (navigation as any).navigate("EmailEntry");
  };

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

        {/* Header with welcome message */}
        <Animated.View
          style={[authStyles.headerContainer, headerAnimatedStyle]}
        >
          <Text style={[authStyles.largeTitle, { color: colors.text }]}>
            Welcome Back
          </Text>
          <Text style={[authStyles.subtitle, { color: colors.textSecondary }]}>
            Sign in to your account
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
          // Login form
          <Animated.View style={[formAnimatedStyle]}>
            <Card
              style={[authStyles.formCard, { backgroundColor: colors.surface }]}
              elevation={2}
            >
              <Card.Content style={authStyles.compactFormContent}>
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
                  autoComplete="password"
                  theme={getInputTheme(!!errors.password)}
                />
                <HelperText
                  type="error"
                  visible={!!errors.password}
                  style={authStyles.helperText}
                >
                  {errors.password}
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
            // Sign in button with gradient
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={authStyles.gradientButton}
            >
              <Button
                mode="contained"
                onPress={handleSignIn}
                loading={loading}
                disabled={loading}
                style={authStyles.primaryButton}
                contentStyle={authStyles.buttonContent}
                labelStyle={[
                  authStyles.buttonLabel,
                  { color: isDark ? colors.text : "white" },
                ]}
              >
                Sign In
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

          {/* Email verification link */}
          {isConfigured && (
            <View style={authStyles.verificationContainer}>
              <Button
                mode="text"
                onPress={handleEmailVerification}
                disabled={loading}
                labelStyle={[
                  authStyles.verificationText,
                  { color: colors.textSecondary },
                ]}
              >
                Need to verify your email?
              </Button>
            </View>
          )}
        </Animated.View>
      </View>
    </ScrollView>
  );
}
