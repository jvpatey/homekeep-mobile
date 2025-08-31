import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useEffect } from "react";

// useSimpleAnimation hook for the useSimpleAnimation on the home screen
export function useSimpleAnimation(
  delay: number = 0,
  duration: number = 600,
  translateY: number = 20
) {
  const opacity = useSharedValue(0);
  const translateYValue = useSharedValue(translateY);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration }));
    translateYValue.value = withDelay(delay, withTiming(0, { duration }));
  }, [delay, duration, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateYValue.value }],
  }));

  return animatedStyle;
}

// useTextAnimation hook for the useTextAnimation on the home screen
export function useTextAnimation() {
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

  return {
    headlineAnimatedStyle,
    subtitleAnimatedStyle,
  };
}

// useFeatureAnimation hook for the useFeatureAnimation on the home screen
export function useFeatureAnimation(
  count: number = 3,
  baseDelay: number = 600
) {
  const opacities = Array.from({ length: count }, () => useSharedValue(0));
  const translateYs = Array.from({ length: count }, () => useSharedValue(20));

  useEffect(() => {
    opacities.forEach((opacity, index) => {
      const delay = baseDelay + index * 150;
      opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    });

    translateYs.forEach((translateY, index) => {
      const delay = baseDelay + index * 150;
      translateY.value = withDelay(delay, withTiming(0, { duration: 500 }));
    });
  }, [count, baseDelay]);

  const animatedStyles = opacities.map((opacity, index) =>
    useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: translateYs[index].value }],
    }))
  );

  return animatedStyles;
}

// useButtonAnimation hook for the useButtonAnimation on the home screen
export function useButtonAnimation(delay: number = 1100) {
  return useSimpleAnimation(delay, 600, 25);
}
