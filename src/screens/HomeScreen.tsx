import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { useDynamicSpacing } from "../hooks";
import { LogoSection } from "../components/LogoSection/LogoSection";
import { WelcomeText } from "../components/WelcomeText/WelcomeText";
import { FeaturesSection } from "../components/FeaturesSection/FeaturesSection";
import { GradientDivider } from "../components/GradientDivider/GradientDivider";
import { DesignSystem } from "../theme/designSystem";

/**
 * HomeScreen - The main landing page for unauthenticated users
 * Features responsive design, theme-aware styling, and animated components
 * Updated with modern 2025 design language matching the dashboard
 */
export function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { dynamicTopSpacing, dynamicBottomSpacing } = useDynamicSpacing();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      {/* Hero Section with Gradient Background */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
    paddingTop: DesignSystem.spacing.xxxl,
    paddingBottom: DesignSystem.spacing.xxxl, // Increased from xxl to xxxl for bigger hero
    paddingHorizontal: DesignSystem.spacing.md,
  },
  heroContent: {
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: DesignSystem.spacing.xxl, // Increased from xl to xxl for smoother hero-to-content transition
  },
});
