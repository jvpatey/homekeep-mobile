import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export type KeeperMood = "idle" | "thinking";

/** Resting outward tilt of each arm, in degrees. */
const ARM_TILT = 12;

/** Runs a short sparkle twinkle every few seconds. */
export function useTwinkle(enabled = true, periodMs = 4200) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!enabled || reduceMotion) {
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withDelay(
          periodMs,
          withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }),
        ),
        withTiming(0, { duration: 420, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
    );
  }, [enabled, reduceMotion, periodMs, pulse]);

  return useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + pulse.value * 0.35 },
      { rotate: `${pulse.value * 25}deg` },
    ],
    opacity: 0.85 + pulse.value * 0.15,
  }));
}

/**
 * Keeper, HomeKeep's AI: the three-bar house mark come to life. The copper
 * bar is a domed head with eyes; the sage and ink bars are arms. Blinks and
 * glances when idle, works its arms while thinking, and waves on `greet`.
 */
export function KeeperMark({
  size = 28,
  mood = "idle",
  greet = false,
  badge = true,
  round = false,
}: {
  size?: number;
  mood?: KeeperMood;
  /** Wave once on mount (hero placements). */
  greet?: boolean;
  /** Sparkle badge marking Keeper as AI. */
  badge?: boolean;
  /** Circular plate instead of the rounded square. */
  round?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const reduceMotion = useReducedMotion();
  const sparkleStyle = useTwinkle(badge && (greet || mood === "thinking"));

  const blink = useSharedValue(0);
  const glance = useSharedValue(0);
  const think = useSharedValue(0);
  const leftArm = useSharedValue(0);
  const rightArm = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    blink.value = withRepeat(
      withSequence(
        withDelay(2600, withTiming(1, { duration: 80 })),
        withTiming(0, { duration: 120 }),
        withDelay(3400, withTiming(1, { duration: 80 })),
        withTiming(0, { duration: 120 }),
        withDelay(140, withTiming(1, { duration: 70 })),
        withTiming(0, { duration: 110 }),
      ),
      -1,
    );
    return () => cancelAnimation(blink);
  }, [reduceMotion, blink]);

  useEffect(() => {
    cancelAnimation(glance);
    cancelAnimation(leftArm);
    cancelAnimation(rightArm);
    if (reduceMotion) {
      think.value = mood === "thinking" ? 1 : 0;
      return;
    }
    think.value = withTiming(mood === "thinking" ? 1 : 0, { duration: 240 });

    if (mood === "thinking") {
      glance.value = withTiming(0, { duration: 200 });
      const bob = (delay: number) =>
        withDelay(
          delay,
          withRepeat(
            withSequence(
              withTiming(1, { duration: 280, easing: Easing.out(Easing.quad) }),
              withTiming(0, { duration: 280, easing: Easing.in(Easing.quad) }),
            ),
            -1,
          ),
        );
      leftArm.value = bob(0);
      rightArm.value = bob(280);
      return;
    }

    leftArm.value = withTiming(0, { duration: 200 });
    rightArm.value = greet
      ? withDelay(
          350,
          withSequence(
            withTiming(1.4, { duration: 160 }),
            withTiming(0.2, { duration: 160 }),
            withTiming(1.4, { duration: 160 }),
            withTiming(0, { duration: 220 }),
          ),
        )
      : withTiming(0, { duration: 200 });
    glance.value = withRepeat(
      withSequence(
        withDelay(4200, withTiming(1, { duration: 220 })),
        withDelay(900, withTiming(-1, { duration: 300 })),
        withDelay(700, withTiming(0, { duration: 220 })),
      ),
      -1,
    );
  }, [mood, greet, reduceMotion, glance, think, leftArm, rightArm]);

  const figureHeight = size * 0.6;
  const headWidth = size * 0.27;
  const armWidth = size * 0.17;
  const gap = size * 0.035;
  const eye = Math.max(2, headWidth * 0.2);
  const shoulder = figureHeight * 0.36;

  const eyesStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          glance.value * headWidth * 0.12 + think.value * headWidth * 0.1,
      },
      { translateY: -think.value * headWidth * 0.1 },
      { scaleY: 1 - blink.value * 0.85 },
    ],
  }));
  // Arms hang from the shoulder, tilted slightly outward; motion swings them
  // further out (a full wave at ~1.4).
  const leftArmStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ARM_TILT + leftArm.value * 22}deg` }],
  }));
  const rightArmStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-(ARM_TILT + rightArm.value * 80)}deg` }],
  }));

  const badgeSize = Math.max(12, Math.round(size * 0.42));

  return (
    <View style={{ width: size, height: size }}>
      <LinearGradient
        colors={[
          colors.primary + (isDark ? "40" : "26"),
          colors.secondary + (isDark ? "33" : "1F"),
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.plate,
          {
            width: size,
            height: size,
            borderRadius: round ? size / 2 : size * 0.32,
            borderColor: colors.primary + "40",
            // A circle narrows near the bottom; lift the figure to stay inside it.
            paddingBottom: size * (round ? 0.2 : 0.16),
          },
        ]}
      >
        <View style={[styles.figure, { gap, height: figureHeight }]}>
          <Animated.View
            style={[
              styles.arm,
              {
                width: armWidth,
                height: figureHeight * 0.5,
                marginTop: shoulder,
                borderRadius: armWidth / 2,
                backgroundColor: colors.secondary,
              },
              leftArmStyle,
            ]}
          />
          <View
            style={{
              width: headWidth,
              height: figureHeight,
              borderTopLeftRadius: headWidth / 2,
              borderTopRightRadius: headWidth / 2,
              borderBottomLeftRadius: headWidth * 0.25,
              borderBottomRightRadius: headWidth * 0.25,
              backgroundColor: colors.primary,
              alignItems: "center",
              paddingTop: headWidth * 0.42,
            }}
          >
            <Animated.View
              style={[styles.eyes, { gap: headWidth * 0.16 }, eyesStyle]}
            >
              <View
                style={[
                  styles.eye,
                  { width: eye, height: eye, borderRadius: eye / 2 },
                ]}
              />
              <View
                style={[
                  styles.eye,
                  { width: eye, height: eye, borderRadius: eye / 2 },
                ]}
              />
            </Animated.View>
            {size >= 44 ? (
              <View
                style={[
                  styles.smile,
                  {
                    width: headWidth * 0.36,
                    height: headWidth * 0.18,
                    borderBottomLeftRadius: headWidth * 0.18,
                    borderBottomRightRadius: headWidth * 0.18,
                    borderWidth: Math.max(1.25, size * 0.025),
                    marginTop: headWidth * 0.1,
                  },
                ]}
              />
            ) : null}
          </View>
          <Animated.View
            style={[
              styles.arm,
              {
                width: armWidth,
                height: figureHeight * 0.42,
                marginTop: shoulder,
                borderRadius: armWidth / 2,
                backgroundColor: colors.text,
              },
              rightArmStyle,
            ]}
          />
        </View>
      </LinearGradient>
      {badge ? (
        <Animated.View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              right: -badgeSize * 0.3,
              top: -badgeSize * 0.3,
              backgroundColor: colors.primary,
              borderColor: colors.surface,
            },
            sparkleStyle,
          ]}
        >
          <Ionicons name="sparkles" size={badgeSize * 0.62} color="#FFFFFF" />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    alignItems: "center",
    justifyContent: "flex-end",
    borderWidth: StyleSheet.hairlineWidth,
  },
  figure: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  arm: {
    alignSelf: "flex-start",
    transformOrigin: "top",
  },
  eyes: {
    flexDirection: "row",
  },
  eye: {
    backgroundColor: "#FFFFFF",
  },
  badge: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  smile: {
    borderColor: "#FFFFFF",
    borderTopWidth: 0,
    borderTopColor: "transparent",
  },
});
