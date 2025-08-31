import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { LogoSection } from "../../components/onboarding";
import { useAuthHaptics } from "./hooks";
import { useDynamicSpacing } from "../../hooks";
import { authStyles } from "./styles/authStyles";
import { DesignSystem } from "../../theme/designSystem";

// VerificationStatus for the VerificationStatus on the home screen
type VerificationStatus = "verifying" | "success" | "error";

// EmailVerificationScreen for the EmailVerificationScreen on the home screen
export function EmailVerificationScreen() {
  const { colors } = useTheme();
  const { supabase } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();

  // Shared hooks
  const { dynamicTopSpacing } = useDynamicSpacing();
  const { triggerSuccess, triggerError } = useAuthHaptics();

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
            <TouchableOpacity
              onPress={handleBackToHome}
              style={{
                marginTop: DesignSystem.spacing.lg,
                paddingHorizontal: DesignSystem.spacing.lg,
                paddingVertical: DesignSystem.spacing.md,
                backgroundColor: colors.primary,
                borderRadius: DesignSystem.borders.radius.large,
              }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>
                Continue to App
              </Text>
            </TouchableOpacity>
          </View>
        );

      case "error":
        return (
          <View style={authStyles.statusContainer}>
            <View
              style={[authStyles.errorIcon, { backgroundColor: colors.error }]}
            >
              <Text style={authStyles.errorMark}>✕</Text>
            </View>
            <Text style={[authStyles.message, { color: colors.text }]}>
              {message}
            </Text>
            <View
              style={{
                marginTop: DesignSystem.spacing.lg,
                gap: DesignSystem.spacing.sm,
              }}
            >
              <TouchableOpacity
                onPress={handleManualCode}
                style={{
                  paddingHorizontal: DesignSystem.spacing.lg,
                  paddingVertical: DesignSystem.spacing.md,
                  backgroundColor: colors.primary,
                  borderRadius: DesignSystem.borders.radius.large,
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>
                  Enter Code Manually
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBackToHome}
                style={{
                  paddingHorizontal: DesignSystem.spacing.lg,
                  paddingVertical: DesignSystem.spacing.md,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  borderRadius: DesignSystem.borders.radius.large,
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: "600" }}>
                  Back to Home
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
    }
  };

  return (
    <View
      style={[authStyles.container, { backgroundColor: colors.background }]}
    >
      <View style={{ paddingTop: dynamicTopSpacing, flex: 1 }}>
        {/* Header */}
        <View style={authStyles.headerContainer}>
          <LogoSection showText={false} compact={true} />
          <Text style={[authStyles.title, { color: colors.text }]}>
            Email Verification
          </Text>
        </View>

        {/* Content */}
        {renderContent()}
      </View>
    </View>
  );
}
