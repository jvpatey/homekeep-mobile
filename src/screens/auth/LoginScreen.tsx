import React, { useCallback, useState } from "react";
import { View, Alert } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { AuthScaffold, OAuthButtons } from "../../components/auth";
import { Button, TextField, TextLink } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { EMAIL_NOT_CONFIRMED } from "../../utils/isEmailVerified";
import { offerBiometricLogin } from "../../utils/offerBiometricLogin";
import {
  getBiometricLabel,
  hasBiometricLoginEnabled,
  isBiometricAvailable,
} from "../../services/biometricAuth";
import { useAuthForm, useAuthHaptics } from "./hooks";
import { DesignSystem } from "../../theme/designSystem";

export function LoginScreen() {
  const { signIn, signInWithBiometrics } = useAuth();
  const navigation = useNavigation();
  const { triggerMedium, triggerError, triggerSuccess, triggerLight } =
    useAuthHaptics();

  const { errors, setFieldValue, validateForm, getFieldValue } = useAuthForm({
    email: { required: true, email: true },
    password: { required: true },
  });

  const email = getFieldValue("email");
  const password = getFieldValue("password");
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Face ID");

  const refreshBiometricAvailability = useCallback(async () => {
    try {
      const [available, enabled, label] = await Promise.all([
        isBiometricAvailable(),
        hasBiometricLoginEnabled(),
        getBiometricLabel(),
      ]);
      setBiometricReady(available && enabled);
      setBiometricLabel(label);
    } catch {
      setBiometricReady(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshBiometricAvailability();
    }, [refreshBiometricAvailability])
  );

  const handleSignIn = async () => {
    triggerMedium();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data, error } = await signIn(email, password);
      if (error?.code === EMAIL_NOT_CONFIRMED) {
        triggerError();
        (navigation as any).navigate("CodeVerification", {
          email: error.email ?? email.trim().toLowerCase(),
          purpose: "signup",
        });
        return;
      }
      if (error) {
        triggerError();
        Alert.alert("Sign In Error", error.message);
      } else {
        triggerSuccess();
        if (data?.session) {
          void offerBiometricLogin(data.session);
        }
      }
    } catch {
      triggerError();
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricSignIn = async () => {
    if (biometricLoading || loading) return;
    triggerMedium();
    setBiometricLoading(true);
    try {
      const { error } = await signInWithBiometrics();
      if (error) {
        triggerError();
        Alert.alert("Sign In Error", error.message);
        void refreshBiometricAvailability();
      } else {
        triggerSuccess();
      }
    } catch {
      triggerError();
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleBackPress = () => {
    triggerLight();
    navigation.goBack();
  };

  const busy = loading || biometricLoading;

  return (
    <AuthScaffold
      title="Welcome back"
      subtitle="Sign in to continue managing your home"
      onBack={handleBackPress}
      footer={
        <TextLink
          prefix="Don't have an account?"
          linkText="Sign up"
          onPress={() => {
            triggerLight();
            navigation.navigate("SignUp" as never);
          }}
        />
      }
    >
      {biometricReady ? (
        <View style={{ marginBottom: DesignSystem.spacing.md }}>
          <Button
            label={
              biometricLoading
                ? `Signing in with ${biometricLabel}...`
                : `Sign in with ${biometricLabel}`
            }
            onPress={handleBiometricSignIn}
            loading={biometricLoading}
            disabled={busy}
          />
        </View>
      ) : null}

      <TextField
        label="Email"
        value={email}
        onChangeText={(text) => setFieldValue("email", text)}
        error={errors.email}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />

      <TextField
        label="Password"
        value={password}
        onChangeText={(text) => setFieldValue("password", text)}
        error={errors.password}
        secureToggle
        autoComplete="password"
        textContentType="password"
      />

      <View style={{ alignItems: "flex-end", marginBottom: DesignSystem.spacing.lg }}>
        <TextLink
          linkText="Forgot your password?"
          onPress={() => {
            triggerLight();
            navigation.navigate("EmailEntry" as never);
          }}
        />
      </View>

      <Button
        label={loading ? "Signing in..." : "Sign in"}
        onPress={handleSignIn}
        loading={loading}
        disabled={busy}
        variant={biometricReady ? "secondary" : "primary"}
      />

      <View style={{ marginTop: DesignSystem.spacing.md }}>
        <OAuthButtons disabled={busy} />
      </View>
    </AuthScaffold>
  );
}
