import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { useDynamicSpacing, useGradients, useDevice } from "../hooks";
import { LogoSection } from "../components/onboarding";
import { WelcomeText } from "../components/onboarding";
import { FeaturesSection } from "../components/onboarding";
import { DesignSystem } from "../theme/designSystem";

/**
 * HomeScreen — 2026 Liquid Glass redesign.
 *
 * The previous version stacked 4 colored gradient layers (hero, glow,
 * ambient, fade) plus a tri-color rainbow CTA. iOS 26 design language
 * favors restraint: a single soft monochrome halo behind the focal
 * element, generous whitespace, and translucent glass for any container
 * chrome.
 */
export function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { dynamicBottomSpacing } = useDynamicSpacing();
  const { haloGradient } = useGradients();
  const { isTablet, getMaxContentWidth, getHeroSectionHeight } = useDevice();

  const maxContentWidth = getMaxContentWidth();
  const heroSectionHeight = getHeroSectionHeight();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Hero Section — single halo gradient behind the logo */}
      <View
        style={[
          styles.heroSection,
          { backgroundColor: colors.background },
          heroSectionHeight !== undefined && {
            minHeight: heroSectionHeight,
            paddingTop: DesignSystem.spacing.xxl,
            paddingBottom: DesignSystem.spacing.lg,
          },
        ]}
      >
        <LinearGradient
          colors={haloGradient}
          start={{ x: 0.5, y: 0.15 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.halo}
          pointerEvents="none"
        />

        <View
          style={[
            styles.heroContent,
            maxContentWidth && {
              maxWidth: maxContentWidth,
              alignSelf: "center",
              width: "100%",
            },
          ]}
        >
          <LogoSection
            showText={true}
            compact={false}
            accentKeep
            variant="hero"
          />
          <WelcomeText />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: dynamicBottomSpacing },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <FeaturesSection />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    position: "relative",
    paddingTop: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  halo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContent: {
    alignItems: "center",
    position: "relative",
    zIndex: 1,
    width: "100%",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: DesignSystem.spacing.md,
  },
});
