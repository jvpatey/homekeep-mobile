import React from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../context/ThemeContext";
import { AuthStackParamList } from "../../../navigation/types";
import {
  useButtonAnimation,
  useGradients,
  useHaptics,
  useScalePress,
} from "../../../hooks";
import { styles } from "./styles";

type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

/**
 * ActionButtons — 2026 redesign.
 *
 * The primary CTA was a 3-stop teal/blue/orange rainbow. iOS 26 design
 * favors a solid brand color with a single subtle specular highlight on
 * the top edge to suggest a glass gleam. Press affordance is a scale
 * spring (useScalePress) instead of activeOpacity.
 */
export function ActionButtons() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<AuthNavigationProp>();
  const { entering } = useButtonAnimation();
  const { ctaHighlight } = useGradients();
  const { triggerMedium, triggerLight } = useHaptics();
  const {
    animatedStyle: ctaAnimatedStyle,
    onPressIn,
    onPressOut,
  } = useScalePress();

  const handleGetStarted = () => {
    triggerMedium();
    navigation.navigate("SignUp");
  };

  const handleEmailAuth = () => {
    triggerLight();
    navigation.navigate("Login");
  };

  return (
    <Animated.View style={styles.buttonContainer} entering={entering}>
      {/* Primary Get Started Button */}
      <Pressable
        onPress={handleGetStarted}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Animated.View
          style={[
            styles.primaryButton,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.12)"
                : "rgba(255, 255, 255, 0.22)",
            },
            ctaAnimatedStyle,
          ]}
        >
          {/* Single specular highlight on the top edge — the only gradient
              left on this screen. */}
          <LinearGradient
            colors={ctaHighlight}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.primaryButtonHighlight}
            pointerEvents="none"
          />
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </Animated.View>
      </Pressable>

      {/* Email Auth Link */}
      <Pressable onPress={handleEmailAuth} style={styles.emailLink}>
        <Text
          style={[styles.emailLinkText, { color: colors.textSecondary }]}
        >
          Continue with Email
        </Text>
      </Pressable>
    </Animated.View>
  );
}
