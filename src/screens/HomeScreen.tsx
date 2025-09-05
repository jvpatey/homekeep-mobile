import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { useDynamicSpacing } from "../hooks";
import { LogoSection } from "../components/onboarding";
import { WelcomeText } from "../components/onboarding";
import { FeaturesSection } from "../components/onboarding";
import { DesignSystem } from "../theme/designSystem";

// HomeScreen for the HomeScreen on the home screen
export function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { dynamicTopSpacing, dynamicBottomSpacing } = useDynamicSpacing();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

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
    paddingBottom: DesignSystem.spacing.xxxl,
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
    paddingTop: DesignSystem.spacing.lg,
  },
});
