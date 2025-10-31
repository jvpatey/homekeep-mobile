import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { TextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useGradients } from "../../hooks";
import { LogoSection } from "../../components/onboarding";
import {
  useAuthAnimation,
  useAuthHaptics,
  useAuthForm,
  useAuthInputTheme,
} from "./hooks";
import { useDynamicSpacing } from "../../hooks";
import { authStyles } from "./styles/authStyles";
import { DesignSystem } from "../../theme/designSystem";

// EmailEntryScreen for the EmailEntryScreen on the home screen
export function EmailEntryScreen() {
  const { colors, isDark } = useTheme();
  const { heroGradient, heroGradientLocations, radialGlow, primaryGradient } = useGradients();
  const navigation = useNavigation();
  const { dynamicTopSpacing, dynamicBottomSpacing } = useDynamicSpacing();
  const { triggerError, triggerMedium, triggerLight } = useAuthHaptics();
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.background }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          style={[authStyles.container, { backgroundColor: colors.background }]}
        >
          <StatusBar style={isDark ? "light" : "dark"} />
          
          {/* Hero Section with Gradient */}
          <View style={authStyles.heroSection}>
        {/* Bottom fade mask */}
        <LinearGradient
          colors={
            isDark
              ? ["transparent", "transparent", colors.background]
              : ["transparent", "rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.6)", colors.background]
          }
          locations={isDark ? [0, 0.4, 1] : [0, 0.6, 0.9, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={authStyles.bottomFade}
          pointerEvents="none"
        />
        
        {/* Layered gradient background */}
        <LinearGradient
          colors={heroGradient}
          locations={heroGradientLocations}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={authStyles.gradientBase}
        />
        
        {/* Glow effect */}
        <LinearGradient
          colors={[radialGlow.innerColor, radialGlow.midColor, radialGlow.outerColor, radialGlow.fadeColor]}
          locations={[0, 0.3, 0.6, 1]}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 1, y: 1 }}
          style={authStyles.gradientGlow}
        />

          <TouchableOpacity
            onPress={handleBackPress}
            style={{
              position: "absolute",
              top: dynamicTopSpacing,
              left: DesignSystem.spacing.md,
              zIndex: 20,
              backgroundColor: isDark
                ? "rgba(35, 37, 38, 0.5)"
                : "rgba(255, 255, 255, 0.5)",
              borderRadius: 20,
              paddingHorizontal: DesignSystem.spacing.lg,
              paddingVertical: DesignSystem.spacing.sm,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(255, 255, 255, 0.25)",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 15,
                fontWeight: "600",
                opacity: 0.7,
              }}
            >
              ← Back
            </Text>
          </TouchableOpacity>

        {/* Header */}
        <View style={[authStyles.headerContainer, authStyles.heroContent]}>
          <LogoSection showText={false} compact={false} />

          <Text style={[authStyles.title, { color: colors.text }]}>
            Email Verification
          </Text>
          <Text style={[authStyles.subtitle, { color: colors.textSecondary }]}>
            Enter your email address to verify your account
          </Text>
        </View>
      </View>

          <ScrollView
            style={authStyles.scrollView}
            contentContainerStyle={[
              authStyles.scrollContent,
              {
                paddingBottom: dynamicBottomSpacing,
                paddingTop: DesignSystem.spacing.xl,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Form Section with Liquid Glass */}
            <View style={[authStyles.formCard, { marginBottom: DesignSystem.spacing.lg }]}>
              <LinearGradient
                colors={isDark ? ["rgba(35, 37, 38, 0.7)", "rgba(35, 37, 38, 0.5)"] : ["rgba(255, 255, 255, 0.7)", "rgba(255, 255, 255, 0.5)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: DesignSystem.borders.radius.large,
                  padding: 1,
                }}
              >
                <View style={[
                  authStyles.formContent,
                  {
                    backgroundColor: isDark ? "rgba(35, 37, 38, 0.9)" : "rgba(255, 255, 255, 0.9)",
                    borderRadius: DesignSystem.borders.radius.large - 1,
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.6)",
                  }
                ]}>
                  <TextInput
                    label="Email Address"
                    value={email}
                    onChangeText={(text) => setFieldValue("email", text)}
                    style={authStyles.input}
                    theme={getInputTheme()}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardAppearance={isDark ? "dark" : "light"}
                  />
                  {errors.email && (
                    <Text style={[authStyles.errorText, { color: colors.error }]}>
                      {errors.email}
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </View>

            {/* Continue Button with Gradient */}
            <View style={authStyles.buttonContainer}>
              <TouchableOpacity
                onPress={handleContinue}
                disabled={!email || !!errors.email}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: DesignSystem.spacing.md,
                    paddingHorizontal: DesignSystem.spacing.lg,
                    borderRadius: DesignSystem.borders.radius.large,
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 6,
                    opacity: !email || !!errors.email ? 0.6 : 1,
                  }}
                >
                  <Text style={[authStyles.buttonLabel, { color: "white" }]}>
                    Continue
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
