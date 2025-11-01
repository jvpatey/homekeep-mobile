import React from "react";
import { View, Text } from "react-native";
import Animated from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { useTextAnimation, useDevice } from "../../../hooks";
import { styles } from "./styles";

// WelcomeText component for the WelcomeText on the onboarding screen
export function WelcomeText() {
  const { colors } = useTheme();
  const { headlineAnimatedStyle, subtitleAnimatedStyle } = useTextAnimation();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  
  const fontMultiplier = getFontMultiplier();

  return (
    <View style={[
      styles.textContainer,
      isTablet && { maxWidth: getResponsiveValue(280, 480, 620) }, // Wider for iPad Pro 13-inch to prevent wrapping
    ]}>
      <Animated.Text
        style={[
          styles.headline,
          { color: colors.text },
          headlineAnimatedStyle,
          isTablet && {
            fontSize: styles.headline.fontSize * fontMultiplier,
            lineHeight: styles.headline.lineHeight * fontMultiplier,
          },
        ]}
      >
        Never miss home maintenance again.
      </Animated.Text>
      <Animated.Text
        style={[
          styles.subtitle,
          { color: colors.textSecondary },
          subtitleAnimatedStyle,
          isTablet && {
            fontSize: styles.subtitle.fontSize * fontMultiplier,
            lineHeight: styles.subtitle.lineHeight * fontMultiplier,
          },
        ]}
      >
        Track, schedule, and complete home maintenance.
      </Animated.Text>
    </View>
  );
}
