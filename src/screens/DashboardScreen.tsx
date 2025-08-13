import React, { useState, useCallback, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, FlatList, RefreshControl } from "react-native";
import { PaperProvider } from "react-native-paper";
import { useTheme } from "../context/ThemeContext";
import { useDynamicSpacing } from "../hooks";
import { useTasks } from "../context/TasksContext";
import { DashboardHeader } from "../components/Dashboard/DashboardHeader";
import { TaskSummaryCards } from "../components/Dashboard/TaskSummaryCards";
import { TaskTabs } from "../components/Dashboard/TaskTabs";
import { CalendarView } from "../components/Calendar/CalendarView";
import { FloatingActionButton } from "../components/Dashboard/FloatingActionButton";

// DashboardScreen - The main dashboard for authenticated users

interface Section {
  id: string;
  type: "header" | "summary" | "tasks" | "calendar";
}

export function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const { dynamicTopSpacing, dynamicBottomSpacing } = useDynamicSpacing();
  const { completedTasks, upcomingTasks, refreshTasks } = useTasks();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState<"dashboard" | "calendar">("dashboard");

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
  const sections: Section[] = useMemo(() => {
    if (mode === "calendar") {
      return [
        { id: "header", type: "header" },
        { id: "calendar", type: "calendar" },
      ];
    }
    return [
      { id: "header", type: "header" },
      { id: "summary", type: "summary" },
      { id: "tasks", type: "tasks" },
    ];
  }, [mode]);

  const renderSection = useCallback(
    ({ item }: { item: Section }) => {
      switch (item.type) {
        case "header":
          return (
            <DashboardHeader
              onSearchChange={handleSearchChange}
              searchQuery={searchQuery}
              mode={mode}
              onPrimaryToggle={() =>
                setMode((m) => (m === "calendar" ? "dashboard" : "calendar"))
              }
            />
          );
        case "summary":
          return <TaskSummaryCards />;
        case "tasks":
          return <TaskTabs searchQuery={searchQuery} />;
        case "calendar":
          return <CalendarView />;
        default:
          return null;
      }
    },
    [searchQuery, mode]
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
