import React, { useState } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity } from "react-native";
import { TextInput, HelperText, ProgressBar } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
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

// SignUpScreen for the SignUpScreen on the home screen
export function SignUpScreen() {
  const { colors } = useTheme();
  const { signUp } = useAuth();
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

  // getFormProgress for the getFormProgress on the home screen
  const getFormProgress = () => {
    const fields = [fullName, email, password, confirmPassword];
    const filledFields = fields.filter((field) => field.trim() !== "").length;
    return filledFields / fields.length;
  };

  // handleSignUp for the handleSignUp on the home screen
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

  // handleConfirmPasswordToggle for the handleConfirmPasswordToggle on the home screen
  const handleConfirmPasswordToggle = () => {
    triggerLight();
    setShowConfirmPassword(!showConfirmPassword);
  };

  // handleSignIn for the handleSignIn on the home screen
  const handleSignIn = () => {
    triggerLight();
    navigation.navigate("Login" as any);
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

          <Text style={[authStyles.largeTitle, { color: colors.text }]}>
            Create Account
          </Text>
          <Text style={[authStyles.subtitle, { color: colors.textSecondary }]}>
            Join HomeKeep to start managing your home maintenance
          </Text>

          {/* Progress Bar */}
          <View style={authStyles.progressContainer}>
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
                  onPress={handlePasswordToggle}
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
            style={[
              authStyles.gradientButton,
              { marginHorizontal: DesignSystem.spacing.md },
            ]}
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
        <OAuthButtons animatedStyle={buttonAnimatedStyle} />
      </ScrollView>
    </View>
  );
}
