import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { styles } from "./styles";
import { ActionButtons } from "../ActionButtons/ActionButtons";

// Function component for the features section used in the home screen
export function FeatureCard() {
  const { colors, isDark } = useTheme();

  // Animation values for each feature
  const feature1Opacity = useSharedValue(0);
  const feature2Opacity = useSharedValue(0);
  const feature3Opacity = useSharedValue(0);
  const feature1TranslateY = useSharedValue(20);
  const feature2TranslateY = useSharedValue(20);
  const feature3TranslateY = useSharedValue(20);

  useEffect(() => {
    // Staggered animations for features
    feature1Opacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    feature1TranslateY.value = withDelay(600, withTiming(0, { duration: 500 }));

    feature2Opacity.value = withDelay(750, withTiming(1, { duration: 500 }));
    feature2TranslateY.value = withDelay(750, withTiming(0, { duration: 500 }));

    feature3Opacity.value = withDelay(900, withTiming(1, { duration: 500 }));
    feature3TranslateY.value = withDelay(900, withTiming(0, { duration: 500 }));
  }, []);

  const feature1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: feature1Opacity.value,
    transform: [{ translateY: feature1TranslateY.value }],
  }));

  const feature2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: feature2Opacity.value,
    transform: [{ translateY: feature2TranslateY.value }],
  }));

  const feature3AnimatedStyle = useAnimatedStyle(() => ({
    opacity: feature3Opacity.value,
    transform: [{ translateY: feature3TranslateY.value }],
  }));

  return (
    <View style={styles.cardContainer}>
      {/* Feature Highlights */}
      <View style={styles.featuresContainer}>
        <Animated.View style={[styles.featureItem, feature1AnimatedStyle]}>
          <View
            style={[
              styles.featureIcon,
              {
                backgroundColor: isDark
                  ? "rgba(32, 180, 134, 0.12)"
                  : "rgba(46, 196, 182, 0.08)",
              },
            ]}
          >
            <Ionicons name="calendar-outline" size={24} color={colors.accent} />
          </View>
          <Text style={[styles.featureText, { color: colors.text }]}>
            Smart Scheduling
          </Text>
        </Animated.View>

        <Animated.View style={[styles.featureItem, feature2AnimatedStyle]}>
          <View
            style={[
              styles.featureIcon,
              {
                backgroundColor: isDark
                  ? "rgba(32, 180, 134, 0.12)"
                  : "rgba(46, 196, 182, 0.08)",
              },
            ]}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.accent}
            />
          </View>
          <Text style={[styles.featureText, { color: colors.text }]}>
            Timely Reminders
          </Text>
        </Animated.View>

        <Animated.View style={[styles.featureItem, feature3AnimatedStyle]}>
          <View
            style={[
              styles.featureIcon,
              {
                backgroundColor: isDark
                  ? "rgba(32, 180, 134, 0.12)"
                  : "rgba(46, 196, 182, 0.08)",
              },
            ]}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={24}
              color={colors.accent}
            />
          </View>
          <Text style={[styles.featureText, { color: colors.text }]}>
            Easy Tracking
          </Text>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <ActionButtons />
    </View>
  );
}
