import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { DesignSystem } from "../../theme/designSystem";
import { KeeperMark, useTwinkle } from "./KeeperMark";

const HEIGHT = 36;
const FACE = 28;
const SHINE_WIDTH = 28;
const EMBER = { light: "#9E4318", dark: "#B2501F" };

/** Header entry point for Keeper: a copper pill with Keeper's face. */
export function AskKeeperButton({ onPress }: { onPress: () => void }) {
  const { colors, isDark } = useTheme();
  const reduceMotion = useReducedMotion();
  const sparkleStyle = useTwinkle(true, 3600);
  const [width, setWidth] = useState(0);
  const shine = useSharedValue(0);
  const press = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion || width === 0) {
      cancelAnimation(shine);
      shine.value = 0;
      return;
    }
    shine.value = withRepeat(
      withSequence(
        withDelay(
          4800,
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        ),
        withTiming(0, { duration: 0 }),
      ),
      -1,
    );
    return () => cancelAnimation(shine);
  }, [reduceMotion, width, shine]);

  const shineStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: -SHINE_WIDTH * 2 + shine.value * (width + SHINE_WIDTH * 3),
      },
      { skewX: "-20deg" },
    ],
    opacity: shine.value > 0 && shine.value < 1 ? 1 : 0,
  }));
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        press.value = withSpring(0.95, { damping: 18, stiffness: 400 });
      }}
      onPressOut={() => {
        press.value = withSpring(1, { damping: 14, stiffness: 300 });
      }}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel="Ask Keeper, your HomeKeep AI"
      accessibilityHint="Ask a question or save something about your home"
    >
      <Animated.View
        style={[
          styles.glow,
          { shadowColor: colors.primary, shadowOpacity: isDark ? 0.5 : 0.35 },
          pressStyle,
        ]}
      >
        <LinearGradient
          colors={[colors.primary, isDark ? EMBER.dark : EMBER.light]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pill}
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        >
          <View style={[styles.face, { backgroundColor: colors.surface }]}>
            <KeeperMark size={FACE} badge={false} />
          </View>
          <Text style={styles.label} maxFontSizeMultiplier={1.2}>
            Ask Keeper
          </Text>
          <Animated.View style={sparkleStyle}>
            <Ionicons name="sparkles" size={13} color="#FFFFFF" />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[styles.shine, shineStyle]}
          />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glow: {
    borderRadius: HEIGHT / 2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 5,
  },
  pill: {
    height: HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: (HEIGHT - FACE) / 2,
    paddingRight: DesignSystem.spacing.md - 2,
    borderRadius: HEIGHT / 2,
    overflow: "hidden",
  },
  face: {
    width: FACE,
    height: FACE,
    borderRadius: FACE / 2,
    overflow: "hidden",
  },
  label: {
    ...DesignSystem.typography.footnote,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.1,
  },
  shine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: SHINE_WIDTH,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
});
