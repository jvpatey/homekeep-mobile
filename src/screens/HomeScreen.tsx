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

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
