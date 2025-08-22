import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { Dashboard } from "../components/Dashboard";
import { Task } from "../types/task";

const DashboardScreen: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const handleCompleteTask = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              is_completed: true,
              completed_at: new Date().toISOString(),
            }
          : task
      )
    );
  };

  const handleTaskPress = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      // Task detail modal will be handled by the Dashboard component
      console.log("Task pressed:", task.title);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
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
