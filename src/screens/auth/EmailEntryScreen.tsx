import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { TextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { LogoSection } from "../../components/onboarding";
import {
  useAuthAnimation,
  useAuthHaptics,
  useAuthForm,
  useAuthGradient,
  useAuthInputTheme,
} from "./hooks";
import { useDynamicSpacing } from "../../hooks";
import { authStyles } from "./styles/authStyles";
import { DesignSystem } from "../../theme/designSystem";

// EmailEntryScreen for the EmailEntryScreen on the home screen
export function EmailEntryScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { dynamicTopSpacing } = useDynamicSpacing();
  const { triggerError, triggerMedium, triggerLight } = useAuthHaptics();
  const { gradientColors } = useAuthGradient();
  const { getInputTheme } = useAuthInputTheme();

  // Form management
  const { errors, setFieldValue, validateForm, getFieldValue } = useAuthForm({
    email: { required: true, email: true },
  });

  const email = getFieldValue("email");

  // handleContinue for the handleContinue on the home screen
  const handleContinue = () => {
    if (!validateForm()) {
      triggerError();
      return;
    }

    triggerMedium();
    (navigation as any).navigate("CodeVerification", { email });
  };

  // handleBackPress for the handleBackPress on the home screen
  const handleBackPress = () => {
    triggerLight();
    navigation.goBack();
  };

  return (
    <View
      style={[authStyles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
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
              backgroundColor: colors.surface + "E6", // 90% opacity
              borderRadius: DesignSystem.borders.radius.large,
              ...DesignSystem.shadows.small,
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
              authStyles.primaryButton,
              {
                backgroundColor: colors.primary,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 6,
                opacity: !email || !!errors.email ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[authStyles.buttonLabel, { color: "white" }]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
