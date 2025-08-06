import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View, RefreshControl } from "react-native";
import { PaperProvider } from "react-native-paper";
import { useTheme } from "../context/ThemeContext";
import { useDynamicSpacing } from "../hooks";
import { DashboardHeader } from "../components/Dashboard/DashboardHeader";
import { TaskSummaryCards } from "../components/Dashboard/TaskSummaryCards";
import { UpcomingTasks } from "../components/Dashboard/UpcomingTasks";
import { FloatingActionButton } from "../components/Dashboard/FloatingActionButton";

// DashboardScreen - The main dashboard for authenticated users

export function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const { dynamicTopSpacing, dynamicBottomSpacing } = useDynamicSpacing();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch latest task data
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

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
              paddingBottom: dynamicBottomSpacing + 100, // Extra space for FAB
            },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <DashboardHeader />
          <TaskSummaryCards />
          <UpcomingTasks />
        </ScrollView>
        <FloatingActionButton />
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
