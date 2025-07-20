import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useFeatureAnimation, useGradients } from "../../hooks";
import { styles } from "./styles";
import { ActionButtons } from "../ActionButtons/ActionButtons";

/**
 * FeaturesSection - Displays key app features with animated icons and descriptions
 * Features staggered animations for each feature item and gradient icon backgrounds
 */
export function FeaturesSection() {
  const { colors } = useTheme();
  const { iconGradient } = useGradients();
  const featureAnimatedStyles = useFeatureAnimation(3, 600);

  const features = [
    {
      icon: "calendar-outline",
      text: "Smart Scheduling",
      animatedStyle: featureAnimatedStyles[0],
    },
    {
      icon: "notifications-outline",
      text: "Timely Reminders",
      animatedStyle: featureAnimatedStyles[1],
    },
    {
      icon: "phone-portrait-outline",
      text: "Easy Tracking",
      animatedStyle: featureAnimatedStyles[2],
    },
  ];

  return (
    <View style={styles.cardContainer}>
      {/* Feature Highlights */}
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <Animated.View
            key={index}
            style={[styles.featureItem, feature.animatedStyle]}
          >
            <LinearGradient
              colors={iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featureIcon}
            >
              <Ionicons
                name={feature.icon as any}
                size={24}
                color={colors.accent}
              />
            </LinearGradient>
            <Text style={[styles.featureText, { color: colors.text }]}>
              {feature.text}
            </Text>
          </Animated.View>
        ))}
      </View>

      {/* Action Buttons */}
      <ActionButtons />
    </View>
  );
}
