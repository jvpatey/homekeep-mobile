import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView } from "react-native";
import { colors } from "../theme/colors";
import { LogoSection } from "../components/LogoSection/LogoSection";
import { WelcomeText } from "../components/WelcomeText/WelcomeText";
import { FeatureCard } from "../components/FeatureCard/FeatureCard";
import { ActionButtons } from "../components/ActionButtons/ActionButtons";

export function HomeScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar style="auto" />
      <LogoSection />
      <WelcomeText />
      <FeatureCard />
      <ActionButtons />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
});
