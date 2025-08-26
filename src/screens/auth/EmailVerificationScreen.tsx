import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { LogoSection } from "../../components/LogoSection/LogoSection";
import { useDynamicSpacing, useAuthHaptics } from "./hooks";
import { authStyles } from "./styles/authStyles";
import { DesignSystem } from "../../theme/designSystem";

type VerificationStatus = "verifying" | "success" | "error";

/**
 * EmailVerificationScreen - Handles automatic email verification via deep links
 * Processes verification URLs from email links and automatically signs in users
 * Shows loading, success, and error states during the verification process
 * Updated with modern 2025 design language matching the dashboard
 */
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

  useEffect(() => {
    /**
     * Handles the email verification process using URL parameters
     * Extracts verification tokens from deep links and verifies the email
     */
    const handleEmailVerification = async () => {
      try {
        // Get URL from navigation state or route params
        const params = route.params as any;

        // The URL might come from the linking system directly or as a parameter
        let urlToProcess = params?.url;

        // If we don't have a URL in params, try to get it from the current navigation state
        if (!urlToProcess) {
          // This might be a direct deep link, so we need to parse the current URL
          const { getState } = navigation;
          const state = getState();

          // For now, let's extract from the URL hash if available
          if (typeof window !== "undefined" && window.location) {
            urlToProcess = window.location.href;
          }
        }

        if (!urlToProcess) {
          throw new Error("No verification URL provided");
        }

        // Ensure we have a proper URL to parse
        let urlObj: URL;
        try {
          urlObj = new URL(urlToProcess);
        } catch {
          // If direct URL parsing fails, try to extract query params differently
          const hashParams = urlToProcess.includes("#")
            ? urlToProcess.split("#")[1]
            : urlToProcess.split("?")[1];
          if (!hashParams) {
            throw new Error("Invalid verification link format");
          }

          // Create a dummy URL to parse search params
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
      } catch (error: any) {
        console.error("Email verification error:", error);
        triggerError();
        setStatus("error");
        setMessage(
          error.message || "Failed to verify email. Please try again."
        );
      }
    };

    // Start verification process
    handleEmailVerification();
  }, [route.params, navigation, supabase.auth, triggerSuccess, triggerError]);

  /**
   * Handles navigation back to home
   */
  const handleBackToHome = () => {
    navigation.navigate("Home" as any);
  };

  /**
   * Handles manual code entry navigation
   */
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
