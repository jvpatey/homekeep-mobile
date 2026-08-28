import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn } from "react-native-reanimated";
import * as AppleAuthentication from "expo-apple-authentication";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useGradients, useHaptics, useReducedMotion } from "../hooks";
import { HouseMark, Button, TextLink } from "../components/ui";
import { AuthStackParamList } from "../navigation/types";
import { DesignSystem } from "../theme/designSystem";

type WelcomeNavigation = NativeStackNavigationProp<AuthStackParamList, "Home">;

const PROOFS = ["Organize", "Schedule", "Track"];

export function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { welcomeAtmosphere, welcomeAtmosphereSecondary } = useGradients();
  const { signInWithApple } = useAuth();
  const { triggerMedium, triggerLight, triggerSuccess, triggerError } =
    useHaptics();
  const navigation = useNavigation<WelcomeNavigation>();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [appleLoading, setAppleLoading] = useState(false);

  const entering = reducedMotion
    ? undefined
    : FadeIn.duration(DesignSystem.motion.duration.base);

  const handleCreateAccount = () => {
    triggerMedium();
    navigation.navigate("SignUp");
  };

  const handleSignIn = () => {
    triggerLight();
    navigation.navigate("Login");
  };

  const handleAppleSignIn = async () => {
    if (appleLoading) return;
    triggerMedium();
    setAppleLoading(true);

    try {
      const { data, error } = await signInWithApple();
      if (error) {
        triggerError();
        Alert.alert(
          "Sign In Error",
          error.message || "Failed to sign in with Apple",
        );
      } else if (data?.session) {
        triggerSuccess();
      }
    } catch {
      triggerError();
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <LinearGradient
        colors={welcomeAtmosphere}
        start={{ x: 0.5, y: 0.05 }}
        end={{ x: 0.5, y: 0.65 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={welcomeAtmosphereSecondary}
        start={{ x: 0.15, y: 0.2 }}
        end={{ x: 0.85, y: 0.5 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.7 }]}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + DesignSystem.spacing.md,
            paddingBottom: insets.bottom + DesignSystem.spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top wordmark */}
        <Animated.View
          {...(entering ? { entering } : {})}
          style={styles.wordmarkRow}
        >
          <View style={styles.wordmarkMark}>
            <HouseMark size={20} inline />
          </View>
          <Text style={[styles.wordmark, { color: colors.text }]}>
            HomeKeep
          </Text>
        </Animated.View>

        {/* Hero mark */}
        <Animated.View
          {...(entering ? { entering: FadeIn.delay(60).duration(DesignSystem.motion.duration.base) } : {})}
          style={styles.heroMarkContainer}
        >
          <HouseMark size={120} />
        </Animated.View>

        {/* Copy */}
        <Animated.View
          {...(entering ? { entering: FadeIn.delay(120).duration(DesignSystem.motion.duration.base) } : {})}
          style={styles.copyBlock}
        >
          <View style={styles.headlineBlock}>
            <Text
              style={[styles.headline, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              maxFontSizeMultiplier={1.25}
            >
              Home maintenance,
            </Text>
            <Text
              style={[styles.headline, { color: colors.text }]}
              maxFontSizeMultiplier={1.25}
            >
              handled.
            </Text>
          </View>
          <Text
            style={[styles.support, { color: colors.textSecondary }]}
            maxFontSizeMultiplier={1.4}
          >
            Reminders, history, and a plan — without the mental load.
          </Text>
          <Text style={[styles.proofs, { color: colors.textSecondary }]}>
            {PROOFS.join("  ·  ")}
          </Text>
        </Animated.View>

        <View style={styles.spacer} />

        {/* Bottom dock */}
        <Animated.View
          {...(entering ? { entering: FadeIn.delay(180).duration(DesignSystem.motion.duration.base) } : {})}
          style={styles.dock}
        >
          <Button
            label="Create account"
            onPress={handleCreateAccount}
            variant="primary"
          />

          {Platform.OS === "ios" && (
            <View style={styles.appleWrapper}>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
                }
                buttonStyle={
                  isDark
                    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={DesignSystem.borders.radius.round}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            </View>
          )}

          <TextLink
            prefix="Already have an account?"
            linkText="Sign in"
            onPress={handleSignIn}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm + 2,
  },
  wordmarkMark: {
    height: 20,
    justifyContent: "center",
  },
  wordmark: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
    includeFontPadding: false,
  },
  heroMarkContainer: {
    alignItems: "flex-start",
    marginTop: DesignSystem.spacing.xxxl,
    marginBottom: DesignSystem.spacing.xl,
  },
  copyBlock: {
    alignItems: "flex-start",
  },
  headlineBlock: {
    width: "100%",
    marginBottom: DesignSystem.spacing.md,
  },
  headline: {
    ...DesignSystem.typography.display,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1,
  },
  support: {
    ...DesignSystem.typography.callout,
    marginBottom: DesignSystem.spacing.lg,
  },
  proofs: {
    ...DesignSystem.typography.footnote,
    letterSpacing: 0.3,
  },
  spacer: {
    flex: 1,
    minHeight: DesignSystem.spacing.xl,
  },
  dock: {
    gap: DesignSystem.spacing.sm,
    paddingTop: DesignSystem.spacing.lg,
  },
  appleWrapper: {
    marginTop: DesignSystem.spacing.xs,
  },
  appleButton: {
    width: "100%",
    height: DesignSystem.components.buttonLarge,
  },
});
