import React from "react";
import { View, Text } from "react-native";
import Animated from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { useTextAnimation } from "../../../hooks";
import { styles } from "./styles";

// WelcomeText component for the WelcomeText on the onboarding screen
export function WelcomeText() {
  const { colors } = useTheme();
  const { headlineAnimatedStyle, subtitleAnimatedStyle } = useTextAnimation();

  return (
    <View style={styles.textContainer}>
      <Animated.Text
        style={[
          styles.headline,
          { color: colors.surface },
          headlineAnimatedStyle,
        ]}
      >
        Never miss home maintenance again.
      </Animated.Text>
      <Animated.Text
        style={[
          styles.subtitle,
          { color: colors.surface, opacity: 0.9 },
          subtitleAnimatedStyle,
        ]}
      >
        Get organized with smart reminders.
      </Animated.Text>
    </View>
  );
}
