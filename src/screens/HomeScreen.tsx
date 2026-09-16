import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useDevice, useGradients, useHaptics, useReducedMotion } from "../hooks";
import { HouseMark, Button, TextLink, HearthSurfaceCard } from "../components/ui";
import { AppleContinueButton } from "../components/auth";
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
  const {
    isRegularWidth,
    width,
    height,
    getAuthContentWidth,
    getMaxContentWidth,
    getResponsiveValue,
  } = useDevice();
  const [appleLoading, setAppleLoading] = useState(false);

  const isTabletPortrait = isRegularWidth && height >= width;
  const splitWidth = getMaxContentWidth();
  const phoneColumnWidth = getAuthContentWidth("welcome");
  const ctaCardWidth = isRegularWidth
    ? getResponsiveValue(
        isTabletPortrait ? 300 : 320,
        isTabletPortrait ? 320 : 360,
        400
      )
    : undefined;
  const gutter = isRegularWidth
    ? getResponsiveValue(
        DesignSystem.spacing.xl,
        DesignSystem.spacing.xxl,
        DesignSystem.spacing.xxl
      )
    : DesignSystem.spacing.lg;
  const wordmarkSize = isRegularWidth ? getResponsiveValue(20, 22, 24) : 20;
  // Keep the mark present, not towering — tall marks unbalance the split CTA.
  const heroSize = isRegularWidth
    ? getResponsiveValue(isTabletPortrait ? 72 : 88, 96, 112)
    : 120;
  const headlineFontSize = isRegularWidth
    ? getResponsiveValue(36, 42, 48)
    : 38;
  const headlineLineHeight = isRegularWidth
    ? getResponsiveValue(42, 48, 54)
    : 44;
  const supportFontSize = isRegularWidth ? getResponsiveValue(16, 17, 18) : 16;
  const supportLineHeight = isRegularWidth
    ? getResponsiveValue(22, 24, 26)
    : 22;
  const heroMarkMarginTop = isRegularWidth
    ? DesignSystem.spacing.sm
    : DesignSystem.spacing.xxxl;
  const heroMarkMarginBottom = isRegularWidth
    ? DesignSystem.spacing.md
    : DesignSystem.spacing.xl;
  const cardPadding = isRegularWidth
    ? getResponsiveValue(
        DesignSystem.spacing.xl,
        DesignSystem.spacing.xl,
        DesignSystem.spacing.xxl
      )
    : DesignSystem.spacing.lg;
  const splitGap = isRegularWidth
    ? getResponsiveValue(
        DesignSystem.spacing.xl,
        DesignSystem.spacing.xxl,
        DesignSystem.spacing.xxl
      )
    : DesignSystem.spacing.xl;

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

  const copy = (
    <>
      <Animated.View
        {...(entering
          ? {
              entering: FadeIn.delay(60).duration(
                DesignSystem.motion.duration.base,
              ),
            }
          : {})}
        style={[
          styles.heroMarkContainer,
          {
            marginTop: heroMarkMarginTop,
            marginBottom: heroMarkMarginBottom,
          },
        ]}
      >
        <HouseMark size={heroSize} />
      </Animated.View>

      <Animated.View
        {...(entering
          ? {
              entering: FadeIn.delay(120).duration(
                DesignSystem.motion.duration.base,
              ),
            }
          : {})}
        style={styles.copyBlock}
      >
        <View style={styles.headlineBlock}>
          <Text
            style={[
              styles.headline,
              {
                color: colors.text,
                fontSize: headlineFontSize,
                lineHeight: headlineLineHeight,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            maxFontSizeMultiplier={1.25}
          >
            Home maintenance,
          </Text>
          <Text
            style={[
              styles.headline,
              {
                color: colors.text,
                fontSize: headlineFontSize,
                lineHeight: headlineLineHeight,
              },
            ]}
            maxFontSizeMultiplier={1.25}
          >
            handled.
          </Text>
        </View>
        <Text
          style={[
            styles.support,
            {
              color: colors.textSecondary,
              fontSize: supportFontSize,
              lineHeight: supportLineHeight,
            },
          ]}
          maxFontSizeMultiplier={1.4}
        >
          Reminders, history, and a plan — without the mental load.
        </Text>
        <Text style={[styles.proofs, { color: colors.textSecondary }]}>
          {PROOFS.join("  ·  ")}
        </Text>
      </Animated.View>
    </>
  );

  const dock = (
    <Animated.View
      {...(entering
        ? {
            entering: FadeIn.delay(180).duration(
              DesignSystem.motion.duration.base,
            ),
          }
        : {})}
      style={styles.dock}
    >
      <Button
        label="Create account"
        onPress={handleCreateAccount}
        variant="primary"
      />

      <AppleContinueButton onPress={handleAppleSignIn} />

      <TextLink
        prefix="Already have an account?"
        linkText="Sign in"
        onPress={handleSignIn}
      />
    </Animated.View>
  );

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
            paddingHorizontal: gutter,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View
          style={[
            styles.column,
            isRegularWidth && splitWidth != null && { maxWidth: splitWidth },
            !isRegularWidth &&
              phoneColumnWidth != null && { maxWidth: phoneColumnWidth },
          ]}
        >
          <Animated.View
            {...(entering ? { entering } : {})}
            style={styles.wordmarkRow}
          >
            <View style={[styles.wordmarkMark, { height: wordmarkSize }]}>
              <HouseMark size={wordmarkSize} inline />
            </View>
            <Text
              style={[
                styles.wordmark,
                {
                  color: colors.text,
                  fontSize: isRegularWidth
                    ? getResponsiveValue(17, 18, 19)
                    : 17,
                  lineHeight: wordmarkSize,
                },
              ]}
            >
              HomeKeep
            </Text>
          </Animated.View>

          {isRegularWidth ? (
            <View style={styles.heroStage}>
              <View style={[styles.splitRow, { gap: splitGap }]}>
                <View style={styles.brand}>{copy}</View>
                <HearthSurfaceCard
                  containerStyle={[
                    styles.ctaCardContainer,
                    ctaCardWidth != null && { maxWidth: ctaCardWidth },
                  ]}
                  style={[
                    styles.ctaCard,
                    {
                      padding: cardPadding,
                      width: "100%",
                      flex: 1,
                      justifyContent: "center",
                    },
                  ]}
                >
                  {dock}
                </HearthSurfaceCard>
              </View>
            </View>
          ) : (
            <>
              {copy}
              <View style={styles.spacer} />
              {dock}
            </>
          )}
        </View>
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
  },
  column: {
    width: "100%",
    flexGrow: 1,
    alignSelf: "center",
  },
  heroStage: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: DesignSystem.spacing.xl,
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
  },
  brand: {
    flex: 1.15,
    minWidth: 0,
    justifyContent: "center",
  },
  ctaCardContainer: {
    flex: 1,
    minWidth: 260,
    maxWidth: 400,
    alignSelf: "stretch",
  },
  ctaCard: {
    overflow: "visible",
    minHeight: 220,
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm + 2,
    marginBottom: DesignSystem.spacing.md,
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
  },
});
