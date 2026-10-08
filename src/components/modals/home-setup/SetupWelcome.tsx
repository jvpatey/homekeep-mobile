import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  FadeInDown,
  SharedValue,
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
import { useHaptics, useReducedMotion } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";

type IconName = keyof typeof Ionicons.glyphMap;

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const HERO_HEIGHT = 236;
const ORBIT_RX = 124;
const ORBIT_RY = 92;
const BUBBLE = 44;
const PLATE = 104;
const MARK = 58;
const BAR_WIDTH = MARK * 0.22;
const BAR_HEIGHTS = [MARK * 0.55, MARK * 0.85, MARK * 0.42];
const BARS_START = 220;
const ORBIT_START = 640;
const ORBIT_STAGGER = 80;
const ORBIT_REVOLUTION_MS = 60000;

const ORBIT_ICONS: { icon: IconName; tone: "primary" | "secondary" }[] = [
  { icon: "flame", tone: "primary" },
  { icon: "water", tone: "secondary" },
  { icon: "snow", tone: "primary" },
  { icon: "leaf", tone: "secondary" },
  { icon: "flash", tone: "primary" },
  { icon: "shield-checkmark", tone: "secondary" },
];

const SPARKLES = [
  { x: -150, y: -70, size: 5, delay: 900 },
  { x: 146, y: -84, size: 4, delay: 1300 },
  { x: -118, y: 96, size: 4, delay: 1700 },
  { x: 160, y: 62, size: 6, delay: 1100 },
];

const STEPS: { icon: IconName; title: string; detail: string }[] = [
  {
    icon: "location-outline",
    title: "Your address",
    detail: "Local seasons and weather",
  },
  {
    icon: "home-outline",
    title: "Your home",
    detail: "Type, age, and what's there",
  },
  {
    icon: "sparkles-outline",
    title: "Your plan",
    detail: "Tasks scheduled for you",
  },
];

