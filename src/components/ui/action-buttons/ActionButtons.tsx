import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { AuthStackParamList } from "../../../navigation/types";
import { useButtonAnimation, useGradients, useHaptics } from "../../../hooks";
import { styles } from "./styles";
import { DesignSystem } from "../../../theme/designSystem";

type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

// ActionButtons component for the ActionButtons on the home screen
export function ActionButtons() {
  const { colors } = useTheme();
  const navigation = useNavigation<AuthNavigationProp>();
  const animatedStyle = useButtonAnimation();
  const { primaryGradient, accentGradient, isDark } = useGradients();
  const { triggerMedium, triggerLight } = useHaptics();

  // handleGetStarted function to handle the get started button press
  const handleGetStarted = () => {
    triggerMedium();
    // Navigate to smart auth flow (will auto-detect signup vs login)
    navigation.navigate("SignUp");
  };

  // handleEmailAuth function to handle the email auth link
  const handleEmailAuth = () => {
    triggerLight();
    navigation.navigate("Login");
  };

  return (
    <Animated.View style={[styles.buttonContainer, animatedStyle]}>
      {/* Primary Get Started Button */}
      <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.8}>
        <LinearGradient
          colors={[
            isDark ? "rgba(32, 180, 134, 0.70)" : "rgba(46, 196, 182, 0.75)",
            isDark ? "rgba(58, 134, 255, 0.65)" : "rgba(58, 134, 255, 0.70)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.primaryButton,
            {
              shadowColor: isDark
                ? "rgba(32, 180, 134, 0.25)"
                : "rgba(46, 196, 182, 0.30)",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 5,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(255, 255, 255, 0.2)",
            },
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: "white" }]}>
            Get Started
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Email Auth Link */}
      <TouchableOpacity
        onPress={handleEmailAuth}
        activeOpacity={0.7}
        style={styles.emailLink}
      >
        <Text style={[styles.emailLinkText, { color: colors.textSecondary }]}>
          Continue with Email
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
