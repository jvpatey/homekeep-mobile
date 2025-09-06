import React, { useState, useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { Dashboard } from "../components/Dashboard";
import { useTasks } from "../hooks/useTasks";

export function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const { tasks, upcomingTasks, completedTasks, completeTask, refreshTasks } =
    useTasks();
  const [refreshing, setRefreshing] = useState(false);

  // Debug logging for task data flow
  console.log("🔄 DashboardScreen - useTasks() returned tasks:", tasks.length);
  console.log(
    "🔄 DashboardScreen - useTasks() returned upcomingTasks:",
    upcomingTasks.length
  );

  // Refresh tasks when screen comes into focus (e.g., navigating back from Settings)
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 DashboardScreen - Screen focused, refreshing tasks");
      refreshTasks();
    }, [refreshTasks])
  );

  // handleCompleteTask for the handleCompleteTask on the home screen
  const handleCompleteTask = async (instanceId: string) => {
    await completeTask(instanceId);
    // Refresh tasks after completion to update UI
    await refreshTasks();
  };

  // handleTaskPress for the handleTaskPress on the home screen
  const handleTaskPress = (instanceId: string) => {
    const task = upcomingTasks.find((t) => t.instance_id === instanceId);
    if (task) {
      // Task detail modal will be handled by the Dashboard component
      console.log("Task pressed:", task.title);
    }
  };

  // handleRefresh for the handleRefresh on the home screen
  const handleRefresh = async () => {
    console.log("🔄 DashboardScreen - Starting refresh");
    setRefreshing(true);
    await refreshTasks();
    console.log("✅ DashboardScreen - Refresh completed");
    setRefreshing(false);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <Dashboard
        tasks={upcomingTasks}
        completedTasks={completedTasks}
        onCompleteTask={handleCompleteTask}
        onTaskPress={handleTaskPress}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
