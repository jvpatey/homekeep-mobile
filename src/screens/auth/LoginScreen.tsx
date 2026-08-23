import React, { useState } from "react";
import { View, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthScaffold, OAuthButtons } from "../../components/auth";
import { Button, TextField, TextLink } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useAuthForm, useAuthHaptics } from "./hooks";
import { DesignSystem } from "../../theme/designSystem";

export function LoginScreen() {
  const { signIn } = useAuth();
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

  const handleSignIn = async () => {
    triggerMedium();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        triggerError();
        Alert.alert("Sign In Error", error.message);
      } else {
        triggerSuccess();
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
        disabled={loading}
      />

      <View style={{ marginTop: DesignSystem.spacing.md }}>
        <OAuthButtons />
      </View>
    </AuthScaffold>
  );
}
