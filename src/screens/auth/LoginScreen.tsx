import React, { useState } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity } from "react-native";
import { TextInput, HelperText } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { LogoSection } from "../../components/onboarding";
import { OAuthButtons } from "../../components/auth";
import {
  useAuthStaggeredAnimation,
  useAuthHaptics,
  useAuthForm,
  useAuthGradient,
  useAuthInputTheme,
} from "./hooks";
import { useDynamicSpacing } from "../../hooks";
import { authStyles } from "./styles/authStyles";
import { DesignSystem } from "../../theme/designSystem";

// LoginScreen for the LoginScreen on the home screen
export function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { signIn } = useAuth();
  const navigation = useNavigation();

  // Shared hooks
  const { dynamicTopSpacing, dynamicBottomSpacing } = useDynamicSpacing();
  const { triggerMedium, triggerError, triggerSuccess, triggerLight } =
    useAuthHaptics();
  const { gradientColors } = useAuthGradient();
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

  // handleSignIn for the handleSignIn on the home screen
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

  // handleBackPress for the handleBackPress on the home screen
  const handleBackPress = () => {
    triggerLight();
    navigation.goBack();
  };

  // handlePasswordToggle for the handlePasswordToggle on the home screen
  const handlePasswordToggle = () => {
    triggerLight();
    setShowPassword(!showPassword);
  };

  // handleEmailVerification for the handleEmailVerification on the home screen
  const handleEmailVerification = () => {
    triggerLight();
    navigation.navigate("EmailVerification" as any);
  };

  // handleSignUp for the handleSignUp on the home screen
  const handleSignUp = () => {
    triggerLight();
    navigation.navigate("SignUp" as any);
  };

  return (
    <View
      style={[authStyles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
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
              left: DesignSystem.spacing.md,
              zIndex: 10,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface + "E6", // 90% opacity
              borderRadius: DesignSystem.borders.radius.large,
              paddingHorizontal: DesignSystem.spacing.md,
              paddingVertical: DesignSystem.spacing.sm,
              ...DesignSystem.shadows.small,
            }}
          >
            <Text
              style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}
            >
              ← Back
            </Text>
          </TouchableOpacity>

          <LogoSection showText={false} compact={false} />

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
            style={[
              authStyles.primaryButton,
              {
                backgroundColor: colors.primary,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 6,
                marginHorizontal: DesignSystem.spacing.md,
              },
            ]}
          >
            <Text style={[authStyles.buttonLabel, { color: "white" }]}>
              {loading ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* OAuth Section */}
        <OAuthButtons animatedStyle={buttonAnimatedStyle} />

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
