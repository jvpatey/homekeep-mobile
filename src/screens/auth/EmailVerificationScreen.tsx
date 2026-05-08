import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRoute, useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import Animated from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useGradients, useScalePress } from "../../hooks";
import { LogoSection } from "../../components/onboarding";
import { GlassCard } from "../../components/ui/glass-card";
import { useAuthHaptics } from "./hooks";
import { useDynamicSpacing, useDevice } from "../../hooks";
import { authStyles } from "./styles/authStyles";
import { DesignSystem } from "../../theme/designSystem";

// VerificationStatus for the VerificationStatus on the home screen
type VerificationStatus = "verifying" | "success" | "error";

// EmailVerificationScreen for the EmailVerificationScreen on the home screen
export function EmailVerificationScreen() {
  const { colors, isDark } = useTheme();
  const { haloGradient, ctaHighlight } = useGradients();
  const { supabase } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();

  // Shared hooks
  const { dynamicBottomSpacing } = useDynamicSpacing();
  const { triggerSuccess, triggerError } = useAuthHaptics();
  const { isTablet, getMaxContentWidth, getFontMultiplier, getResponsiveValue, getHeroSectionHeight } =
    useDevice();

  const maxContentWidth = getMaxContentWidth();
  const fontMultiplier = getFontMultiplier();
  const heroSectionHeight = getHeroSectionHeight();
  const { animatedStyle: ctaAnimatedStyle, onPressIn, onPressOut } =
    useScalePress();

  const [status, setStatus] = useState<VerificationStatus>("verifying");
  const [message, setMessage] = useState("Verifying your email...");

  // handleEmailVerification for the handleEmailVerification on the home screen
  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        const params = route.params as any;
        let urlToProcess = params?.url;
        if (!urlToProcess) {
          if (typeof window !== "undefined" && window.location) {
            urlToProcess = window.location.href;
          }
        }

        if (!urlToProcess) {
          throw new Error("No verification URL provided");
        }

        let urlObj: URL;
        try {
          urlObj = new URL(urlToProcess);
        } catch {
          const hashParams = urlToProcess.includes("#")
            ? urlToProcess.split("#")[1]
            : urlToProcess.split("?")[1];
          if (!hashParams) {
            throw new Error("Invalid verification link format");
          }

          urlObj = new URL(`http://dummy.com?${hashParams}`);
        }

        // Extract verification parameters from URL
        const token_hash = urlObj.searchParams.get("token_hash");
        const type = urlObj.searchParams.get("type");

        if (!token_hash || !type) {
          throw new Error(
            "Invalid verification link - missing required parameters"
          );
        }

        // Verify the email using the token with Supabase
        if (!supabase) {
          throw new Error("Supabase not configured");
        }
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          // Success! User is now signed in
          triggerSuccess();
          setStatus("success");
          setMessage("Email verified successfully! Welcome to HomeKeep.");
        } else {
          throw new Error("Verification failed - no session created");
        }
      } catch (error) {
        const errorObj = error as Error;
        console.error("Email verification error:", errorObj);
        triggerError();
        setStatus("error");
        setMessage(
          errorObj.message || "Failed to verify email. Please try again."
        );
      }
    };

    // Start verification process
    handleEmailVerification();
  }, [route.params, navigation, supabase, triggerSuccess, triggerError]);

  // handleBackToHome for the handleBackToHome on the home screen
  const handleBackToHome = () => {
    navigation.navigate("Home" as any);
  };

  // handleManualCode for the handleManualCode on the home screen
  const handleManualCode = () => {
    navigation.navigate("CodeVerification" as any);
  };

  const renderContent = () => {
    switch (status) {
      case "verifying":
        return (
          <View style={authStyles.statusContainer}>
            <View
              style={[
                authStyles.successIcon,
                { backgroundColor: colors.primary },
              ]}
            >
              <ActivityIndicator size={24} color="white" />
            </View>
            <Text style={[authStyles.message, { color: colors.text }]}>
              {message}
            </Text>
          </View>
        );

      case "success":
        return (
          <>
            <View style={authStyles.statusContainer}>
              <View
                style={[
                  authStyles.successIcon,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={authStyles.checkmark}>✓</Text>
              </View>
              <Text style={[authStyles.message, { color: colors.text }]}>
                {message}
              </Text>
            </View>
            <View style={{ marginTop: DesignSystem.spacing.xl }}>
              <Pressable
                onPress={handleBackToHome}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
              >
                <Animated.View
                  style={[
                    {
                      borderRadius: DesignSystem.borders.radius.large,
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
                      overflow: "hidden",
                      position: "relative",
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
                  <View
                    style={{
                      paddingVertical: DesignSystem.spacing.md,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "600",
                        fontSize: 16,
                      }}
                    >
                      Continue to App
                    </Text>
                  </View>
                </Animated.View>
              </Pressable>
            </View>
          </>
        );

      case "error":
        return (
          <>
            <View style={authStyles.statusContainer}>
              <View
                style={[authStyles.errorIcon, { backgroundColor: colors.error }]}
              >
                <Text style={authStyles.errorMark}>✕</Text>
              </View>
              <Text style={[authStyles.message, { color: colors.text }]}>
                {message}
              </Text>
            </View>
            <View
              style={{
                marginTop: DesignSystem.spacing.xl,
                gap: DesignSystem.spacing.md,
              }}
            >
              <Pressable
                onPress={handleManualCode}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
              >
                <Animated.View
                  style={[
                    {
                      borderRadius: DesignSystem.borders.radius.large,
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
                      overflow: "hidden",
                      position: "relative",
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
                  <View
                    style={{
                      paddingVertical: DesignSystem.spacing.md,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "600",
                        fontSize: 16,
                      }}
                    >
                      Enter Code Manually
                    </Text>
                  </View>
                </Animated.View>
              </Pressable>

              <Pressable onPress={handleBackToHome}>
                <GlassCard
                  material="regular"
                  radius={DesignSystem.borders.radius.large}
                  style={{
                    paddingVertical: DesignSystem.spacing.md,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.12)"
                      : "rgba(255, 255, 255, 0.22)",
                  }}
                >
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontWeight: "600",
                      fontSize: 16,
                    }}
                  >
                    Back to Home
                  </Text>
                </GlassCard>
              </Pressable>
            </View>
          </>
        );
    }
  };

  return (
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

        {/* Header */}
        <View style={[
          authStyles.headerContainer,
          authStyles.heroContent,
          maxContentWidth && { maxWidth: maxContentWidth, alignSelf: "center", width: "100%" },
          { zIndex: 1 },
        ]}>
          <LogoSection showText={false} compact={false} />
          <Text style={[
            authStyles.title,
            { color: colors.text },
            isTablet && {
              fontSize: authStyles.title.fontSize * fontMultiplier,
              lineHeight: authStyles.title.lineHeight * fontMultiplier,
            },
          ]}>
            Email Verification
          </Text>
          <View style={{ height: DesignSystem.spacing.lg }} />
        </View>
      </View>

      <View style={{ 
        paddingTop: DesignSystem.spacing.lg, 
        flex: 1,
        paddingHorizontal: DesignSystem.spacing.md,
        alignItems: "center",
        width: "100%",
      }}>
        <View style={[
          { width: "100%" },
          maxContentWidth && { maxWidth: maxContentWidth },
          { paddingBottom: dynamicBottomSpacing },
        ]}>
        {/* Content */}
        {renderContent()}
        </View>
      </View>
    </View>
  );
}
