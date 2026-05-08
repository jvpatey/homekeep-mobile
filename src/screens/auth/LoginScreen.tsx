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
import { TextInput, HelperText } from "react-native-paper";
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

// LoginScreen for the LoginScreen on the home screen
export function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { signIn } = useAuth();
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
  const { animatedStyle: ctaAnimatedStyle, onPressIn, onPressOut } =
    useScalePress();

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
    navigation.navigate("EmailEntry" as any);
  };

  // handleSignUp for the handleSignUp on the home screen
  const handleSignUp = () => {
    triggerLight();
    navigation.navigate("SignUp" as any);
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
                title="Welcome Back"
                subtitle="Sign in to continue managing your home"
                onBack={handleBackPress}
                animatedStyle={headerAnimatedStyle}
              />
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
              autoComplete="password"
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

            <TouchableOpacity
              onPress={handleEmailVerification}
              style={[
                authStyles.verificationContainer,
                isTablet && {
                  marginTop: getResponsiveValue(
                    DesignSystem.spacing.md,
                    DesignSystem.spacing.lg,
                    DesignSystem.spacing.xl,
                  ),
                  marginBottom: getResponsiveValue(
                    DesignSystem.spacing.md,
                    DesignSystem.spacing.lg,
                    DesignSystem.spacing.xl,
                  ),
                },
              ]}
            >
              <Text
                style={[
                  authStyles.verificationText, 
                  { color: colors.primary },
                  isTablet && {
                    fontSize: (authStyles.verificationText.fontSize || 15) * fontMultiplier,
                  },
                ]}
              >
                Forgot your password?
              </Text>
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>

        {/* Sign In Button */}
        <Animated.View
          style={[
            authStyles.buttonContainer,
            buttonAnimatedStyle,
            isTablet && { 
              marginHorizontal: getResponsiveValue(16, 32, 40),
              marginTop: getResponsiveValue(
                DesignSystem.spacing.lg,
                DesignSystem.spacing.xl,
                DesignSystem.spacing.xl + DesignSystem.spacing.md,
              ),
            },
          ]}
        >
          <Pressable
            onPress={handleSignIn}
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
                {loading ? "Signing In..." : "Sign In"}
              </Text>
            </Animated.View>
          </Pressable>
        </Animated.View>

        {/* OAuth Section */}
        <View style={isTablet && { paddingHorizontal: getResponsiveValue(16, 32, 40) }}>
        <OAuthButtons animatedStyle={buttonAnimatedStyle} />
        </View>

        {/* Sign Up Link */}
        <View style={[
          authStyles.linkContainer,
          isTablet && { 
            paddingHorizontal: getResponsiveValue(16, 32, 40),
            marginTop: getResponsiveValue(
              DesignSystem.spacing.xl,
              DesignSystem.spacing.xl + DesignSystem.spacing.md,
              DesignSystem.spacing.xl + DesignSystem.spacing.lg,
            ),
            marginBottom: getResponsiveValue(
              DesignSystem.spacing.lg,
              DesignSystem.spacing.xl,
              DesignSystem.spacing.xl + DesignSystem.spacing.md,
            ),
          },
        ]}>
          <Text style={[
            authStyles.linkText, 
            { color: colors.textSecondary },
            isTablet && {
              fontSize: (authStyles.linkText.fontSize || 15) * fontMultiplier,
            },
          ]}>
            Don't have an account?{" "}
            <Text
              style={[
                authStyles.link, 
                { color: colors.primary },
                isTablet && {
                  fontSize: (authStyles.linkText.fontSize || 15) * fontMultiplier,
                },
              ]}
              onPress={handleSignUp}
            >
              Sign up
            </Text>
          </Text>
        </View>
      </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
