import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  Pressable,
} from "react-native";
import { TextInput, HelperText, ProgressBar } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useGradients, useScalePress } from "../../hooks";
import { AuthTopHeader, OAuthButtons } from "../../components/auth";
import { GlassCard } from "../../components/ui/glass-card";
import {
  useAuthStaggeredAnimation,
  useAuthHaptics,
  useAuthForm,
  useAuthInputTheme,
} from "./hooks";
import { useDynamicSpacing, useDevice } from "../../hooks";
import { authStyles } from "./styles/authStyles";
import { DesignSystem } from "../../theme/designSystem";

// SignUpScreen for the SignUpScreen on the home screen
export function SignUpScreen() {
  const { colors, isDark } = useTheme();
  const { signUp } = useAuth();
  const navigation = useNavigation();

  // Shared hooks
  const { dynamicBottomSpacing } = useDynamicSpacing();
  const { haloGradient, ctaHighlight } = useGradients();
  const { isTablet, getMaxContentWidth, getFontMultiplier, getResponsiveValue, getHeroSectionHeight } =
    useDevice();

  const maxContentWidth = getMaxContentWidth();
  const fontMultiplier = getFontMultiplier();
  const heroSectionHeight = getHeroSectionHeight();
  const { triggerMedium, triggerError, triggerSuccess, triggerLight } =
    useAuthHaptics();
  const { getInputTheme } = useAuthInputTheme();
  const { headerAnimatedStyle, formAnimatedStyle, buttonAnimatedStyle } =
    useAuthStaggeredAnimation();
  const {
    animatedStyle: ctaAnimatedStyle,
    onPressIn,
    onPressOut,
  } = useScalePress();
    useScalePress();

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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.background }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          style={[authStyles.container, { backgroundColor: colors.background }]}
        >
          <StatusBar style={isDark ? "light" : "dark"} />

          {/* Hero Section — match Welcome screen (single halo) */}
          <View
            style={[
              authStyles.heroSection,
              { backgroundColor: colors.background, justifyContent: "center" },
              heroSectionHeight !== undefined && {
                minHeight: heroSectionHeight,
              },
            ]}
          >
            <LinearGradient
              colors={haloGradient}
              start={{ x: 0.5, y: 0.15 }}
              end={{ x: 0.5, y: 1 }}
              style={authStyles.gradientBase}
              pointerEvents="none"
            />

            <Animated.View
              style={[
                authStyles.headerContainer,
                authStyles.heroContent,
                maxContentWidth && {
                  maxWidth: maxContentWidth,
                  alignSelf: "center",
                  width: "100%",
                },
                { zIndex: 1 },
              ]}
            >
              <AuthTopHeader
                title="Create Account"
                subtitle="Join HomeKeep to start managing your home maintenance"
                onBack={handleBackPress}
                animatedStyle={headerAnimatedStyle}
              />

              {/* Progress Bar */}
              <View style={authStyles.progressContainer}>
                <ProgressBar
                  progress={getFormProgress()}
                  color={colors.primary}
                  style={authStyles.progressBar}
                />
              </View>
            </Animated.View>
          </View>

      {/* Scrollable Content Section */}
      <ScrollView
        style={authStyles.scrollView}
        contentContainerStyle={[
          authStyles.scrollContent,
          {
            paddingBottom: dynamicBottomSpacing,
          },
          maxContentWidth && { maxWidth: maxContentWidth, alignSelf: "center", width: "100%" },
        ]}
        showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
      >
        {/* Form Section */}
        <Animated.View style={[formAnimatedStyle]}>
          <GlassCard
            material="regular"
            containerStyle={[
              authStyles.formCard,
              isTablet && { marginHorizontal: getResponsiveValue(16, 32, 40) },
            ]}
            style={authStyles.formContent}
          >
            <TextInput
              label="Full Name"
              value={fullName}
              onChangeText={(text) => setFieldValue("fullName", text)}
              style={[
                authStyles.input,
                isTablet && {
                  fontSize: (authStyles.input.fontSize || DesignSystem.typography.body.fontSize) * fontMultiplier,
                },
              ]}
              theme={getInputTheme()}
              autoCapitalize="words"
              autoComplete="name"
                  keyboardAppearance={isDark ? "dark" : "light"}
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
              style={[
                authStyles.input,
                isTablet && {
                  fontSize: (authStyles.input.fontSize || DesignSystem.typography.body.fontSize) * fontMultiplier,
                },
              ]}
              theme={getInputTheme()}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
                  keyboardAppearance={isDark ? "dark" : "light"}
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
              style={[
                authStyles.input,
                isTablet && {
                  fontSize: (authStyles.input.fontSize || DesignSystem.typography.body.fontSize) * fontMultiplier,
                },
              ]}
              theme={getInputTheme()}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
                  keyboardAppearance={isDark ? "dark" : "light"}
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
              style={[
                authStyles.input,
                isTablet && {
                  fontSize: (authStyles.input.fontSize || DesignSystem.typography.body.fontSize) * fontMultiplier,
                },
              ]}
              theme={getInputTheme()}
              secureTextEntry={!showConfirmPassword}
              autoComplete="new-password"
                  keyboardAppearance={isDark ? "dark" : "light"}
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
          </GlassCard>
        </Animated.View>

        {/* Sign Up Button */}
        <Animated.View
          style={[
            authStyles.buttonContainer,
            buttonAnimatedStyle,
            isTablet && { marginHorizontal: getResponsiveValue(16, 32, 40) },
          ]}
        >
          <Pressable
            onPress={handleSignUp}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={loading}
          >
            <Animated.View
              style={[
                authStyles.primaryButton,
                {
                  position: "relative",
                  overflow: "hidden",
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.18,
                  shadowRadius: 18,
                  elevation: 5,
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(255, 255, 255, 0.22)",
                },
                ctaAnimatedStyle,
              ]}
            >
              <LinearGradient
                colors={ctaHighlight}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "45%",
                }}
                pointerEvents="none"
              />
              <Text
                style={[
                  authStyles.buttonLabel,
                  { color: "white", fontWeight: "600", fontSize: 17 },
                ]}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Text>
            </Animated.View>
          </Pressable>
        </Animated.View>

        {/* OAuth Section */}
        <View style={isTablet && { paddingHorizontal: getResponsiveValue(16, 32, 40) }}>
        <OAuthButtons animatedStyle={buttonAnimatedStyle} />
        </View>
      </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
