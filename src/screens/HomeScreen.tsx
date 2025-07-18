import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { LogoSection } from "../components/LogoSection/LogoSection";
import { WelcomeText } from "../components/WelcomeText/WelcomeText";
import { FeatureCard } from "../components/FeatureCard/FeatureCard";
import { ThemeToggle } from "../components/ThemeToggle/ThemeToggle";

// Function component for the home screen
export function HomeScreen() {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "auto"} />
      <LogoSection />
      <WelcomeText />
      <FeatureCard />
      <ThemeToggle />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
