import React from "react";
import { StyleSheet } from "react-native";
import { Dashboard } from "../components/Dashboard";
import { HearthScreen, TabFocusReveal } from "../components/ui";
import { usePrefetchTabs } from "../navigation/usePrefetchTabs";

/** The Today tab. Task state and actions come from TaskActionsProvider. */
export function DashboardScreen() {
  usePrefetchTabs();
  return (
    <HearthScreen edges={["left", "right"]} style={styles.screen}>
      <TabFocusReveal>
        <Dashboard />
      </TabFocusReveal>
    </HearthScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
