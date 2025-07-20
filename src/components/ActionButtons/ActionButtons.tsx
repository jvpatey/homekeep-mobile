import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Button } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { AuthStackParamList } from "../../navigation/types";
import { useButtonAnimation, useGradients, useHaptics } from "../../hooks";
import { styles } from "./styles";

type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

/**
 * ActionButtons - Provides main call-to-action buttons for the home screen
 * Features gradient styling, haptic feedback, and entrance animations
 */
export function ActionButtons() {
  const { colors } = useTheme();
  const navigation = useNavigation<AuthNavigationProp>();
  const animatedStyle = useButtonAnimation();
  const { primaryGradient, isDark } = useGradients();
  const { triggerMedium, triggerLight } = useHaptics();

  const handleCreateAccount = () => {
    triggerMedium();
    navigation.navigate("SignUp");
  };

  const handleSignIn = () => {
    triggerLight();
    navigation.navigate("Login");
  };

  return (
    <Animated.View style={[styles.buttonContainer, animatedStyle]}>
      <TouchableOpacity
        onPress={handleCreateAccount}
        style={styles.primaryButton}
      >
        <LinearGradient
          colors={primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          <Text
            style={[
              styles.primaryButtonText,
              { color: isDark ? colors.text : "white" },
            ]}
          >
            Create Account
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleSignIn}
        style={styles.secondaryButtonContainer}
      >
        <LinearGradient
          colors={primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          <View
            style={[
              styles.secondaryButtonInner,
              { backgroundColor: colors.background },
            ]}
          >
            <Text
              style={[styles.secondaryButtonText, { color: colors.primary }]}
            >
              Sign In
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Footer Text */}
      <Text style={[styles.footerText, { color: colors.textSecondary }]}>
        Free to try • No credit card required
      </Text>
    </Animated.View>
  );
}
