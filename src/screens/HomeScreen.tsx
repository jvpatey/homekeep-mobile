import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View, Dimensions } from "react-native";
import { PaperProvider } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { LogoSection } from "../components/LogoSection/LogoSection";
import { WelcomeText } from "../components/WelcomeText/WelcomeText";
import { FeatureCard } from "../components/FeatureCard/FeatureCard";
import { ThemeToggle } from "../components/ThemeToggle/ThemeToggle";

// Function component for the home screen
export function HomeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get("window");

  // Calculate responsive spacing based on screen size
  const isLargeScreen = screenHeight > 900; // iPhone Pro Max and larger
  const isMediumScreen = screenHeight > 800 && screenHeight <= 900; // iPhone Pro

  let dynamicTopSpacing, dynamicBottomSpacing;

  if (isLargeScreen) {
    // Pro Max and larger screens
    dynamicTopSpacing = insets.top + 40;
    dynamicBottomSpacing = 60;
  } else if (isMediumScreen) {
    // iPhone Pro and similar
    dynamicTopSpacing = insets.top + 15;
    dynamicBottomSpacing = 20;
  } else {
    // Smaller screens
    dynamicTopSpacing = insets.top + 10;
    dynamicBottomSpacing = 16;
  }

  return (
    <PaperProvider>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "auto"} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: dynamicTopSpacing,
              paddingBottom: dynamicBottomSpacing,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <LogoSection />
          <WelcomeText />
          <FeatureCard />
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
  },
});
