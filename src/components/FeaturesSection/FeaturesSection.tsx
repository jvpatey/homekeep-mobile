import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
export function FeaturesSection() {
  const { colors, isDark } = useTheme();

  const feature1Opacity = useSharedValue(0);
  const feature2Opacity = useSharedValue(0);
  const feature3Opacity = useSharedValue(0);
  const feature1TranslateY = useSharedValue(20);
  const feature2TranslateY = useSharedValue(20);
  const feature3TranslateY = useSharedValue(20);

  useEffect(() => {
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

  const iconGradientColors = (
    isDark
      ? ["rgba(32, 180, 134, 0.15)", "rgba(32, 180, 134, 0.08)"]
      : ["rgba(46, 196, 182, 0.12)", "rgba(46, 196, 182, 0.06)"]
  ) as [string, string];

  return (
    <View style={styles.cardContainer}>
      {/* Feature Highlights */}
      <View style={styles.featuresContainer}>
        <Animated.View style={[styles.featureItem, feature1AnimatedStyle]}>
          <LinearGradient
            colors={iconGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featureIcon}
          >
            <Ionicons name="calendar-outline" size={24} color={colors.accent} />
          </LinearGradient>
          <Text style={[styles.featureText, { color: colors.text }]}>
            Smart Scheduling
          </Text>
        </Animated.View>

        <Animated.View style={[styles.featureItem, feature2AnimatedStyle]}>
          <LinearGradient
            colors={iconGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featureIcon}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.accent}
            />
          </LinearGradient>
          <Text style={[styles.featureText, { color: colors.text }]}>
            Timely Reminders
          </Text>
        </Animated.View>

        <Animated.View style={[styles.featureItem, feature3AnimatedStyle]}>
          <LinearGradient
            colors={iconGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featureIcon}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={24}
              color={colors.accent}
            />
          </LinearGradient>
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
