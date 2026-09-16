import React, { useState } from "react";
import { View, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthScaffold } from "../../components/auth";
import { Button, TextField } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useAuthForm, useAuthHaptics } from "./hooks";
import { DesignSystem } from "../../theme/designSystem";

export function EmailEntryScreen() {
  const navigation = useNavigation();
  const { supabase } = useAuth();
  const { triggerError, triggerMedium, triggerLight } = useAuthHaptics();

  const { errors, setFieldValue, validateForm, getFieldValue } = useAuthForm({
    email: { required: true, email: true },
  });

  const email = getFieldValue("email");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!validateForm()) {
      triggerError();
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!supabase) {
      triggerError();
      Alert.alert("Error", "Supabase not configured");
      return;
    }

    triggerMedium();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        { redirectTo: "homekeep://auth/verify" },
      );

      if (error) {
        throw error;
      }

      (navigation as any).navigate("CodeVerification", {
        email: normalizedEmail,
        purpose: "recovery",
      });
    } catch (err) {
      triggerError();
      const errorObj = err as Error;
      Alert.alert(
        "Reset failed",
        errorObj.message || "Could not send a reset code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    triggerLight();
    navigation.goBack();
  };

  return (
    <AuthScaffold
      title="Reset password"
      subtitle="We'll send a 6-digit code to this email"
      onBack={handleBackPress}
    >
      <TextField
        label="Email address"
        value={email}
        onChangeText={(text) => setFieldValue("email", text)}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />

      <View style={{ marginTop: DesignSystem.spacing.sm }}>
        <Button
          label={loading ? "Sending..." : "Send reset code"}
          onPress={handleContinue}
          loading={loading}
          disabled={loading || !email || !!errors.email}
        />
      </View>
    </AuthScaffold>
  );
}
