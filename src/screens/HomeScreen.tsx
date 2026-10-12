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
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useDevice, useGradients, useHaptics, useReducedMotion } from "../hooks";
import { HouseMark, Button, TextLink, HearthSurfaceCard } from "../components/ui";
import { AppleContinueButton } from "../components/auth";
import { HeroIconName, useEnter } from "../components/ui/hero/heroKit";
import {
  WelcomeHero,
  WELCOME_HERO_WIDTH,
} from "../components/welcome/WelcomeHero";
import { AuthStackParamList } from "../navigation/types";
import { DesignSystem } from "../theme/designSystem";

type WelcomeNavigation = NativeStackNavigationProp<AuthStackParamList, "Home">;

const BENEFITS: { icon: HeroIconName; title: string; detail: string }[] = [
  {
    icon: "calendar-outline",
    title: "A plan made for your home",
    detail: "Seasonal tasks for your climate and equipment",
  },
  {
    icon: "folder-open-outline",
    title: "Your home's record",
    detail: "Equipment, documents, shutoffs, and recalls",
  },
  {
    icon: "people-outline",
    title: "Share it, ask it anything",
    detail: "Invite your household and ask Keeper",
  },
];

/** Phones shorter than this (e.g. iPhone SE) get a smaller hero to keep the CTAs above the fold. */
const COMPACT_HEIGHT = 720;
/** The support line only fits alongside the benefits on tall phones. */
const SUPPORT_MIN_HEIGHT = 900;

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
  const isCompact = !isRegularWidth && height < COMPACT_HEIGHT;
  const showSupport = isRegularWidth || height >= SUPPORT_MIN_HEIGHT;
  const phoneHeroScale = isCompact ? 0.8 : showSupport ? 1.15 : 1;
  const heroScale = isRegularWidth
    ? getResponsiveValue(isTabletPortrait ? 0.9 : 1, 1, 1.15)
    : Math.min(phoneHeroScale, (width - gutter * 2) / WELCOME_HERO_WIDTH);
  const headlineFontSize = isRegularWidth
    ? getResponsiveValue(36, 42, 48)
    : isCompact
      ? 30
      : 34;
  const headlineLineHeight = isRegularWidth
    ? getResponsiveValue(42, 48, 54)
    : isCompact
      ? 36
      : 40;
  const supportFontSize = isRegularWidth ? getResponsiveValue(16, 17, 18) : 16;
  const supportLineHeight = isRegularWidth
    ? getResponsiveValue(22, 24, 26)
    : 22;
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
  const enter = useEnter();

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

  const headlineStyle = [
    styles.headline,
    {
      color: colors.text,
      fontSize: headlineFontSize,
      lineHeight: headlineLineHeight,
    },
  ];

  const copy = (
    <View style={styles.copyBlock}>
      <WelcomeHero scale={heroScale} />

      <Animated.View
        entering={enter(260)}
        style={[
          styles.headlineBlock,
          { marginBottom: showSupport ? DesignSystem.spacing.sm : DesignSystem.spacing.lg },
        ]}
        accessible
        accessibilityRole="header"
        accessibilityLabel="Home maintenance, handled."
      >
        <Text
          style={headlineStyle}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          maxFontSizeMultiplier={1.25}
        >
          Home maintenance,
        </Text>
        <Text style={headlineStyle} maxFontSizeMultiplier={1.25}>
          handled.
        </Text>
      </Animated.View>

      {showSupport ? (
        <Animated.Text
          entering={enter(340)}
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
        </Animated.Text>
      ) : null}

      <View
        style={[
          styles.benefits,
          { gap: isCompact ? DesignSystem.spacing.sm : DesignSystem.spacing.sm + 4 },
        ]}
      >
        {BENEFITS.map((benefit, index) => (
          <Animated.View
            key={benefit.title}
            entering={enter(420 + index * 70)}
            style={styles.benefit}
          >
            <View
              style={[styles.benefitIcon, { backgroundColor: colors.glassGlow }]}
            >
              <Ionicons name={benefit.icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.benefitText}>
              <Text
                style={[styles.benefitTitle, { color: colors.text }]}
                maxFontSizeMultiplier={1.3}
              >
                {benefit.title}
              </Text>
              <Text
                style={[styles.benefitDetail, { color: colors.textSecondary }]}
                maxFontSizeMultiplier={1.3}
              >
                {benefit.detail}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
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
            paddingTop: insets.top + DesignSystem.spacing.sm,
            paddingBottom:
              insets.bottom +
              (isCompact ? DesignSystem.spacing.md : DesignSystem.spacing.lg),
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
              <View style={styles.topSpacer} />
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
    marginBottom: DesignSystem.spacing.sm,
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
  copyBlock: {
    alignItems: "center",
  },
  headlineBlock: {
    width: "100%",
  },
  headline: {
    ...DesignSystem.typography.display,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1,
    textAlign: "center",
  },
  support: {
    ...DesignSystem.typography.callout,
    textAlign: "center",
    maxWidth: 360,
    marginBottom: DesignSystem.spacing.lg,
  },
  benefits: {
    width: "100%",
    maxWidth: 400,
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    ...DesignSystem.typography.bodySemiBold,
  },
  benefitDetail: {
    ...DesignSystem.typography.footnote,
  },
  topSpacer: {
    flex: 1,
  },
  spacer: {
    flex: 1.5,
    minHeight: DesignSystem.spacing.md,
  },
  dock: {
    gap: DesignSystem.spacing.sm,
  },
});
