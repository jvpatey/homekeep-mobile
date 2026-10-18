import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
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
import { useDevice, useHaptics, useReducedMotion } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import {
  BuildingMark,
  HeroIconName as IconName,
  Sparkle,
  useEnter,
  useLoop,
  usePop,
} from "../../ui/hero/heroKit";

const HERO_HEIGHT = 236;
const ORBIT_RX = 124;
const ORBIT_RY = 92;
const BUBBLE = 44;
const PLATE = 104;
const MARK = 58;
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
  const pop = usePop(reducedMotion, ORBIT_START + index * ORBIT_STAGGER);
  const bob = useLoop(reducedMotion, 1800 + index * 170, ORBIT_START + 400);

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
        <BuildingMark
          size={MARK}
          delay={BARS_START}
          reducedMotion={reducedMotion}
        />
      </Animated.View>
    </View>
  );
}

export function SetupWelcome() {
  const { colors } = useTheme();
  const { isRegularWidth } = useDevice();
  const enter = useEnter();

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
        style={[
          styles.support,
          isRegularWidth && styles.supportWide,
          { color: colors.textSecondary },
        ]}
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
  supportWide: {
    maxWidth: 480,
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
