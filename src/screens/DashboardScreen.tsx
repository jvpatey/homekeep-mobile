import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { Dashboard } from "../components/Dashboard";
import { Task, HOME_MAINTENANCE_CATEGORIES } from "../types/task";

// Sample data for demonstration
const sampleTasks: Task[] = [
  {
    id: "1",
    user_id: "user1",
    title: "Change HVAC air filter",
    description: "Replace the air filter in the main HVAC unit",
    category: "HVAC",
    priority: "high",
    estimated_duration: 15,
    is_recurring: true,
    recurrence_type: "monthly",
    next_due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_completed: false,
  },
  {
    id: "2",
    user_id: "user1",
    title: "Clean kitchen drain",
    description: "Remove buildup and clean the kitchen sink drain",
    category: "PLUMBING",
    priority: "medium",
    estimated_duration: 30,
    is_recurring: true,
    recurrence_type: "monthly",
    next_due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_completed: false,
  },
  {
    id: "3",
    user_id: "user1",
    title: "Test smoke detectors",
    description: "Test all smoke detectors and replace batteries if needed",
    category: "SAFETY",
    priority: "urgent",
    estimated_duration: 20,
    is_recurring: true,
    recurrence_type: "monthly",
    next_due_date: new Date().toISOString(), // Today
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_completed: false,
  },
  {
    id: "4",
    user_id: "user1",
    title: "Clean refrigerator coils",
    description: "Vacuum the condenser coils behind the refrigerator",
    category: "APPLIANCES",
    priority: "low",
    estimated_duration: 45,
    is_recurring: true,
    recurrence_type: "quarterly",
    next_due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_completed: false,
  },
  {
    id: "5",
    user_id: "user1",
    title: "Inspect roof for damage",
    description: "Check for missing shingles or other roof damage",
    category: "EXTERIOR",
    priority: "high",
    estimated_duration: 60,
    is_recurring: true,
    recurrence_type: "yearly",
    next_due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_completed: false,
  },
  {
    id: "6",
    user_id: "user1",
    title: "Replace light bulbs",
    description: "Replace any burned out light bulbs throughout the house",
    category: "ELECTRICAL",
    priority: "medium",
    estimated_duration: 25,
    is_recurring: false,
    recurrence_type: undefined,
    next_due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_completed: false,
  },
  {
    id: "7",
    user_id: "user1",
    title: "Clean gutters",
    description: "Remove leaves and debris from roof gutters",
    category: "EXTERIOR",
    priority: "medium",
    estimated_duration: 90,
    is_recurring: true,
    recurrence_type: "quarterly",
    next_due_date: new Date(
      Date.now() + 10 * 24 * 60 * 60 * 1000
    ).toISOString(), // 10 days from now
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_completed: false,
  },
  {
    id: "8",
    user_id: "user1",
    title: "Service water heater",
    description: "Drain and flush the water heater tank",
    category: "PLUMBING",
    priority: "high",
    estimated_duration: 60,
    is_recurring: true,
    recurrence_type: "yearly",
    next_due_date: new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000
    ).toISOString(), // 14 days from now
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_completed: false,
  },
];

const DashboardScreen: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
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
      Alert.alert(
        "Task Details",
        `${task.title}\n\nCategory: ${task.category}\nPriority: ${
          task.priority
        }\nEstimated Duration: ${
          task.estimated_duration || "Unknown"
        } minutes\nDue: ${new Date(task.next_due_date).toLocaleDateString()}`,
        [{ text: "OK" }]
      );
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
