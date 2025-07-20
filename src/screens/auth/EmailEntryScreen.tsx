import React, { useState } from "react";
import { View, Text, Alert } from "react-native";
import { Button, TextInput, Card } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { LogoSection } from "../../components/LogoSection/LogoSection";
import {
  useAuthAnimation,
  useDynamicSpacing,
  useAuthHaptics,
  useAuthForm,
  useAuthGradient,
  useAuthInputTheme,
} from "./hooks";
import { authStyles } from "./styles/authStyles";

/**
 * EmailEntryScreen - Handles email entry for verification or password reset
 * Allows users to enter their email address to receive verification codes
 */
export function EmailEntryScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  // Shared hooks
  const formAnimatedStyle = useAuthAnimation();
  const { dynamicTopSpacing } = useDynamicSpacing();
  const { triggerError, triggerMedium, triggerLight } = useAuthHaptics();
  const { gradientColors } = useAuthGradient();
  const { getInputTheme } = useAuthInputTheme();

  // Form management
  const { errors, setFieldValue, validateForm, getFieldValue } = useAuthForm({
    email: { required: true, email: true },
  });

  const email = getFieldValue("email");

  /**
   * Validates and processes the email entry
   */
  const handleContinue = () => {
    if (!validateForm()) {
      triggerError();
      return;
    }

    triggerMedium();
    (navigation as any).navigate("CodeVerification", { email });
  };

  /**
   * Handles back navigation with haptic feedback
   */
  const handleBackPress = () => {
    triggerLight();
    navigation.goBack();
  };

  return (
    <View
      style={[authStyles.container, { backgroundColor: colors.background }]}
    >
      <View style={[authStyles.content, { paddingTop: dynamicTopSpacing }]}>
        <LogoSection showText={false} compact={true} />

        <Card
          style={[authStyles.formCard, { backgroundColor: colors.surface }]}
          elevation={2}
        >
          <Card.Content style={authStyles.formContent}>
            {/* Header section */}
            <View style={authStyles.headerContainer}>
              <Text style={[authStyles.title, { color: colors.text }]}>
                Email Verification
              </Text>
              <Text
                style={[authStyles.subtitle, { color: colors.textSecondary }]}
              >
                Enter your email address to verify your account
              </Text>
            </View>

            {/* Email input */}
            <TextInput
              label="Email Address"
              value={email}
              onChangeText={(text) => setFieldValue("email", text)}
              mode="outlined"
              style={authStyles.input}
              error={!!errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              left={<TextInput.Icon icon="email" />}
              theme={getInputTheme(!!errors.email)}
            />

            {/* Error message */}
            {errors.email ? (
              <Text style={[authStyles.errorText, { color: colors.error }]}>
                {errors.email}
              </Text>
            ) : null}

            {/* Continue button */}
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[authStyles.gradientButton, { marginTop: 24 }]}
            >
              <Button
                mode="contained"
                onPress={handleContinue}
                style={authStyles.primaryButton}
                contentStyle={authStyles.buttonContent}
                labelStyle={[authStyles.buttonLabel, { color: "white" }]}
              >
                Continue
              </Button>
            </LinearGradient>
          </Card.Content>
        </Card>

        {/* Back button */}
        <View style={authStyles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={handleBackPress}
            style={[authStyles.outlineButton, { borderColor: colors.primary }]}
            contentStyle={authStyles.buttonContent}
            labelStyle={[
              authStyles.outlineButtonLabel,
              { color: colors.primary },
            ]}
          >
            Back
          </Button>
        </View>
      </View>
    </View>
  );
}
