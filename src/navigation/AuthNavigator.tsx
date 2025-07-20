import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/HomeScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { SignUpScreen } from "../screens/auth/SignUpScreen";
import { EmailVerificationScreen } from "../screens/auth/EmailVerificationScreen";
import { CodeVerificationScreen } from "../screens/auth/CodeVerificationScreen";
import { EmailEntryScreen } from "../screens/auth/EmailEntryScreen";
import { AuthStackParamList } from "./types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * AuthNavigator - Navigation stack for authentication flow
 * Handles all screens related to user authentication including:
 * - Home screen (landing page)
 * - Login and signup screens
 * - Email verification and code verification screens
 * - Email entry for password reset
 */
export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false, // Hide headers for a cleaner auth flow
      }}
    >
      {/* Landing page - first screen users see */}
      <Stack.Screen name="Home" component={HomeScreen} />

      {/* Authentication screens */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />

      {/* Email verification flow */}
      <Stack.Screen
        name="EmailVerification"
        component={EmailVerificationScreen}
      />
      <Stack.Screen
        name="CodeVerification"
        component={CodeVerificationScreen}
      />

      {/* Password reset flow */}
      <Stack.Screen name="EmailEntry" component={EmailEntryScreen} />
    </Stack.Navigator>
  );
}
