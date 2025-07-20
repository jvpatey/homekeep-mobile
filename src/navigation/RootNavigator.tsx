import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, View } from "react-native";
import * as Linking from "expo-linking";
import { useAuth } from "../context/AuthContext";
import { AppNavigator } from "./AppNavigator";
import { AuthNavigator } from "./AuthNavigator";
import { EmailVerificationScreen } from "../screens/auth/EmailVerificationScreen";
import { RootStackParamList } from "./types";
import { useTheme } from "../context/ThemeContext";

const Stack = createNativeStackNavigator<RootStackParamList>();

// Define linking configuration for deep links
const linking = {
  prefixes: ["homekeep://"],
  config: {
    screens: {
      EmailVerification: {
        path: "auth/verify",
        parse: {
          url: (url: string) => url, // Pass the full URL as parameter
        },
      },
      Auth: "*", // Fallback to auth for any other deep links
    },
  },
  // Handle the incoming URL and extract the full URL with query parameters
  getInitialURL: async () => {
    const url = await Linking.getInitialURL();
    return url;
  },
  subscribe: (listener: (url: string) => void) => {
    const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
      listener(url);
    });

    return () => {
      linkingSubscription?.remove();
    };
  },
};

export const RootNavigator: React.FC = () => {
  const { loading, user } = useAuth();
  const { colors } = useTheme();

  // Show loading screen while checking authentication status
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // User is authenticated - show main app
          <Stack.Screen name="App" component={AppNavigator} />
        ) : (
          // User is not authenticated - show auth screens
          <>
            <Stack.Screen name="Auth" component={AuthNavigator} />
            <Stack.Screen
              name="EmailVerification"
              component={EmailVerificationScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
