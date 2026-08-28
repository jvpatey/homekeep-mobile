import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { AuthScaffold } from "../../components/auth";
import { Button } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useAuthHaptics } from "./hooks";
import { DesignSystem } from "../../theme/designSystem";

type VerificationStatus = "verifying" | "success" | "error";

export function EmailVerificationScreen() {
  const { colors } = useTheme();
  const { supabase } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { triggerSuccess, triggerError } = useAuthHaptics();

  const [status, setStatus] = useState<VerificationStatus>("verifying");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        const params = route.params as { url?: string };
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

        const token_hash = urlObj.searchParams.get("token_hash");
        const type = urlObj.searchParams.get("type");

        if (!token_hash || !type) {
          throw new Error(
            "Invalid verification link — missing required parameters",
          );
        }

        if (!supabase) {
          throw new Error("Supabase not configured");
        }

        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as "signup" | "email",
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          triggerSuccess();
          setStatus("success");
          setMessage("Email verified. Welcome to HomeKeep.");
        } else {
          throw new Error("Verification failed — no session created");
        }
      } catch (err) {
        const errorObj = err as Error;
        console.error("Email verification error:", errorObj);
        triggerError();
        setStatus("error");
        setMessage(
          errorObj.message || "Failed to verify email. Please try again.",
        );
      }
    };

    handleEmailVerification();
  }, [route.params, supabase, triggerSuccess, triggerError]);

  const handleBackToHome = () => {
    navigation.navigate("Home" as never);
  };

  const handleManualCode = () => {
    navigation.navigate("CodeVerification" as never);
  };

  const statusIcon = () => {
    switch (status) {
      case "verifying":
        return (
          <ActivityIndicator size="large" color={colors.primary} />
        );
      case "success":
        return (
          <Ionicons
            name="checkmark-circle"
            size={64}
            color={colors.secondary}
          />
        );
      case "error":
        return (
          <Ionicons name="close-circle" size={64} color={colors.error} />
        );
    }
  };

  return (
    <AuthScaffold
      title="Email verification"
      onBack={handleBackToHome}
      scrollable={false}
    >
      <View style={styles.statusBlock}>
        {statusIcon()}
        <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      </View>

      {status === "success" && (
        <View style={styles.actions}>
          <Button label="Continue to app" onPress={handleBackToHome} />
        </View>
      )}

      {status === "error" && (
        <View style={styles.actions}>
          <Button label="Enter code manually" onPress={handleManualCode} />
          <Button
            label="Back to home"
            onPress={handleBackToHome}
            variant="secondary"
          />
        </View>
      )}
    </AuthScaffold>
  );
}

const styles = {
  statusBlock: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: DesignSystem.spacing.xxxl,
    gap: DesignSystem.spacing.lg,
  },
  message: {
    ...DesignSystem.typography.callout,
    textAlign: "center" as const,
    paddingHorizontal: DesignSystem.spacing.md,
  },
  actions: {
    gap: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.lg,
  },
};
