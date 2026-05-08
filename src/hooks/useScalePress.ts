import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { DesignSystem } from "../theme/designSystem";

/**
 * 2026 press affordance. Replaces `activeOpacity` on touchables with a
 * physical "nudge" — scale 1 → 0.97 with a snappy spring on press-in,
 * springing back on press-out. Pairs with haptics for the iOS 26 feel.
 *
 * Usage:
 *   const { animatedStyle, onPressIn, onPressOut } = useScalePress();
 *   <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
 *     <Animated.View style={animatedStyle}>...</Animated.View>
 *   </Pressable>
 */
export function useScalePress(pressedScale: number = 0.97) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(pressedScale, DesignSystem.motion.spring.snappy);
  };

  const onPressOut = () => {
    scale.value = withSpring(1, DesignSystem.motion.spring.snappy);
  };

  return { animatedStyle, onPressIn, onPressOut };
}
