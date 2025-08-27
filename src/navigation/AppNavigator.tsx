import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardScreen from "../screens/DashboardScreen";
import CompletionHistoryScreen from "../screens/CompletionHistoryScreen";
import { NotificationPreferencesScreen } from "../screens/NotificationPreferencesScreen";
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
          headerShown: false,
        }}
      >
        {/* Main app screens */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen
          name="CompletionHistory"
          component={CompletionHistoryScreen}
        />
        <Stack.Screen
          name="NotificationPreferences"
          component={NotificationPreferencesScreen}
        />
      </Stack.Navigator>
    </TasksProvider>
  );
}
