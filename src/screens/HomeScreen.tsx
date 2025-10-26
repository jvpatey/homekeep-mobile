import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View, Text, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { useDynamicSpacing } from "../hooks";
import { LogoSection } from "../components/onboarding";
import { WelcomeText } from "../components/onboarding";
import { FeaturesSection } from "../components/onboarding";
import { DesignSystem } from "../theme/designSystem";

const { height: screenHeight } = Dimensions.get("window");
const isProMax = screenHeight > 920; // Specifically for Pro Max

// HomeScreen for the HomeScreen on the home screen
export function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { dynamicTopSpacing, dynamicBottomSpacing } = useDynamicSpacing();

  // Ultra subtle gradient - teal to blue only, no orange
  const gradientColors = isDark
    ? [
        "rgba(46, 196, 182, 0.04)",
        "rgba(58, 134, 255, 0.01)",
        colors.background,
      ]
    : [
        "rgba(46, 196, 182, 0.06)",
        "rgba(58, 134, 255, 0.02)",
        colors.background,
      ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Hero Section with Ultra Subtle Gradient */}
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.15, 1]}
        style={styles.heroSection}
      >
        <View style={styles.heroContent}>
          <LogoSection showText={true} compact={false} />
          <WelcomeText />
        </View>
      </LinearGradient>

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
    paddingTop: DesignSystem.spacing.xxl,
    paddingBottom: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    justifyContent: "center",
  },
  heroContent: {
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.md,
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
