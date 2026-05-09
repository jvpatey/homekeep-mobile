import React from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  Pressable,
} from "react-native";
import { TextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import Animated from "react-native-reanimated";
import { useGradients, useScalePress } from "../../hooks";
import { AuthTopHeader } from "../../components/auth";
import { GlassCard } from "../../components/ui/glass-card";
import {
  useAuthAnimation,
  useAuthHaptics,
  useAuthForm,
  useAuthInputTheme,
} from "./hooks";
import { useDynamicSpacing, useDevice } from "../../hooks";
import { authStyles } from "./styles/authStyles";
import { DesignSystem } from "../../theme/designSystem";

// EmailEntryScreen for the EmailEntryScreen on the home screen
export function EmailEntryScreen() {
  const { colors, isDark } = useTheme();
  const { haloGradient, ctaHighlight } = useGradients();
  const navigation = useNavigation();
  const { dynamicBottomSpacing } = useDynamicSpacing();
  const { triggerError, triggerMedium, triggerLight } = useAuthHaptics();
  const {
    isTablet,
    getMaxContentWidth,
    getFontMultiplier,
    getResponsiveValue,
    getHeroSectionHeight,
  } = useDevice();

  const maxContentWidth = getMaxContentWidth();
  const fontMultiplier = getFontMultiplier();
  const heroSectionHeight = getHeroSectionHeight();
  const { getInputTheme } = useAuthInputTheme();
  const formAnimatedStyle = useAuthAnimation();
  const { animatedStyle: ctaAnimatedStyle, onPressIn, onPressOut } =
    useScalePress();

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

          {/* Hero Section — match Welcome screen (single halo) */}
          <View
            style={[
              authStyles.heroSection,
              { backgroundColor: colors.background, justifyContent: "center" },
              heroSectionHeight !== undefined && {
                minHeight: heroSectionHeight,
              },
            ]}
          >
            <LinearGradient
              colors={haloGradient}
              start={{ x: 0.5, y: 0.15 }}
              end={{ x: 0.5, y: 1 }}
              style={authStyles.gradientBase}
              pointerEvents="none"
            />

            {/* Header */}
            <View
              style={[
                authStyles.headerContainer,
                authStyles.heroContent,
                maxContentWidth && {
                  maxWidth: maxContentWidth,
                  alignSelf: "center",
                  width: "100%",
                },
                { zIndex: 1 },
              ]}
            >
              <AuthTopHeader
                title="Email Verification"
                subtitle="Enter your email address to verify your account"
                onBack={handleBackPress}
              />
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
              maxContentWidth && {
                maxWidth: maxContentWidth,
                alignSelf: "center",
                width: "100%",
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[formAnimatedStyle]}>
              <GlassCard
                material="regular"
                containerStyle={[
                  authStyles.formCard,
                  { marginBottom: DesignSystem.spacing.lg },
                  isTablet && {
                    marginHorizontal: getResponsiveValue(16, 32, 40),
                  },
                ]}
                style={authStyles.formContent}
              >
                <TextInput
                  label="Email Address"
                  value={email}
                  onChangeText={(text) => setFieldValue("email", text)}
                  style={[
                    authStyles.input,
                    isTablet && {
                      fontSize:
                        (authStyles.input.fontSize ||
                          DesignSystem.typography.body.fontSize) *
                        fontMultiplier,
                    },
                  ]}
                  theme={getInputTheme(!!errors.email)}
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
              </GlassCard>
            </Animated.View>

            {/* Continue Button */}
            <View
              style={[
                authStyles.buttonContainer,
                isTablet && {
                  marginHorizontal: getResponsiveValue(16, 32, 40),
                },
              ]}
            >
              <Pressable
                onPress={handleContinue}
                disabled={!email || !!errors.email}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
              >
                <Animated.View
                  style={[
                    authStyles.primaryButton,
                    {
                      position: "relative",
                      overflow: "hidden",
                      backgroundColor: colors.primary,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.18,
                      shadowRadius: 18,
                      elevation: 5,
                      borderWidth: 1,
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.12)"
                        : "rgba(255, 255, 255, 0.22)",
                      opacity: !email || !!errors.email ? 0.6 : 1,
                    },
                    ctaAnimatedStyle,
                  ]}
                >
                  <LinearGradient
                    colors={ctaHighlight}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "45%",
                    }}
                    pointerEvents="none"
                  />
                  <Text style={[authStyles.buttonLabel, { color: "white" }]}>
                    Continue
                  </Text>
                </Animated.View>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
