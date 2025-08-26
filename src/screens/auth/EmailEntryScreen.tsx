import React, { useState } from "react";
import { View, Text, Alert, TouchableOpacity } from "react-native";
import { TextInput } from "react-native-paper";
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
import { DesignSystem } from "../../theme/designSystem";

/**
 * EmailEntryScreen - Handles email entry for verification or password reset
 * Allows users to enter their email address to receive verification codes
 * Updated with modern 2025 design language matching the dashboard
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
      <View style={{ paddingTop: dynamicTopSpacing, flex: 1 }}>
        {/* Header */}
        <View style={authStyles.headerContainer}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              padding: DesignSystem.spacing.sm,
              zIndex: 10,
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 18 }}>← Back</Text>
          </TouchableOpacity>

          <LogoSection showText={false} compact={true} />

          <Text style={[authStyles.title, { color: colors.text }]}>
            Email Verification
          </Text>
          <Text style={[authStyles.subtitle, { color: colors.textSecondary }]}>
            Enter your email address to verify your account
          </Text>
        </View>

        {/* Form Section */}
        <View style={authStyles.formCard}>
          <View style={authStyles.formContent}>
            <TextInput
              label="Email Address"
              value={email}
              onChangeText={(text) => setFieldValue("email", text)}
              style={authStyles.input}
              theme={getInputTheme()}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {errors.email && (
              <Text style={[authStyles.errorText, { color: colors.error }]}>
                {errors.email}
              </Text>
            )}
          </View>
        </View>

        {/* Continue Button */}
        <View style={authStyles.buttonContainer}>
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!email || !!errors.email}
            style={[
              authStyles.gradientButton,
              { opacity: !email || !!errors.email ? 0.6 : 1 },
            ]}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={authStyles.primaryButton}
            >
              <View style={authStyles.buttonContent}>
                <Text style={[authStyles.buttonLabel, { color: "white" }]}>
                  Continue
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
