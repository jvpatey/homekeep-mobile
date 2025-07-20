import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogoSection } from "../../components/LogoSection/LogoSection";
import * as Haptics from "expo-haptics";

export const EmailVerificationScreen: React.FC = () => {
  const { colors } = useTheme();
  const { supabase } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
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

        const token_hash = urlObj.searchParams.get("token_hash");
        const type = urlObj.searchParams.get("type");

        if (!token_hash || !type) {
          throw new Error(
            "Invalid verification link - missing required parameters"
          );
        }

        // Verify the email using the token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          // Success! User is now signed in
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setStatus("success");
          setMessage("Email verified successfully! Welcome to HomeKeep.");

          // The AuthContext will automatically detect the session and redirect to main app
          // No need to manually navigate since RootNavigator will handle this
        } else {
          throw new Error("Verification completed but no session created");
        }
      } catch (error: any) {
        console.error("Email verification error:", error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setStatus("error");
        setMessage(
          error.message ||
            "Failed to verify email. Please try signing in manually."
        );

        // Navigate back to auth after a delay
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: "Auth" }],
          });
        }, 3000);
      }
    };

    handleEmailVerification();
  }, [route.params, supabase, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        <LogoSection showText={true} compact={false} />

        <View style={styles.statusContainer}>
          {status === "verifying" && (
            <>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>
                Verifying Email
              </Text>
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {message}
              </Text>
            </>
          )}

          {status === "success" && (
            <>
              <View
                style={[
                  styles.successIcon,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                Email Verified!
              </Text>
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {message}
              </Text>
            </>
          )}

          {status === "error" && (
            <>
              <View
                style={[styles.errorIcon, { backgroundColor: colors.error }]}
              >
                <Text style={styles.errorMark}>✗</Text>
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                Verification Failed
              </Text>
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {message}
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  statusContainer: {
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    fontSize: 30,
    color: "white",
    fontWeight: "bold",
  },
  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  errorMark: {
    fontSize: 30,
    color: "white",
    fontWeight: "bold",
  },
});
