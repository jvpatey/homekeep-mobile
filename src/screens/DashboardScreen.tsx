import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { Dashboard } from "../components/Dashboard";
import { MaintenanceTask } from "../types/maintenance";
import { useTasks } from "../hooks/useTasks";

const DashboardScreen: React.FC = () => {
  const {
    tasks,
    upcomingTasks,
    completedTasks,
    completeTask,
    loading,
    refreshTasks,
  } = useTasks();
  const [refreshing, setRefreshing] = useState(false);

  const handleCompleteTask = async (instanceId: string) => {
    await completeTask(instanceId);
    // Refresh tasks after completion to update UI
    await refreshTasks();
  };

  const handleTaskPress = (instanceId: string) => {
    const task = upcomingTasks.find((t) => t.instance_id === instanceId);
    if (task) {
      // Task detail modal will be handled by the Dashboard component
      console.log("Task pressed:", task.title);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshTasks();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Dashboard
        tasks={tasks}
        onCompleteTask={handleCompleteTask}
        onTaskPress={handleTaskPress}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
});

export default DashboardScreen;
