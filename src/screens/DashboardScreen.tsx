import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Dashboard } from "../components/Dashboard";
import { HearthScreen } from "../components/ui";
import { useTasks } from "../context/TasksContext";
import { useAppNavigation } from "../navigation/useAppNavigation";
import { refreshEquipmentIndex } from "../hooks/useEquipmentIndex";

export function DashboardScreen() {
  const { openPlan, openPlanFlow } = useAppNavigation();
  const {
    upcomingTasks,
    overdueTasks,
    completedTasks,
    completeTask,
    skipTaskOccurrence,
    pauseTask,
    refreshTasks,
    error: tasksError,
  } = useTasks();
  const [refreshing, setRefreshing] = useState(false);

  const handleTaskPress = (instanceId: string) => {
    const task = upcomingTasks.find((t) => t.instance_id === instanceId);
    if (task) {
      // Task detail modal will be handled by the Dashboard component
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshTasks(), refreshEquipmentIndex()]);
    setRefreshing(false);
  };

  return (
    <HearthScreen
      edges={["left", "right"]}
      style={styles.screen}
    >
      <Dashboard
        tasks={upcomingTasks}
        overdueTasks={overdueTasks}
        completedTasks={completedTasks}
        onCompleteTask={completeTask}
        onSkipTaskOccurrence={skipTaskOccurrence}
        onPauseTask={pauseTask}
        onTaskPress={handleTaskPress}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        tasksError={tasksError}
        onRetryTasks={refreshTasks}
        onBrowseMaintenancePlans={(planId) =>
          planId ? openPlanFlow(planId) : openPlan({ segment: "library" })
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
