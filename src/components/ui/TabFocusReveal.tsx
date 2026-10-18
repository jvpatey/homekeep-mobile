import React, { ReactNode, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { DesignSystem } from "../../theme/designSystem";

interface TabFocusRevealProps {
  children: ReactNode;
}

/**
 * Soft opacity settle when returning to a tab. Skips the first focus so each
 * tab can keep its own cold-start entrance; respects Reduce Motion.
 */
export function TabFocusReveal({ children }: TabFocusRevealProps) {
  const isFocused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  const hasFocusedOnce = useRef(false);

  useEffect(() => {
    if (!isFocused) return;

    if (!hasFocusedOnce.current) {
      hasFocusedOnce.current = true;
      return;
    }

    if (reduceMotion) return;

    opacity.value = 0.88;
    opacity.value = withTiming(1, {
      duration: DesignSystem.motion.duration.fast,
    });
  }, [isFocused, opacity, reduceMotion]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.fill, style]}>{children}</Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
