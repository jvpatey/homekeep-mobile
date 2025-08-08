import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { useTheme } from "../context/ThemeContext";
import { useDynamicSpacing } from "../hooks";
import { LogoSection } from "../components/LogoSection/LogoSection";
import { WelcomeText } from "../components/WelcomeText/WelcomeText";
import { FeaturesSection } from "../components/FeaturesSection/FeaturesSection";
import { GradientDivider } from "../components/GradientDivider/GradientDivider";
import { ThemeToggle } from "../components/ThemeToggle/ThemeToggle";

/**
 * HomeScreen - The main landing page for unauthenticated users
 * Features responsive design, theme-aware styling, and animated components
 */
export function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { dynamicTopSpacing, dynamicBottomSpacing } = useDynamicSpacing();

  return (
    <PaperProvider>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "auto"} />

        {/* Theme Toggle in Top-Right Corner */}
        <View style={styles.themeToggleContainer}>
          <ThemeToggle size={44} />
        </View>

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
          <GradientDivider />
          <FeaturesSection />
        </ScrollView>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeToggleContainer: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
