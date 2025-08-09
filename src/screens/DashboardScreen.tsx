import React, { useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, FlatList, RefreshControl } from "react-native";
import { PaperProvider } from "react-native-paper";
import { useTheme } from "../context/ThemeContext";
import { useDynamicSpacing } from "../hooks";
import { useTasks } from "../context/TasksContext";
import { DashboardHeader } from "../components/Dashboard/DashboardHeader";
import { TaskSummaryCards } from "../components/Dashboard/TaskSummaryCards";
import { UpcomingTasks } from "../components/Dashboard/UpcomingTasks";
import { CompletedTasks } from "../components/Dashboard/CompletedTasks";
import { FloatingActionButton } from "../components/Dashboard/FloatingActionButton";

// DashboardScreen - The main dashboard for authenticated users

interface Section {
  id: string;
  type: "header" | "summary" | "upcoming" | "completed";
}

export function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const { dynamicTopSpacing, dynamicBottomSpacing } = useDynamicSpacing();
  const { completedTasks, upcomingTasks, refreshTasks } = useTasks();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshTasks();
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Define the sections for the FlatList
  const sections: Section[] = [
    { id: "header", type: "header" },
    { id: "summary", type: "summary" },
    // Always show upcoming tasks section (it has its own empty state)
    { id: "upcoming", type: "upcoming" },
    // Always show completed tasks section (it has its own empty state)
    { id: "completed", type: "completed" },
  ];

  const renderSection = useCallback(
    ({ item }: { item: Section }) => {
      switch (item.type) {
        case "header":
          return (
            <DashboardHeader
              onSearchChange={handleSearchChange}
              searchQuery={searchQuery}
            />
          );
        case "summary":
          return <TaskSummaryCards />;
        case "upcoming":
          return <UpcomingTasks searchQuery={searchQuery} />;
        case "completed":
          return <CompletedTasks searchQuery={searchQuery} />;
        default:
          return null;
      }
    },
    [searchQuery, upcomingTasks.length, completedTasks.length]
  );

  const keyExtractor = useCallback((item: Section) => item.id, []);

  return (
    <PaperProvider>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "auto"} />
        <FlatList
          data={sections}
          renderItem={renderSection}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.contentContainer,
            {
              paddingTop: dynamicTopSpacing,
              paddingBottom: dynamicBottomSpacing + 100, // Extra space for FAB
            },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
        <FloatingActionButton />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});
