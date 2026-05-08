import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useEffect } from "react";
import { DesignSystem } from "../../../theme/designSystem";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

// useAuthAnimation hook for the useAuthAnimation on the home screen
export function useAuthAnimation(delay: number = 200, duration: number = 400) {
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(8);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      formOpacity.value = 1;
      formTranslateY.value = 0;
      return;
    }

    formOpacity.value = withDelay(
      delay,
      withTiming(1, {
        duration,
        easing: DesignSystem.motion.easing.standard,
      }),
    );
    formTranslateY.value = withDelay(
      delay,
      withTiming(0, {
        duration,
        easing: DesignSystem.motion.easing.standard,
      }),
    );
  }, [delay, duration, reduced]);

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  return formAnimatedStyle;
}

// useAuthStaggeredAnimation hook for the useAuthStaggeredAnimation on the home screen
export function useAuthStaggeredAnimation() {
  const reduced = useReducedMotion();
  // Animation values for different sections
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(6);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(8);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(6);

  useEffect(() => {
    if (reduced) {
      headerOpacity.value = 1;
      headerTranslateY.value = 0;
      formOpacity.value = 1;
      formTranslateY.value = 0;
      buttonOpacity.value = 1;
      buttonTranslateY.value = 0;
      return;
    }

    // 2026 motion: quick fade + tiny lift, max two stagger groups.
    const d0 = 0;
    const d1 = 120;

    headerOpacity.value = withDelay(
      d0,
      withTiming(1, {
        duration: DesignSystem.motion.duration.fast,
        easing: DesignSystem.motion.easing.standard,
      }),
    );
    headerTranslateY.value = withDelay(
      d0,
      withTiming(0, {
        duration: DesignSystem.motion.duration.base,
        easing: DesignSystem.motion.easing.standard,
      }),
    );

    formOpacity.value = withDelay(
      d1,
      withTiming(1, {
        duration: DesignSystem.motion.duration.fast,
        easing: DesignSystem.motion.easing.standard,
      }),
    );
    formTranslateY.value = withDelay(
      d1,
      withTiming(0, {
        duration: DesignSystem.motion.duration.base,
        easing: DesignSystem.motion.easing.standard,
      }),
    );

    // Buttons follow right after the form group.
    buttonOpacity.value = withDelay(
      d1,
      withTiming(1, {
        duration: DesignSystem.motion.duration.fast,
        easing: DesignSystem.motion.easing.standard,
      }),
    );
    buttonTranslateY.value = withDelay(
      d1,
      withTiming(0, {
        duration: DesignSystem.motion.duration.base,
        easing: DesignSystem.motion.easing.standard,
      }),
    );
  }, [reduced]);

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
