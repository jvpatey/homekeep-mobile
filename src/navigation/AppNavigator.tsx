import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DashboardScreen } from "../screens/DashboardScreen";
import { FilteredTasksScreen } from "../screens/FilteredTasksScreen";
import { TasksProvider } from "../context/TasksContext";
import { AppStackParamList } from "./types";

const Stack = createNativeStackNavigator<AppStackParamList>();

/**
 * AppNavigator - Main navigation stack for authenticated users
 * Contains all screens that require user authentication.
 * This is the primary navigation structure for the app's main functionality.
 */
export function AppNavigator() {
  return (
    <TasksProvider>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false, // Hide headers for a cleaner app experience
        }}
      >
        {/* Main app screens - add more authenticated screens here as the app grows */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="FilteredTasks" component={FilteredTasksScreen} />
      </Stack.Navigator>
    </TasksProvider>
  );
}
