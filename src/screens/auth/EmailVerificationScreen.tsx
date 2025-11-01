import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useGradients } from "../../hooks";
import { LogoSection } from "../../components/onboarding";
import { useAuthHaptics } from "./hooks";
import { useDynamicSpacing, useDevice } from "../../hooks";
import { authStyles } from "./styles/authStyles";
import { DesignSystem } from "../../theme/designSystem";

// VerificationStatus for the VerificationStatus on the home screen
type VerificationStatus = "verifying" | "success" | "error";

// EmailVerificationScreen for the EmailVerificationScreen on the home screen
export function EmailVerificationScreen() {
  const { colors, isDark } = useTheme();
  const { heroGradient, heroGradientLocations, radialGlow, primaryGradient, ambientGradient } = useGradients();
  const { supabase } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();

  // Shared hooks
  const { dynamicTopSpacing } = useDynamicSpacing();
  const { triggerSuccess, triggerError } = useAuthHaptics();
  const { isTablet, getMaxContentWidth, getGradientFadeHeight, getFontMultiplier, getResponsiveValue, getGradientFadeLocations, getGradientFadeColors, getHeroSectionHeight, width, height } = useDevice();
  
  const maxContentWidth = getMaxContentWidth();
  const gradientFadeHeight = getGradientFadeHeight();
  const fontMultiplier = getFontMultiplier();
  const fadeLocations = getGradientFadeLocations(isDark);
  const fadeColors = getGradientFadeColors(isDark, colors.background);
  const heroSectionHeight = getHeroSectionHeight();
  const screenMax = Math.max(width, height);

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
              <TouchableOpacity
                onPress={handleBackToHome}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: DesignSystem.spacing.md,
                    borderRadius: DesignSystem.borders.radius.large,
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
                    Continue to App
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
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
              <TouchableOpacity
                onPress={handleManualCode}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: DesignSystem.spacing.md,
                    borderRadius: DesignSystem.borders.radius.large,
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
                    Enter Code Manually
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBackToHome}
                activeOpacity={0.8}
                style={{
                  paddingVertical: DesignSystem.spacing.md,
                  borderWidth: 2,
                  borderColor: colors.primary,
                  borderRadius: DesignSystem.borders.radius.large,
                  alignItems: "center",
                  backgroundColor: "transparent",
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 16 }}>
                  Back to Home
                </Text>
              </TouchableOpacity>
            </View>
          </>
        );
    }
  };

  return (
    <View
      style={[authStyles.container, { backgroundColor: colors.background }]}
    >
      {/* Hero Section with Gradient */}
      <View style={[
        authStyles.heroSection,
        { backgroundColor: colors.background },
        heroSectionHeight && {
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

        {/* Header */}
        <View style={[
          authStyles.headerContainer,
          authStyles.heroContent,
          maxContentWidth && { maxWidth: maxContentWidth, alignSelf: "center", width: "100%" },
          { zIndex: 15 }, // Ensure text is above fade gradient
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
        ]}>
          {/* Content */}
          {renderContent()}
        </View>
      </View>
    </View>
  );
}
