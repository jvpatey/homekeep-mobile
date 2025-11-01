import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { TextInput, HelperText, ProgressBar } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useGradients } from "../../hooks";
import { LogoSection } from "../../components/onboarding";
import { OAuthButtons } from "../../components/auth";
import {
  useAuthStaggeredAnimation,
  useAuthHaptics,
  useAuthForm,
  useAuthGradient,
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
  const { dynamicTopSpacing, dynamicBottomSpacing } = useDynamicSpacing();
  const { heroGradient, heroGradientLocations, radialGlow, ambientGradient } = useGradients();
  const { isTablet, getMaxContentWidth, getGradientFadeHeight, getFontMultiplier, getResponsiveValue, getGradientFadeLocations, getGradientFadeColors, getHeroSectionHeight, width, height } = useDevice();
  
  const maxContentWidth = getMaxContentWidth();
  const gradientFadeHeight = getGradientFadeHeight();
  const fontMultiplier = getFontMultiplier();
  const fadeLocations = getGradientFadeLocations(isDark) as any;
  const fadeColors = getGradientFadeColors(isDark, colors.background) as any;
  const heroSectionHeight = getHeroSectionHeight();
  const screenMax = Math.max(width, height);
  const { triggerMedium, triggerError, triggerSuccess, triggerLight } =
    useAuthHaptics();
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

      {/* Fixed Hero Section with Modern Glow Gradient */}
      <View style={[
        authStyles.heroSection,
        { backgroundColor: colors.background }, // Set background to prevent dark bar
        heroSectionHeight !== undefined && {
          minHeight: heroSectionHeight,
          justifyContent: "center",
        },
      ]}>
        {/* Bottom fade mask */}
        <LinearGradient
          colors={fadeColors}
          locations={fadeLocations}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            authStyles.bottomFade,
            {
              height: gradientFadeHeight,
            },
            isTablet && {
              height: screenMax > 1300 
                ? gradientFadeHeight * 1.6  // iPad Pro 13"
                : gradientFadeHeight * 1.3, // Standard iPads
            },
          ]}
          pointerEvents="none"
        />
        
        {/* Layered gradient background */}
        <LinearGradient
          colors={heroGradient}
          locations={heroGradientLocations}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={authStyles.gradientBase}
        />
        
        {/* Glow effect */}
        <LinearGradient
          colors={[radialGlow.innerColor, radialGlow.midColor, radialGlow.outerColor, radialGlow.fadeColor]}
          locations={[0, 0.3, 0.6, 1]}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 1, y: 1 }}
          style={authStyles.gradientGlow}
        />
        
        {/* Ambient light layer - fade to transparent to prevent dark bar */}
        <LinearGradient
          colors={
            isTablet
              ? isDark
                ? [
                    "rgba(46, 196, 182, 0.10)",
                    "rgba(58, 134, 255, 0.06)",
                    "rgba(46, 196, 182, 0.03)",
                    "transparent",
                  ]
                : [
                    "rgba(46, 196, 182, 0.12)",
                    "rgba(58, 134, 255, 0.08)",
                    "rgba(46, 196, 182, 0.025)",
                    "transparent",
                  ]
              : isDark
              ? ambientGradient
              : [
                  "transparent",
                  "transparent",
                  "transparent",
                  "transparent",
                ]
          }
          locations={[0, 0.4, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={authStyles.gradientAmbient}
        />
        <TouchableOpacity
          onPress={handleBackPress}
          style={[
            {
              position: "absolute",
              top: dynamicTopSpacing,
              left: DesignSystem.spacing.md,
              zIndex: 20,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDark
                ? "rgba(35, 37, 38, 0.5)"
                : "rgba(255, 255, 255, 0.5)",
              borderRadius: 20,
              paddingHorizontal: DesignSystem.spacing.lg,
              paddingVertical: DesignSystem.spacing.sm,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(255, 255, 255, 0.25)",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 2,
            },
            isTablet && {
              borderRadius: getResponsiveValue(20, 24, 28),
              paddingHorizontal: getResponsiveValue(
                DesignSystem.spacing.lg,
                DesignSystem.spacing.xl,
                DesignSystem.spacing.xl + DesignSystem.spacing.sm,
              ),
              paddingVertical: getResponsiveValue(
                DesignSystem.spacing.sm,
                DesignSystem.spacing.md,
                DesignSystem.spacing.md + DesignSystem.spacing.xs,
              ),
            },
          ]}
        >
          <Text
            style={[
              {
                color: colors.textSecondary,
                fontSize: 15,
                fontWeight: "600",
                opacity: 0.7,
              },
              isTablet && {
                fontSize: 15 * fontMultiplier,
              },
            ]}
          >
            ← Back
          </Text>
        </TouchableOpacity>

        <Animated.View
          style={[
            authStyles.headerContainer,
            authStyles.heroContent,
            headerAnimatedStyle,
            maxContentWidth && { maxWidth: maxContentWidth, alignSelf: "center", width: "100%" },
            { zIndex: 15 }, // Ensure text is above fade gradient
          ]}
        >
          <LogoSection showText={false} compact={false} />

          <Text style={[
            authStyles.largeTitle,
            { color: colors.text },
            isTablet && {
              fontSize: authStyles.largeTitle.fontSize * fontMultiplier,
              lineHeight: authStyles.largeTitle.lineHeight * fontMultiplier,
            },
          ]}>
            Create Account
          </Text>
          <Text style={[
            authStyles.subtitle,
            { color: colors.textSecondary },
            isTablet && {
              fontSize: authStyles.subtitle.fontSize * fontMultiplier,
              lineHeight: authStyles.subtitle.lineHeight * fontMultiplier,
            },
          ]}>
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
        <Animated.View
          style={[
            authStyles.formCard,
            { backgroundColor: colors.glass, shadowColor: colors.primary },
            formAnimatedStyle,
            isTablet && { marginHorizontal: getResponsiveValue(16, 32, 40) },
          ]}
        >
          <View style={authStyles.formContent}>
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
          </View>
        </Animated.View>

        {/* Sign Up Button */}
        <Animated.View
          style={[
            authStyles.buttonContainer,
            buttonAnimatedStyle,
            isTablet && { marginHorizontal: getResponsiveValue(16, 32, 40) },
          ]}
        >
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[
                isDark
                  ? "rgba(32, 180, 134, 0.70)"
                  : "rgba(46, 196, 182, 0.75)",
                isDark
                  ? "rgba(58, 134, 255, 0.65)"
                  : "rgba(58, 134, 255, 0.70)",
                isDark
                  ? "rgba(255, 159, 28, 0.60)"
                  : "rgba(255, 159, 28, 0.65)",
              ]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                authStyles.primaryButton,
                {
                  shadowColor: isDark
                    ? "rgba(32, 180, 134, 0.25)"
                    : "rgba(46, 196, 182, 0.30)",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.2,
                  shadowRadius: 16,
                  elevation: 5,
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.15)"
                    : "rgba(255, 255, 255, 0.2)",
                },
              ]}
            >
              <Text
                style={[
                  authStyles.buttonLabel,
                  { color: "white", fontWeight: "700", fontSize: 17 },
                ]}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
