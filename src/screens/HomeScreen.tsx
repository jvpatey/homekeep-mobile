import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { useDynamicSpacing, useGradients } from "../hooks";
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Hero Section with Modern Glow Gradient */}
      <View style={styles.heroSection}>
        {/* Bottom fade mask - inside the hero container */}
        <LinearGradient
          colors={["transparent", colors.background]}
          locations={[0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.bottomFade}
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
        
        {/* Ambient light layer */}
        <LinearGradient
          colors={ambientGradient}
          locations={[0, 0.4, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientAmbient}
        />

        <View style={styles.heroContent}>
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
    overflow: "hidden",
    paddingTop: DesignSystem.spacing.xl,
    paddingBottom: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    justifyContent: "center",
  },
  bottomFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
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
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: DesignSystem.spacing.md,
    justifyContent: "flex-start",
  },
});
