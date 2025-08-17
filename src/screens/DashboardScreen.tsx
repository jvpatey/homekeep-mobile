import React, { useState, useCallback, useMemo, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  Dimensions,
} from "react-native";
import { PaperProvider } from "react-native-paper";
import { useTheme } from "../context/ThemeContext";
import { useDynamicSpacing } from "../hooks";
import { useTasks } from "../context/TasksContext";
import { DashboardHeader } from "../components/Dashboard/DashboardHeader";
import { TaskSummaryCards } from "../components/Dashboard/TaskSummaryCards";
import { TaskTabs } from "../components/Dashboard/TaskTabs";
import { FloatingActionButton } from "../components/Dashboard/FloatingActionButton";
import { CalendarView } from "../components/Calendar/CalendarView";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

// DashboardScreen - The main dashboard for authenticated users

interface Section {
  id: string;
  type: "header" | "body";
}

export function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const { dynamicTopSpacing, dynamicBottomSpacing } = useDynamicSpacing();
  const { completedTasks, upcomingTasks, refreshTasks } = useTasks();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState<"dashboard" | "calendar">("dashboard");

  // Side-swipe container setup
  const screenWidth = Dimensions.get("window").width;
  const translateX = useSharedValue(0);
  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    const target = mode === "dashboard" ? 0 : -screenWidth;
    translateX.value = withTiming(target, { duration: 260 });
  }, [mode, screenWidth]);

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

  // Define sections: header is static, body holds swipeable content
  const sections: Section[] = useMemo(() => {
    return [
      { id: "header", type: "header" },
      { id: "body", type: "body" },
    ];
  }, []);

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
        case "body":
          return (
            <View style={{ overflow: "hidden" }}>
              <Animated.View
                style={[
                  {
                    width: screenWidth * 2,
                    flexDirection: "row",
                  },
                  sliderStyle,
                ]}
              >
                <View style={{ width: screenWidth }}>
                  {searchQuery.trim().length === 0 && <TaskSummaryCards />}
                  <TaskTabs searchQuery={searchQuery} />
                </View>
                <View style={{ width: screenWidth }}>
                  <CalendarView
                    searchQuery={searchQuery}
                    onClearSearch={() => setSearchQuery("")}
                  />
                </View>
              </Animated.View>
            </View>
          );
        default:
          return null;
      }
    },
    [searchQuery, mode, screenWidth]
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
