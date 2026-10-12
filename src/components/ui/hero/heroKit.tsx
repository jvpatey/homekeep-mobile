import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  FadeInDown,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { useReducedMotion } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";

export type HeroIconName = keyof typeof Ionicons.glyphMap;

export const HERO_EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

/** Endless 0→1 loop; ping-pongs with a sine ease unless `reverse` is false. */
export function useLoop(
  reducedMotion: boolean,
  duration: number,
  delay = 0,
  reverse = true
) {
  const value = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(value);
      value.value = 0;
      return;
    }
    value.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration,
          easing: reverse ? Easing.inOut(Easing.sin) : Easing.linear,
        }),
        -1,
        reverse
      )
    );
    return () => cancelAnimation(value);
  }, [reducedMotion, duration, delay, reverse, value]);
  return value;
}

/** One-shot 0→1 spring after `delay`; starts at 1 when motion is reduced. */
export function usePop(
  reducedMotion: boolean,
  delay: number,
  spring: keyof typeof DesignSystem.motion.spring = "bouncy"
) {
  const value = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(value);
      value.value = 1;
      return;
    }
    value.value = 0;
    value.value = withDelay(
      delay,
      withSpring(1, DesignSystem.motion.spring[spring])
    );
  }, [delay, reducedMotion, spring, value]);
  return value;
}

/** Staggered fade-up for copy under a hero; undefined when motion is reduced. */
export function useEnter() {
  const reducedMotion = useReducedMotion();
  return (delay: number) =>
    reducedMotion
      ? undefined
      : FadeInDown.delay(delay).duration(460).easing(HERO_EASE_OUT);
}

export function Sparkle({
  x,
  y,
  size,
  delay,
  color,
  reducedMotion,
}: {
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
  reducedMotion: boolean;
}) {
  const twinkle = useLoop(reducedMotion, 1400, delay);
  const style = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.5 : interpolate(twinkle.value, [0, 1], [0, 0.9]),
    transform: [
      { translateX: x },
      { translateY: y },
      { scale: interpolate(twinkle.value, [0, 1], [0.6, 1.2]) },
    ],
  }));
  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

/** Pill that pops in at (x, y) from the scene's center, then bobs. */
export function FloatingChip({
  label,
  icon = "checkmark-circle",
  x,
  y,
  color,
  popDelay,
  bobDelay,
  bobDuration,
  reducedMotion,
}: {
  label: string;
  icon?: HeroIconName;
  x: number;
  y: number;
  color: string;
  popDelay: number;
  bobDelay: number;
  bobDuration: number;
  reducedMotion: boolean;
}) {
  const { colors } = useTheme();
  const pop = usePop(reducedMotion, popDelay);
  const bob = useLoop(reducedMotion, bobDuration, bobDelay);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pop.value, [0, 0.5], [0, 1], "clamp"),
    transform: [
      { translateX: x },
      {
        translateY:
          y +
          interpolate(pop.value, [0, 1], [10, 0]) +
          interpolate(bob.value, [0, 1], [-2, 2]),
      },
      { scale: interpolate(pop.value, [0, 1], [0.8, 1]) },
    ],
  }));
  return (
    <Animated.View
      style={[
        styles.chip,
        DesignSystem.shadows.softKey,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      <Ionicons name={icon} size={14} color={color} />
      <Text
        style={[styles.chipText, { color: colors.text }]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

/** HouseMark whose three bars spring up in sequence. */
export function BuildingMark({
  size,
  delay,
  reducedMotion,
}: {
  size: number;
  delay: number;
  reducedMotion: boolean;
}) {
  const { colors } = useTheme();
  const barColors = [colors.secondary, colors.primary, colors.text];
  const barHeights = [size * 0.55, size * 0.85, size * 0.42];
  const grow = [
    usePop(reducedMotion, delay, "snappy"),
    usePop(reducedMotion, delay + 110, "snappy"),
    usePop(reducedMotion, delay + 220, "snappy"),
  ];
  const barStyles = [
    useAnimatedStyle(() => ({ height: barHeights[0] * grow[0].value })),
    useAnimatedStyle(() => ({ height: barHeights[1] * grow[1].value })),
    useAnimatedStyle(() => ({ height: barHeights[2] * grow[2].value })),
  ];

  return (
    <View
      style={[styles.mark, { height: size, gap: size * 0.06 }]}
      accessibilityRole="image"
      accessibilityLabel="HomeKeep"
    >
      {barStyles.map((barStyle, index) => (
        <Animated.View
          key={index}
          style={[
            {
              width: size * 0.22,
              borderRadius: size * 0.08,
              backgroundColor: barColors[index],
            },
            barStyle,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sparkle: {
    position: "absolute",
  },
  chip: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    ...DesignSystem.typography.captionSemiBold,
  },
  mark: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
});
