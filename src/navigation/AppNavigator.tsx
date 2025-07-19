import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/HomeScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { SignUpScreen } from "../screens/auth/SignUpScreen";
import { AppStackParamList } from "./types";

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      {/* Add more screens here as your app grows */}
    </Stack.Navigator>
  );
};
