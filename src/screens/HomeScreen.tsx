import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { useDynamicSpacing, useGradients, useDevice } from "../hooks";
import { LogoSection } from "../components/onboarding";
import { WelcomeText } from "../components/onboarding";
import { FeaturesSection } from "../components/onboarding";
import { DesignSystem } from "../theme/designSystem";

const { height: screenHeight } = Dimensions.get("window");
const isProMax = screenHeight > 920; // Specifically for Pro Max

// HomeScreen for the HomeScreen on the home screen
export function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { dynamicBottomSpacing } = useDynamicSpacing();
  const { heroGradient, heroGradientLocations, ambientGradient, radialGlow } = useGradients();
  const { isTablet, getMaxContentWidth, getGradientFadeHeight, getResponsiveValue, getGradientFadeLocations, getGradientFadeColors, getHeroSectionHeight, width, height } = useDevice();
  
  const maxContentWidth = getMaxContentWidth();
  const gradientFadeHeight = getGradientFadeHeight();
  const fadeLocations = getGradientFadeLocations(isDark);
  const fadeColors = getGradientFadeColors(isDark, colors.background);
  const heroSectionHeight = getHeroSectionHeight();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Hero Section with Modern Glow Gradient */}
      <View style={[
        styles.heroSection,
        { 
          marginBottom: DesignSystem.spacing.lg,
          backgroundColor: colors.background, // Set background color to prevent dark bar
        },
        heroSectionHeight && {
          minHeight: heroSectionHeight,
          paddingTop: DesignSystem.spacing.xxxl,
          paddingBottom: DesignSystem.spacing.xxxl,
        },
      ]}>
        {/* Bottom fade mask - positioned at bottom to blend gradients to background */}
        <LinearGradient
          colors={fadeColors}
          locations={fadeLocations}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            styles.bottomFade,
            {
              height: gradientFadeHeight,
              bottom: 0,
            },
            // For iPads, make fade taller to cover transition area
            isTablet && {
              height: Math.max(width, height) > 1300 
                ? gradientFadeHeight * 1.6  // iPad Pro 13"
                : gradientFadeHeight * 1.3, // Standard iPads
            },
          ]}
          pointerEvents="none"
        />
        
        {/* Layered gradient background */}
        <LinearGradient
          colors={heroGradient}
          locations={heroGradientLocations}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradientBase}
        />
        
        {/* Glow effect */}
        <LinearGradient
          colors={[radialGlow.innerColor, radialGlow.midColor, radialGlow.outerColor, radialGlow.fadeColor]}
          locations={[0, 0.3, 0.6, 1]}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientGlow}
        />
        
        {/* Ambient light layer - fade to transparent on iPads to prevent dark bar */}
        <LinearGradient
          colors={
            isTablet
              ? isDark
                ? [
                    "rgba(46, 196, 182, 0.10)",
                    "rgba(58, 134, 255, 0.06)",
                    "rgba(46, 196, 182, 0.03)",
                    "transparent",
                  ]
                : [
                    "rgba(46, 196, 182, 0.12)",
                    "rgba(58, 134, 255, 0.08)",
                    "rgba(46, 196, 182, 0.025)",
                    "transparent",
                  ]
              : ambientGradient
          }
          locations={[0, 0.4, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientAmbient}
        />

        <View style={[
          styles.heroContent,
          maxContentWidth && { maxWidth: maxContentWidth, alignSelf: "center", width: "100%" },
        ]}>
          <LogoSection showText={true} compact={false} />
          <WelcomeText />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: dynamicBottomSpacing,
          },
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
    overflow: "hidden", // Keep hidden to contain gradients
    paddingTop: DesignSystem.spacing.xl,
    paddingBottom: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 10,
  },
  gradientBase: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  gradientGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  gradientAmbient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  heroContent: {
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.md,
    position: "relative",
    zIndex: 15, // Higher than fade (10) so text isn't covered
    width: "100%",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: DesignSystem.spacing.md,
    justifyContent: "flex-start",
    alignItems: "center",
  },
});
