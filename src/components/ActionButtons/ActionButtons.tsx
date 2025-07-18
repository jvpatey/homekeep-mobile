import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Button } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";
import { styles } from "./styles";

// Function component for the action buttons section used in the home screen
export function ActionButtons() {
  const { colors, isDark } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(25);

  useEffect(() => {
    opacity.value = withDelay(1100, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(1100, withTiming(0, { duration: 600 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleCreateAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Handle create account action
  };

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Handle sign in action
  };

  const gradientColors = (
    isDark
      ? [colors.primary, colors.secondary]
      : [colors.primary, colors.secondary]
  ) as [string, string];

  return (
    <Animated.View style={[styles.buttonContainer, animatedStyle]}>
      <TouchableOpacity
        onPress={handleCreateAccount}
        style={styles.primaryButton}
      >
        <LinearGradient
          colors={gradientColors}
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
          colors={gradientColors}
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
