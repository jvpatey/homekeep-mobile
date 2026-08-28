import React, { useState, useCallback } from "react";
import { View, Text, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AuthScaffold } from "../../components/auth";
import { Button, OtpInput, TextLink } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useAuthHaptics } from "./hooks";
import { DesignSystem } from "../../theme/designSystem";

export function CodeVerificationScreen() {
  const { colors } = useTheme();
  const { supabase } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { triggerSuccess, triggerError, triggerLight } = useAuthHaptics();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const params = route.params as { email?: string };
  const email = params?.email ?? "";

  const handleVerifyCode = useCallback(
    async (verificationCode: string) => {
      if (!verificationCode || verificationCode.length !== 6) {
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

        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: verificationCode,
          type: "email",
        });

        if (verifyError) {
          throw verifyError;
        }

        if (data.session) {
          triggerSuccess();
          Alert.alert(
            "Email verified",
            "Your account has been verified. Welcome to HomeKeep!",
          );
        } else {
          throw new Error("Verification completed but no session created");
        }
      } catch (err) {
        const errorObj = err as Error;
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
    },
    [email, supabase, triggerError, triggerSuccess],
  );

  const handleBackPress = () => {
    triggerLight();
    navigation.goBack();
  };

  const handleResendCode = async () => {
    triggerLight();
    setError("");

    try {
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (resendError) {
        throw resendError;
      }

      Alert.alert(
        "Code resent",
        "A new verification code has been sent to your email.",
      );
    } catch {
      setError("Failed to resend code. Please try again.");
    }
  };

  return (
    <AuthScaffold
      title="Verify your email"
      subtitle={`Enter the 6-digit code sent to ${email}`}
      onBack={handleBackPress}
      footer={
        <>
          <TextLink
            prefix="Didn't receive the code?"
            linkText="Resend"
            onPress={handleResendCode}
          />
          <TextLink
            prefix="Already verified?"
            linkText="Sign in"
            onPress={() => {
              triggerLight();
              navigation.navigate("Login" as never);
            }}
          />
        </>
      }
    >
      <OtpInput
        value={code}
        onChange={setCode}
        error={error}
        onComplete={handleVerifyCode}
      />

      <View style={{ marginTop: DesignSystem.spacing.md }}>
        <Button
          label={loading ? "Verifying..." : "Verify code"}
          onPress={() => handleVerifyCode(code)}
          loading={loading}
          disabled={loading || code.length !== 6}
        />
      </View>

      {!email && (
        <Text
          style={{
            ...DesignSystem.typography.footnote,
            color: colors.textSecondary,
            marginTop: DesignSystem.spacing.sm,
          }}
        >
          No email on file. Go back and enter your email first.
        </Text>
      )}
    </AuthScaffold>
  );
}
