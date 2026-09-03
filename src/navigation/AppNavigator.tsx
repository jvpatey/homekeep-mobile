import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DashboardScreen } from "../screens/DashboardScreen";
import { CompletionHistoryScreen } from "../screens/completion-history";
import { NotificationPreferencesScreen } from "../screens/notification-preferences";
import { SettingsScreen } from "../screens/settings";
import { AllTasksScreen } from "../screens/all-tasks";
import { MaintenancePlansScreen } from "../screens/maintenance-plans";
import { HomeSummaryPreviewScreen } from "../screens/home-summary-preview";
import { TasksProvider } from "../context/TasksContext";
import { AppStackParamList } from "./types";

const Stack = createNativeStackNavigator<AppStackParamList>();

const sheetScreenOptions = {
  presentation: "transparentModal" as const,
  animation: "none" as const,
  headerShown: false,
  contentStyle: { backgroundColor: "transparent" },
};

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
          animation: "slide_from_right",
        }}
      >
        {/* Main app screens */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen
          name="CompletionHistory"
          component={CompletionHistoryScreen}
          options={sheetScreenOptions}
        />
        <Stack.Screen
          name="NotificationPreferences"
          component={NotificationPreferencesScreen}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={sheetScreenOptions}
        />
        <Stack.Screen name="AllTasks" component={AllTasksScreen} />
        <Stack.Screen
          name="MaintenancePlans"
          component={MaintenancePlansScreen}
        />
        <Stack.Screen
          name="HomeSummaryPreview"
          component={HomeSummaryPreviewScreen}
          options={sheetScreenOptions}
        />
      </Stack.Navigator>
    </TasksProvider>
  );
}
