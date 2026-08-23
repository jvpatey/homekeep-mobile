import React, { useState } from "react";
import { View, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthScaffold, OAuthButtons } from "../../components/auth";
import { Button, TextField, TextLink } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useAuthForm, useAuthHaptics } from "./hooks";
import { DesignSystem } from "../../theme/designSystem";

export function SignUpScreen() {
  const { signUp } = useAuth();
  const navigation = useNavigation();
  const { triggerMedium, triggerError, triggerSuccess, triggerLight } =
    useAuthHaptics();

  const { errors, setFieldValue, validateForm, getFieldValue } = useAuthForm({
    fullName: { required: true, minLength: 2 },
    email: { required: true, email: true },
    password: { required: true, minLength: 6 },
    confirmPassword: { required: true, match: "password" },
  });

  const fullName = getFieldValue("fullName");
  const email = getFieldValue("email");
  const password = getFieldValue("password");
  const confirmPassword = getFieldValue("confirmPassword");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    triggerMedium();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await signUp(email, password, fullName);

      if (error) {
        triggerError();
        Alert.alert("Sign Up Error", error.message);
      } else {
        triggerSuccess();
        Alert.alert(
          "Account created",
          "Check your email for a verification code or link.",
          [
            {
              text: "Enter code",
              onPress: () =>
                (navigation as any).navigate("CodeVerification", { email }),
            },
            { text: "OK", style: "default" },
          ],
        );
      }
    } catch {
      triggerError();
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
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
      title="Create account"
      subtitle="Join HomeKeep to start managing your home"
      onBack={handleBackPress}
      footer={
        <TextLink
          prefix="Already have an account?"
          linkText="Sign in"
          onPress={() => {
            triggerLight();
            navigation.navigate("Login" as never);
          }}
        />
      }
    >
      <TextField
        label="Full name"
        value={fullName}
        onChangeText={(text) => setFieldValue("fullName", text)}
        error={errors.fullName}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
      />

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
        autoComplete="new-password"
        textContentType="newPassword"
      />

      <TextField
        label="Confirm password"
        value={confirmPassword}
        onChangeText={(text) => setFieldValue("confirmPassword", text)}
        error={errors.confirmPassword}
        secureToggle
        autoComplete="new-password"
        textContentType="newPassword"
      />

      <View style={{ marginTop: DesignSystem.spacing.sm }}>
        <Button
          label={loading ? "Creating account..." : "Create account"}
          onPress={handleSignUp}
          loading={loading}
          disabled={loading}
        />
      </View>

      <View style={{ marginTop: DesignSystem.spacing.md }}>
        <OAuthButtons />
      </View>
    </AuthScaffold>
  );
}
