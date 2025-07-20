import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/HomeScreen";
import { AppStackParamList } from "./types";

const Stack = createNativeStackNavigator<AppStackParamList>();

/**
 * AppNavigator - Main navigation stack for authenticated users
 * Contains all screens that require user authentication.
 * This is the primary navigation structure for the app's main functionality.
 */
export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false, // Hide headers for a cleaner app experience
      }}
    >
      {/* Main app screens - add more authenticated screens here as the app grows */}
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}
