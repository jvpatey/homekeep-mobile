import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { styles } from "./styles";

// Function component for the welcome text section used in the home screen
export function WelcomeText() {
  const { colors } = useTheme();
  const headlineOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const headlineTranslateY = useSharedValue(15);
  const subtitleTranslateY = useSharedValue(15);

  useEffect(() => {
    headlineOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    headlineTranslateY.value = withDelay(200, withTiming(0, { duration: 600 }));

    subtitleOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    subtitleTranslateY.value = withDelay(400, withTiming(0, { duration: 600 }));
  }, []);

  const headlineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headlineOpacity.value,
    transform: [{ translateY: headlineTranslateY.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  return (
    <View style={styles.textContainer}>
      <Animated.Text
        style={[styles.headline, { color: colors.text }, headlineAnimatedStyle]}
      >
        Never miss home maintenance again.
      </Animated.Text>
      <Animated.Text
        style={[
          styles.subtitle,
          { color: colors.textSecondary },
          subtitleAnimatedStyle,
        ]}
      >
        Get organized with smart reminders.
      </Animated.Text>
    </View>
  );
}