function useLoop(
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

function OrbitBubble({
  index,
  icon,
  color,
  spin,
  reducedMotion,
}: {
  index: number;
  icon: IconName;
  color: string;
  spin: SharedValue<number>;
  reducedMotion: boolean;
}) {
  const { colors } = useTheme();
  const pop = useSharedValue(reducedMotion ? 1 : 0);
  const bob = useLoop(reducedMotion, 1800 + index * 170, ORBIT_START + 400);

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(pop);
      pop.value = 1;
      return;
    }
    pop.value = 0;
    pop.value = withDelay(
      ORBIT_START + index * ORBIT_STAGGER,
      withSpring(1, DesignSystem.motion.spring.bouncy)
    );
  }, [index, pop, reducedMotion]);

  const angle = (-90 + index * (360 / ORBIT_ICONS.length)) * (Math.PI / 180);

  const style = useAnimatedStyle(() => {
    const theta = angle + (spin.value * Math.PI) / 180;
    // Start tucked behind the plate, then spring out onto the ring.
    const reach = interpolate(pop.value, [0, 1], [0.35, 1]);
    return {
      opacity: interpolate(pop.value, [0, 0.4], [0, 1], "clamp"),
      transform: [
        { translateX: Math.cos(theta) * ORBIT_RX * reach },
        {
          translateY:
            Math.sin(theta) * ORBIT_RY * reach +
            interpolate(bob.value, [0, 1], [-4, 4]),
        },
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
      <Ionicons name={icon} size={20} color={color} />
    </Animated.View>
  );
}

function Sparkle({
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

function BuildingMark({ reducedMotion }: { reducedMotion: boolean }) {
  const { colors } = useTheme();
  const barColors = [colors.secondary, colors.primary, colors.text];
  const grow = [
    useSharedValue(reducedMotion ? 1 : 0),
    useSharedValue(reducedMotion ? 1 : 0),
    useSharedValue(reducedMotion ? 1 : 0),
  ];

  useEffect(() => {
    grow.forEach((value, index) => {
      if (reducedMotion) {
        cancelAnimation(value);
        value.value = 1;
        return;
      }
      value.value = 0;
      value.value = withDelay(
        BARS_START + index * 110,
        withSpring(1, DesignSystem.motion.spring.snappy)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values are stable
  }, [reducedMotion]);

  const barStyles = [
    useAnimatedStyle(() => ({ height: BAR_HEIGHTS[0] * grow[0].value })),
    useAnimatedStyle(() => ({ height: BAR_HEIGHTS[1] * grow[1].value })),
    useAnimatedStyle(() => ({ height: BAR_HEIGHTS[2] * grow[2].value })),
  ];

  return (
    <View
      style={styles.mark}
      accessibilityRole="image"
      accessibilityLabel="HomeKeep"
    >
      {barStyles.map((barStyle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            { backgroundColor: barColors[index] },
            barStyle,
          ]}
        />
      ))}
    </View>
  );
}

function WelcomeHero() {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  const reducedMotion = useReducedMotion();

  const plate = useSharedValue(reducedMotion ? 1 : 0);
  const pulse = useLoop(reducedMotion, 2600);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(plate);
      cancelAnimation(spin);
      plate.value = 1;
      spin.value = 0;
      return;
    }
    plate.value = 0;
    plate.value = withSpring(1, DesignSystem.motion.spring.snappy);
    spin.value = withDelay(
      ORBIT_START + ORBIT_ICONS.length * ORBIT_STAGGER,
      withRepeat(
        withTiming(360, {
          duration: ORBIT_REVOLUTION_MS,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
    const haptic = setTimeout(
      triggerLight,
      ORBIT_START + ORBIT_ICONS.length * ORBIT_STAGGER
    );
    return () => {
      clearTimeout(haptic);
      cancelAnimation(spin);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per motion mode
  }, [reducedMotion]);

  const plateStyle = useAnimatedStyle(() => ({
    opacity: interpolate(plate.value, [0, 0.5], [0, 1], "clamp"),
    transform: [{ scale: interpolate(plate.value, [0, 1], [0.7, 1]) }],
  }));
  const innerGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.55, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.92, 1.06]) }],
  }));
  const outerGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.9, 0.35]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.12]) }],
  }));

  return (
    <View style={styles.hero} importantForAccessibility="no-hide-descendants">
      <Animated.View
        style={[
          styles.glow,
          styles.glowOuter,
          { backgroundColor: colors.glassGlow },
          outerGlowStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.glow,
          styles.glowInner,
          { backgroundColor: colors.glassGlow },
          innerGlowStyle,
        ]}
      />
      <View
        style={[
          styles.orbitTrack,
          { borderColor: colors.border },
        ]}
      />

      {SPARKLES.map((sparkle, index) => (
        <Sparkle
          key={index}
          {...sparkle}
          color={index % 2 === 0 ? colors.primary : colors.secondary}
          reducedMotion={reducedMotion}
        />
      ))}

      {ORBIT_ICONS.map((item, index) => (
        <OrbitBubble
          key={item.icon}
          index={index}
          icon={item.icon}
          color={item.tone === "primary" ? colors.primary : colors.secondary}
          spin={spin}
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
        <BuildingMark reducedMotion={reducedMotion} />
      </Animated.View>
    </View>
  );
}

export function SetupWelcome() {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  const enter = (delay: number) =>
    reducedMotion
      ? undefined
      : FadeInDown.delay(delay).duration(460).easing(EASE_OUT);

  return (
    <View style={styles.root}>
      <WelcomeHero />

      <Animated.Text
        entering={enter(520)}
        style={[styles.eyebrow, { color: colors.primary }]}
      >
        Welcome to HomeKeep
      </Animated.Text>
      <Animated.Text
        entering={enter(600)}
        style={[styles.headline, { color: colors.text }]}
        accessibilityRole="header"
        maxFontSizeMultiplier={1.3}
      >
        Let's set up your home
      </Animated.Text>
      <Animated.Text
        entering={enter(680)}
        style={[styles.support, { color: colors.textSecondary }]}
        maxFontSizeMultiplier={1.4}
      >
        A few quick taps and we'll build a maintenance plan made for your
        house.
      </Animated.Text>

      <View style={styles.steps}>
        {STEPS.map((step, index) => (
          <Animated.View
            key={step.title}
            entering={enter(820 + index * 90)}
            style={styles.step}
          >
            <View
              style={[
                styles.stepIcon,
                { backgroundColor: colors.glassGlow },
              ]}
            >
              <Ionicons name={step.icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.stepText}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                {step.title}
              </Text>
              <Text
                style={[styles.stepDetail, { color: colors.textSecondary }]}
              >
                {step.detail}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <Animated.View
        entering={enter(1120)}
        style={[styles.timePill, { borderColor: colors.border }]}
      >
        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
        <Text style={[styles.timeText, { color: colors.textSecondary }]}>
          About 2 minutes · Change anything later
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    paddingBottom: DesignSystem.spacing.lg,
  },
  hero: {
    width: "100%",
    height: HERO_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  glow: {
    position: "absolute",
    borderRadius: DesignSystem.borders.radius.round,
  },
  glowInner: {
    width: 168,
    height: 168,
  },
  glowOuter: {
    width: 232,
    height: 232,
  },
  orbitTrack: {
    position: "absolute",
    width: ORBIT_RX * 2,
    height: ORBIT_RY * 2,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: 1,
    borderStyle: "dashed",
    opacity: 0.7,
  },
  sparkle: {
    position: "absolute",
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
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  mark: {
    height: MARK,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: MARK * 0.06,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: MARK * 0.08,
  },
  eyebrow: {
    ...DesignSystem.typography.captionSemiBold,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: DesignSystem.spacing.xs,
  },
  headline: {
    ...DesignSystem.typography.display,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.sm,
  },
  support: {
    ...DesignSystem.typography.callout,
    textAlign: "center",
    maxWidth: 320,
    marginBottom: DesignSystem.spacing.lg,
  },
  steps: {
    alignSelf: "stretch",
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    ...DesignSystem.typography.bodySemiBold,
  },
  stepDetail: {
    ...DesignSystem.typography.footnote,
  },
  timePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs + 2,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  timeText: {
    ...DesignSystem.typography.footnote,
  },
});
