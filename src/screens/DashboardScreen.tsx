import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { Dashboard } from "../components/Dashboard";
import { useTasks } from "../hooks/useTasks";

export function DashboardScreen() {
  const { tasks, upcomingTasks, completeTask, refreshTasks } = useTasks();
  const [refreshing, setRefreshing] = useState(false);

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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
});
