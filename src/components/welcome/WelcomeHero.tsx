import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import {
  BuildingMark,
  HeroIconName,
  Sparkle,
  useLoop,
  usePop,
} from "../ui/hero/heroKit";

export const WELCOME_HERO_HEIGHT = 200;
/** Widest point of the scene (sparkles). */
export const WELCOME_HERO_WIDTH = 260;

const PLATE = 96;
const MARK = 54;
const RING = 168;
const BUBBLE = 40;
const BARS_START = 160;
const BUBBLES_START = 480;
const BUBBLE_STAGGER = 110;
/** 45° spots on the ring: RING / 2 * cos(45°). */
const DIAGONAL = 59;

const SPARKLES = [
  { x: -122, y: -18, size: 5, delay: 700 },
  { x: 124, y: 16, size: 4, delay: 1100 },
  { x: 10, y: -96, size: 4, delay: 1500 },
  { x: -8, y: 94, size: 6, delay: 900 },
];

/** One bubble per headline feature: the plan, HomeShare, the record, Keeper. */
const BUBBLES: {
  icon: HeroIconName;
  x: number;
  y: number;
  tone: "primary" | "secondary";
}[] = [
  { icon: "calendar", x: -DIAGONAL, y: -DIAGONAL, tone: "primary" },
  { icon: "people", x: DIAGONAL, y: -DIAGONAL, tone: "secondary" },
  { icon: "scan", x: -DIAGONAL, y: DIAGONAL, tone: "secondary" },
  { icon: "sparkles", x: DIAGONAL, y: DIAGONAL, tone: "primary" },
];

function IconBubble({
  icon,
  x,
  y,
  color,
  index,
  reducedMotion,
}: {
  icon: HeroIconName;
  x: number;
  y: number;
  color: string;
  index: number;
  reducedMotion: boolean;
}) {
  const { colors } = useTheme();
  const pop = usePop(reducedMotion, BUBBLES_START + index * BUBBLE_STAGGER);
  const bob = useLoop(reducedMotion, 2200 + index * 260, BUBBLES_START + 600);
  const style = useAnimatedStyle(() => {
    // Start tucked behind the plate, then spring out onto the ring.
    const reach = interpolate(pop.value, [0, 1], [0.35, 1]);
    return {
      opacity: interpolate(pop.value, [0, 0.4], [0, 1], "clamp"),
      transform: [
        { translateX: x * reach },
        { translateY: y * reach + interpolate(bob.value, [0, 1], [-3, 3]) },
        { scale: interpolate(pop.value, [0, 1], [0.4, 1]) },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.bubble,
        DesignSystem.shadows.softKey,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      <Ionicons name={icon} size={18} color={color} />
    </Animated.View>
  );
}

export function WelcomeHero({ scale = 1 }: { scale?: number }) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const plate = usePop(reducedMotion, 0, "snappy");
  const breathe = useLoop(reducedMotion, 2600);
  const tones = { primary: colors.primary, secondary: colors.secondary };

  const plateStyle = useAnimatedStyle(() => ({
    opacity: interpolate(plate.value, [0, 0.5], [0, 1], "clamp"),
    transform: [{ scale: interpolate(plate.value, [0, 1], [0.7, 1]) }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breathe.value, [0, 1], [0.6, 1]),
    transform: [{ scale: interpolate(breathe.value, [0, 1], [0.94, 1.06]) }],
  }));

  return (
    <View
      style={[styles.frame, { height: WELCOME_HERO_HEIGHT * scale }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <View style={[styles.scene, { transform: [{ scale }] }]}>
        <Animated.View
          style={[styles.glow, { backgroundColor: colors.glassGlow }, glowStyle]}
        />
        <View style={[styles.ring, { borderColor: colors.border }]} />

        {SPARKLES.map((sparkle, index) => (
          <Sparkle
            key={index}
            {...sparkle}
            color={index % 2 === 0 ? colors.primary : colors.secondary}
            reducedMotion={reducedMotion}
          />
        ))}

        {BUBBLES.map((bubble, index) => (
          <IconBubble
            key={bubble.icon}
            icon={bubble.icon}
            x={bubble.x}
            y={bubble.y}
            color={tones[bubble.tone]}
            index={index}
            reducedMotion={reducedMotion}
          />
        ))}

        <Animated.View
          style={[
            styles.plate,
            DesignSystem.shadows.glassStrong,
            { backgroundColor: colors.surface, borderColor: colors.border },
            plateStyle,
          ]}
        >
          <BuildingMark
            size={MARK}
            delay={BARS_START}
            reducedMotion={reducedMotion}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.sm,
  },
  scene: {
    width: WELCOME_HERO_WIDTH,
    height: WELCOME_HERO_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    // Peaks at 1.06× in the breathe loop; must stay inside WELCOME_HERO_HEIGHT.
    width: 184,
    height: 184,
    borderRadius: DesignSystem.borders.radius.round,
  },
  ring: {
    position: "absolute",
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 1,
    borderStyle: "dashed",
    opacity: 0.7,
  },
  bubble: {
    position: "absolute",
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  plate: {
    width: PLATE,
    height: PLATE,
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});
