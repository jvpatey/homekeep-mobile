import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View, Dimensions } from "react-native";
import { PaperProvider } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { LogoSection } from "../components/LogoSection/LogoSection";
import { WelcomeText } from "../components/WelcomeText/WelcomeText";
import { FeaturesSection } from "../components/FeaturesSection/FeaturesSection";
import { ThemeToggle } from "../components/ThemeToggle/ThemeToggle";

// Function component for the home screen
export function HomeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get("window");

  const isLargeScreen = screenHeight > 900;
  const isMediumScreen = screenHeight > 800 && screenHeight <= 900;

  let dynamicTopSpacing, dynamicBottomSpacing;

  if (isLargeScreen) {
    dynamicTopSpacing = insets.top + 40;
    dynamicBottomSpacing = 60;
  } else if (isMediumScreen) {
    dynamicTopSpacing = insets.top + 15;
    dynamicBottomSpacing = 20;
  } else {
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
          <FeaturesSection />
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
