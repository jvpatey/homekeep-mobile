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
} from "react-native";
import { TextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useGradients } from "../../hooks";
import { LogoSection } from "../../components/onboarding";
import { useAuthAnimation, useAuthHaptics } from "./hooks";
import { useDynamicSpacing, useDevice } from "../../hooks";
import { authStyles } from "./styles/authStyles";
import { DesignSystem } from "../../theme/designSystem";

// CodeVerificationScreen for the CodeVerificationScreen on the home screen
export function CodeVerificationScreen() {
  const { colors, isDark } = useTheme();
  const { supabase } = useAuth();
  const { heroGradient, heroGradientLocations, radialGlow, primaryGradient, ambientGradient } = useGradients();
  const navigation = useNavigation();
  const route = useRoute();
  const formAnimatedStyle = useAuthAnimation();
  const { dynamicTopSpacing, dynamicBottomSpacing } = useDynamicSpacing();
  const { triggerSuccess, triggerError, triggerLight } = useAuthHaptics();
  const { isTablet, getMaxContentWidth, getGradientFadeHeight, getFontMultiplier, getResponsiveValue, getGradientFadeLocations, getGradientFadeColors, getHeroSectionHeight, width, height } = useDevice();
  
  const maxContentWidth = getMaxContentWidth();
  const gradientFadeHeight = getGradientFadeHeight();
  const fontMultiplier = getFontMultiplier();
  const fadeLocations = getGradientFadeLocations(isDark) as any;
  const fadeColors = getGradientFadeColors(isDark, colors.background) as any;
  const heroSectionHeight = getHeroSectionHeight();
  const screenMax = Math.max(width, height);
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
      {/* Hero Section with Gradient */}
      <View style={[
        authStyles.heroSection,
        { backgroundColor: colors.background },
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
        
        {/* Ambient light layer - fade to transparent on iPads */}
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
              : ambientGradient
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

        <View style={[
          authStyles.headerContainer,
          authStyles.heroContent,
          maxContentWidth && { maxWidth: maxContentWidth, alignSelf: "center", width: "100%" },
          { zIndex: 15 }, // Ensure text is above fade gradient
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
        <Animated.View style={[
          authStyles.formCard,
          formAnimatedStyle,
          { marginBottom: DesignSystem.spacing.lg },
          isTablet && { marginHorizontal: getResponsiveValue(16, 32, 40) },
        ]}>
          <LinearGradient
            colors={isDark ? ["rgba(35, 37, 38, 0.7)", "rgba(35, 37, 38, 0.5)"] : ["rgba(255, 255, 255, 0.7)", "rgba(255, 255, 255, 0.5)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: DesignSystem.borders.radius.large,
              padding: 1,
            }}
          >
            <View style={[
              authStyles.formContent,
              {
                backgroundColor: isDark ? "rgba(35, 37, 38, 0.9)" : "rgba(255, 255, 255, 0.9)",
                borderRadius: DesignSystem.borders.radius.large - 1,
                borderWidth: 1,
                borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.6)",
              }
            ]}>
              <TextInput
                label="Verification Code"
                value={code}
                onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ""))}
                style={[
                  authStyles.input,
                  isTablet && {
                    fontSize: (authStyles.input.fontSize || DesignSystem.typography.body.fontSize) * fontMultiplier,
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
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Verify Button with Gradient */}
        <View style={[
          authStyles.buttonContainer,
          isTablet && { marginHorizontal: getResponsiveValue(16, 32, 40) },
        ]}>
          <TouchableOpacity
            onPress={handleVerifyCode}
            disabled={loading || code.length !== 6}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: DesignSystem.spacing.md,
                paddingHorizontal: DesignSystem.spacing.lg,
                borderRadius: DesignSystem.borders.radius.large,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 6,
                opacity: code.length !== 6 ? 0.6 : 1,
              }}
            >
              <Text style={[authStyles.buttonLabel, { color: "white" }]}>
                {loading ? "Verifying..." : "Verify Code"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
