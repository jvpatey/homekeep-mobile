import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../context/ThemeContext";
import { AuthStackParamList } from "../../../navigation/types";
import { useButtonAnimation, useGradients, useHaptics } from "../../../hooks";
import { styles } from "./styles";

type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

// ActionButtons component for the ActionButtons on the home screen
export function ActionButtons() {
  const { colors } = useTheme();
  const navigation = useNavigation<AuthNavigationProp>();
  const animatedStyle = useButtonAnimation();
  const { primaryGradient, isDark } = useGradients();
  const { triggerMedium, triggerLight } = useHaptics();

  // handleCreateAccount function to handle the create account button press
  const handleCreateAccount = () => {
    triggerMedium();
    navigation.navigate("SignUp");
  };

  // handleSignIn function to handle the sign in button press
  const handleSignIn = () => {
    triggerLight();
    navigation.navigate("Login");
  };

  return (
    <Animated.View style={[styles.buttonContainer, animatedStyle]}>
      <TouchableOpacity
        onPress={handleCreateAccount}
        style={[
          styles.primaryButton,
          {
            backgroundColor: colors.primary,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 6,
          },
        ]}
      >
        <Text style={[styles.primaryButtonText, { color: "white" }]}>
          Create Account
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleSignIn}
        style={[
          styles.secondaryButton,
          {
            backgroundColor: colors.surface,
            borderWidth: 2,
            borderColor: colors.primary,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 3,
          },
        ]}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
          Sign In
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
