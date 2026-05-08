import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  Pressable,
} from "react-native";
import { TextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useGradients, useScalePress } from "../../hooks";
import { LogoSection } from "../../components/onboarding";
import { GlassCard } from "../../components/ui/glass-card";
import { useAuthAnimation, useAuthHaptics } from "./hooks";
import { useDynamicSpacing, useDevice } from "../../hooks";
import { authStyles } from "./styles/authStyles";
import { DesignSystem } from "../../theme/designSystem";

// CodeVerificationScreen for the CodeVerificationScreen on the home screen
export function CodeVerificationScreen() {
  const { colors, isDark } = useTheme();
  const { supabase } = useAuth();
  const { haloGradient, ctaHighlight } = useGradients();
  const navigation = useNavigation();
  const route = useRoute();
  const formAnimatedStyle = useAuthAnimation();
  const { dynamicTopSpacing, dynamicBottomSpacing } = useDynamicSpacing();
  const { triggerSuccess, triggerError, triggerLight } = useAuthHaptics();
  const { isTablet, getMaxContentWidth, getFontMultiplier, getResponsiveValue, getHeroSectionHeight } =
    useDevice();

  const maxContentWidth = getMaxContentWidth();
  const fontMultiplier = getFontMultiplier();
  const heroSectionHeight = getHeroSectionHeight();
  const { animatedStyle: ctaAnimatedStyle, onPressIn, onPressOut } =
    useScalePress();
  const {
    animatedStyle: backAnimatedStyle,
    onPressIn: onBackPressIn,
    onPressOut: onBackPressOut,
  } = useScalePress(0.98);
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
      <View style={[
        authStyles.heroSection,
        { backgroundColor: colors.background, justifyContent: "center" },
        heroSectionHeight !== undefined && {
          minHeight: heroSectionHeight,
        },
      ]}>
        <LinearGradient
          colors={haloGradient}
          start={{ x: 0.5, y: 0.15 }}
          end={{ x: 0.5, y: 1 }}
          style={authStyles.gradientBase}
          pointerEvents="none"
        />

        <View
          style={{
            position: "absolute",
            top: dynamicTopSpacing,
            left: DesignSystem.spacing.md,
            zIndex: 20,
          }}
        >
          <Pressable
            onPress={handleBackPress}
            onPressIn={onBackPressIn}
            onPressOut={onBackPressOut}
            hitSlop={10}
          >
            <Animated.View style={backAnimatedStyle}>
              <GlassCard
                material="regular"
                radius={getResponsiveValue(20, 24, 28)}
                style={{
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
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={[
                    {
                      color: colors.textSecondary,
                      fontSize: 15,
                      fontWeight: "600",
                      opacity: 0.8,
                    },
                    isTablet && {
                      fontSize: 15 * fontMultiplier,
                    },
                  ]}
                >
                  ← Back
                </Text>
              </GlassCard>
            </Animated.View>
          </Pressable>
        </View>

        <View style={[
          authStyles.headerContainer,
          authStyles.heroContent,
          maxContentWidth && { maxWidth: maxContentWidth, alignSelf: "center", width: "100%" },
          { zIndex: 1 },
        ]}>
          <LogoSection showText={false} compact={false} />

          <Text style={[
            authStyles.largeTitle,
            { color: colors.text },
            isTablet && {
              fontSize: authStyles.largeTitle.fontSize * fontMultiplier,
              lineHeight: authStyles.largeTitle.lineHeight * fontMultiplier,
            },
          ]}>
            Verify Your Email
          </Text>
          <Text style={[
            authStyles.subtitle,
            { color: colors.textSecondary },
            isTablet && {
              fontSize: authStyles.subtitle.fontSize * fontMultiplier,
              lineHeight: authStyles.subtitle.lineHeight * fontMultiplier,
            },
          ]}>
            Enter the 6-digit code sent to {email}
          </Text>
        </View>
      </View>

      <ScrollView
        style={authStyles.scrollView}
        contentContainerStyle={[
          authStyles.scrollContent,
          {
            paddingBottom: dynamicBottomSpacing,
            paddingTop: DesignSystem.spacing.xl,
          },
          maxContentWidth && { maxWidth: maxContentWidth, alignSelf: "center", width: "100%" },
        ]}
        showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
      >
        {/* Form Section with Liquid Glass */}
        <Animated.View style={[formAnimatedStyle]}>
          <GlassCard
            material="regular"
            containerStyle={[
              authStyles.formCard,
              { marginBottom: DesignSystem.spacing.lg },
              isTablet && { marginHorizontal: getResponsiveValue(16, 32, 40) },
            ]}
            style={authStyles.formContent}
          >
            <TextInput
              label="Verification Code"
              value={code}
              onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ""))}
              style={[
                authStyles.input,
                isTablet && {
                  fontSize:
                    (authStyles.input.fontSize ||
                      DesignSystem.typography.body.fontSize) *
                    fontMultiplier,
                },
              ]}
              theme={getInputTheme()}
              keyboardType="numeric"
              maxLength={6}
              placeholder="123456"
              autoFocus
              keyboardAppearance={isDark ? "dark" : "light"}
            />
            {error && (
              <Text style={[authStyles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            )}
          </GlassCard>
        </Animated.View>

        {/* Verify Button */}
        <View style={[
          authStyles.buttonContainer,
          isTablet && { marginHorizontal: getResponsiveValue(16, 32, 40) },
        ]}>
          <Pressable
            onPress={handleVerifyCode}
            disabled={loading || code.length !== 6}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
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
                  opacity: code.length !== 6 ? 0.6 : 1,
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
              <Text style={[authStyles.buttonLabel, { color: "white" }]}>
                {loading ? "Verifying..." : "Verify Code"}
              </Text>
            </Animated.View>
          </Pressable>
        </View>

        {/* Resend Code */}
        <View style={[
          authStyles.linkContainer,
          isTablet && { paddingHorizontal: getResponsiveValue(16, 32, 40) },
        ]}>
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
        <View style={[
          authStyles.linkContainer,
          isTablet && { paddingHorizontal: getResponsiveValue(16, 32, 40) },
        ]}>
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
      </ScrollView>
    </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
