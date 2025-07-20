import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useEffect } from "react";

/**
 * Custom hook for form animation used across auth screens
 * Provides consistent entrance animations for forms and content
 */
export function useAuthAnimation(delay: number = 200, duration: number = 600) {
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);

  useEffect(() => {
    formOpacity.value = withDelay(delay, withTiming(1, { duration }));
    formTranslateY.value = withDelay(delay, withTiming(0, { duration }));
  }, [delay, duration]);

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  return formAnimatedStyle;
}

/**
 * Custom hook for complex staggered animations used in auth screens
 * Provides animations for header, form, and button sections with staggered timing
 */
export function useAuthStaggeredAnimation() {
  // Animation values for different sections
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(20);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);

  useEffect(() => {
    // Staggered animations for smooth entrance
    headerOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    headerTranslateY.value = withDelay(200, withTiming(0, { duration: 600 }));

    formOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    formTranslateY.value = withDelay(400, withTiming(0, { duration: 600 }));

    buttonOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    buttonTranslateY.value = withDelay(600, withTiming(0, { duration: 600 }));
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  return {
    headerAnimatedStyle,
    formAnimatedStyle,
    buttonAnimatedStyle,
  };
}
