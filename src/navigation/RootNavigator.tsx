import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { AppNavigator } from "./AppNavigator";
import { AuthNavigator } from "./AuthNavigator";
import { RootStackParamList } from "./types";
import { useTheme } from "../context/ThemeContext";

const Stack = createNativeStackNavigator<RootStackParamList>();

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
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // User is authenticated - show main app
          <Stack.Screen name="App" component={AppNavigator} />
        ) : (
          // User is not authenticated - show auth screens
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
