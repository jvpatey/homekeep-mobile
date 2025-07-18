import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { Button } from "react-native-paper";
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

  return (
    <Animated.View style={[styles.buttonContainer, animatedStyle]}>
      <Button
        mode="contained"
        buttonColor={colors.primary}
        textColor={isDark ? colors.text : "white"}
        contentStyle={styles.buttonContent}
        labelStyle={styles.primaryButtonText}
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={handleCreateAccount}
      >
        Create Account
      </Button>

      <Button
        mode="outlined"
        buttonColor="transparent"
        textColor={colors.primary}
        contentStyle={styles.buttonContent}
        labelStyle={styles.secondaryButtonText}
        style={[
          styles.secondaryButton,
          {
            borderColor: isDark
              ? "rgba(32, 180, 134, 0.4)"
              : "rgba(46, 196, 182, 0.3)",
          },
        ]}
        onPress={handleSignIn}
      >
        Sign In
      </Button>

      {/* Footer Text */}
      <Text style={[styles.footerText, { color: colors.textSecondary }]}>
        Free to try • No credit card required
      </Text>
    </Animated.View>
  );
}
