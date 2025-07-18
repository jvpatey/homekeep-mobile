import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { useTheme } from "../context/ThemeContext";
import { LogoSection } from "../components/LogoSection/LogoSection";
import { WelcomeText } from "../components/WelcomeText/WelcomeText";
import { FeatureCard } from "../components/FeatureCard/FeatureCard";
import { ThemeToggle } from "../components/ThemeToggle/ThemeToggle";

// Function component for the home screen
export function HomeScreen() {
  const { colors, isDark } = useTheme();

  return (
    <PaperProvider>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "auto"} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LogoSection />
          <WelcomeText />
          <FeatureCard />
          <View style={styles.bottomSpacing} />
        </ScrollView>
        <ThemeToggle />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  bottomSpacing: {
    height: 32,
  },
});
