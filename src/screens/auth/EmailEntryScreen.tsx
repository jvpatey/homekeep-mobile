import React from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthScaffold } from "../../components/auth";
import { Button, TextField } from "../../components/ui";
import { useAuthForm, useAuthHaptics } from "./hooks";
import { DesignSystem } from "../../theme/designSystem";

export function EmailEntryScreen() {
  const navigation = useNavigation();
  const { triggerError, triggerMedium, triggerLight } = useAuthHaptics();

  const { errors, setFieldValue, validateForm, getFieldValue } = useAuthForm({
    email: { required: true, email: true },
  });

  const email = getFieldValue("email");

  const handleContinue = () => {
    if (!validateForm()) {
      triggerError();
      return;
    }
    triggerMedium();
    (navigation as any).navigate("CodeVerification", { email });
  };

  const handleBackPress = () => {
    triggerLight();
    navigation.goBack();
  };

  return (
    <AuthScaffold
      title="Verify your email"
      subtitle="Enter the email address linked to your account"
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
          label="Continue"
          onPress={handleContinue}
          disabled={!email || !!errors.email}
        />
      </View>
    </AuthScaffold>
  );
}
