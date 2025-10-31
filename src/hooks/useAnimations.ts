import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { useEffect } from "react";

// useSimpleAnimation hook for the useSimpleAnimation on the home screen
export function useSimpleAnimation(
  delay: number = 0,
  duration: number = 400,
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

// useLogoAnimation hook for modern logo entrance with scale and rotation
export function useLogoAnimation(delay: number = 0) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const rotate = useSharedValue(-5);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withSpring(1, {
        damping: 15,
        stiffness: 180,
      })
    );
    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 15,
        stiffness: 180,
      })
    );
    rotate.value = withDelay(
      delay,
      withSpring(0, {
        damping: 15,
        stiffness: 180,
      })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return animatedStyle;
}

// useTextAnimation hook for the useTextAnimation on the home screen
export function useTextAnimation() {
  const headlineOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const headlineTranslateY = useSharedValue(15);
  const subtitleTranslateY = useSharedValue(15);
  const headlineScale = useSharedValue(0.95);
  const subtitleScale = useSharedValue(0.95);

  useEffect(() => {
    headlineOpacity.value = withDelay(
      200,
      withSpring(1, { damping: 15, stiffness: 180 })
    );
    headlineTranslateY.value = withDelay(
      200,
      withSpring(0, { damping: 15, stiffness: 180 })
    );
    headlineScale.value = withDelay(
      200,
      withSpring(1, { damping: 15, stiffness: 180 })
    );

    subtitleOpacity.value = withDelay(
      300,
      withSpring(1, { damping: 15, stiffness: 180 })
    );
    subtitleTranslateY.value = withDelay(
      300,
      withSpring(0, { damping: 15, stiffness: 180 })
    );
    subtitleScale.value = withDelay(
      300,
      withSpring(1, { damping: 15, stiffness: 180 })
    );
  }, []);

  const headlineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headlineOpacity.value,
    transform: [
      { translateY: headlineTranslateY.value },
      { scale: headlineScale.value },
    ],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [
      { translateY: subtitleTranslateY.value },
      { scale: subtitleScale.value },
    ],
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
  const scales = Array.from({ length: count }, () => useSharedValue(0.95));

  useEffect(() => {
    opacities.forEach((opacity, index) => {
      const delay = baseDelay + index * 100;
      opacity.value = withDelay(
        delay,
        withSpring(1, { damping: 18, stiffness: 180 })
      );
    });

    translateYs.forEach((translateY, index) => {
      const delay = baseDelay + index * 100;
      translateY.value = withDelay(
        delay,
        withSpring(0, { damping: 18, stiffness: 180 })
      );
    });

    scales.forEach((scale, index) => {
      const delay = baseDelay + index * 100;
      scale.value = withDelay(
        delay,
        withSpring(1, { damping: 18, stiffness: 180 })
      );
    });
  }, [count, baseDelay]);

  const animatedStyles = opacities.map((opacity, index) =>
    useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [
        { translateY: translateYs[index].value },
        { scale: scales[index].value },
      ],
    }))
  );

  return animatedStyles;
}

// useButtonAnimation hook for the useButtonAnimation on the home screen
export function useButtonAnimation(delay: number = 1100) {
  return useSimpleAnimation(delay, 400, 25);
}
