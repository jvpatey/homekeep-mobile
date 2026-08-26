import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Dashboard } from "../components/Dashboard";
import { HearthScreen } from "../components/ui";
import { useTasks } from "../context/TasksContext";
import { AppStackParamList } from "../navigation/types";

export function DashboardScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const {
    upcomingTasks,
    overdueTasks,
    completedTasks,
    completeTask,
    skipTaskOccurrence,
    refreshTasks,
    error: tasksError,
  } = useTasks();
  const [refreshing, setRefreshing] = useState(false);

  const handleCompleteTask = async (instanceId: string) => {
    await completeTask(instanceId);
  };

  const handleTaskPress = (instanceId: string) => {
    const task = upcomingTasks.find((t) => t.instance_id === instanceId);
    if (task) {
      // Task detail modal will be handled by the Dashboard component
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshTasks();
    setRefreshing(false);
  };

  return (
    <HearthScreen
      edges={["left", "right"]}
      statusBarTranslucent
      style={styles.screen}
    >
      <Dashboard
        tasks={upcomingTasks}
        overdueTasks={overdueTasks}
        completedTasks={completedTasks}
        onCompleteTask={handleCompleteTask}
        onSkipTaskOccurrence={skipTaskOccurrence}
        onTaskPress={handleTaskPress}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        tasksError={tasksError}
        onRetryTasks={refreshTasks}
        onBrowseMaintenancePlans={() =>
          navigation.navigate("MaintenancePlans")
        }
      />
    </HearthScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
