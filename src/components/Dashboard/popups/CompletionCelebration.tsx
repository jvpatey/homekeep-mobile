import React, { useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { DesignSystem } from "../../../theme/designSystem";
import { useTheme } from "../../../context/ThemeContext";
import { useDevice, useGradients, useHaptics, useReducedMotion } from "../../../hooks";
import { Button } from "../../ui/Button";
import { Ionicons } from "@expo/vector-icons";
import {
  HOME_MAINTENANCE_CATEGORIES,
  CategoryKey,
  MaintenanceCategory,
} from "../../../types/maintenance";
import { hexWithAlpha } from "./popupChrome";

export type CompletionCelebrationSnapshot = {
  title: string;
  category: MaintenanceCategory;
  estimated_duration_minutes?: number;
  wasOverdue: boolean;
  remainingOverdue: number;
  remainingToday: number;
  nextTitle?: string;
};

interface CompletionCelebrationProps {
  isVisible: boolean;
  onClose: () => void;
  snapshot?: CompletionCelebrationSnapshot | null;
}

/**
 * Precomputed burst vectors. Larger travel + longer life reads as
 * celebratory without a full-screen particle shower.
 */
const CONFETTI = [
  { x: -118, y: -72, spin: -150, delay: 40, w: 11, h: 16 },
  { x: 110, y: -86, spin: 130, delay: 70, w: 10, h: 14 },
  { x: -78, y: -108, spin: 95, delay: 95, w: 9, h: 13 },
  { x: 88, y: -58, spin: -110, delay: 55, w: 13, h: 8 },
  { x: -132, y: 8, spin: 165, delay: 110, w: 10, h: 15 },
  { x: 126, y: -4, spin: -140, delay: 125, w: 9, h: 16 },
  { x: -48, y: -120, spin: -70, delay: 80, w: 12, h: 8 },
  { x: 36, y: -114, spin: 180, delay: 100, w: 9, h: 12 },
  { x: -98, y: 48, spin: 50, delay: 140, w: 11, h: 9 },
  { x: 104, y: 54, spin: -60, delay: 155, w: 10, h: 14 },
  { x: -20, y: -96, spin: 40, delay: 60, w: 8, h: 12 },
  { x: 16, y: 70, spin: -90, delay: 170, w: 9, h: 9 },
];

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN_OUT = Easing.bezier(0.4, 0, 0.2, 1);
const CONFETTI_MS = 1600;
const AUTO_DISMISS_MS = 5200;

function headlineFor(snapshot?: CompletionCelebrationSnapshot | null): string {
  if (!snapshot) return "Task completed!";
  if (snapshot.wasOverdue && snapshot.remainingOverdue === 0) {
    return "Overdue list is clear";
  }
  if (snapshot.wasOverdue) return "Caught up";
  if (snapshot.remainingToday === 0) return "Today’s list is done";
  return "Nice work";
}

function insightFor(
  snapshot?: CompletionCelebrationSnapshot | null
): string | null {
  if (!snapshot) return null;
  if (snapshot.wasOverdue && snapshot.remainingOverdue === 0) {
    return "Nothing late on the schedule.";
  }
  if (snapshot.remainingOverdue > 0) {
    return snapshot.remainingOverdue === 1
      ? "1 task still overdue"
      : `${snapshot.remainingOverdue} still overdue`;
  }
  if (snapshot.nextTitle) return `Next: ${snapshot.nextTitle}`;
  if (snapshot.remainingToday > 0) {
    return snapshot.remainingToday === 1
      ? "1 still due today"
      : `${snapshot.remainingToday} still due today`;
  }
  return "You’re clear for now.";
}

function BurstRing({
  delay,
  size,
  color,
  reduced,
}: {
  delay: number;
  size: number;
  color: string;
  reduced: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    if (reduced) return;
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 1100, easing: EASE_OUT })
    );
  }, [delay, progress, reduced]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.12, 1], [0, 0.35, 0]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.55, 2.15]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.burstRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

function ConfettiPiece({
  x,
  y,
  spin,
  delay,
  w,
  h,
  color,
  reduced,
}: {
  x: number;
  y: number;
  spin: number;
  delay: number;
  w: number;
  h: number;
  color: string;
  reduced: boolean;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(t);
    t.value = 0;
    if (reduced) return;
    t.value = withDelay(
      delay,
      withTiming(1, { duration: CONFETTI_MS, easing: EASE_OUT })
    );
  }, [delay, reduced, t]);

  const style = useAnimatedStyle(() => {
    const p = t.value;
    return {
      opacity: interpolate(p, [0, 0.08, 0.72, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: x * p },
        // Lift first, then gravity — continuous, no second timeline.
        { translateY: y * p + 90 * p * p },
        { rotate: `${spin * p}deg` },
        { scale: interpolate(p, [0, 0.1, 1], [0.4, 1, 0.9]) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.confetti,
        {
          width: w,
          height: h,
          borderRadius: 2.5,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function CompletionCelebration({
  isVisible,
  onClose,
  snapshot,
}: CompletionCelebrationProps) {
  const { colors } = useTheme();
  const { authAtmosphere } = useGradients();
  const { isTablet } = useDevice();
  const reducedMotion = useReducedMotion();
  const { triggerSuccess } = useHaptics();
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const overlayOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(28);
  const iconProgress = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  const category =
    HOME_MAINTENANCE_CATEGORIES[
      (snapshot?.category ?? "GENERAL") as CategoryKey
    ] ?? HOME_MAINTENANCE_CATEGORIES.GENERAL;
  const headline = headlineFor(snapshot);
  const insight = insightFor(snapshot);

  const confettiColors = [
    colors.primary,
    colors.warning,
    hexWithAlpha(colors.primary, 0.8),
    colors.textSecondary,
  ];

  const finishClose = useCallback(() => {
    closingRef.current = false;
    onCloseRef.current();
  }, []);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    cancelAnimation(overlayOpacity);
    cancelAnimation(cardOpacity);
    cancelAnimation(cardTranslateY);
    cancelAnimation(iconProgress);
    cancelAnimation(contentOpacity);

    const exit = {
      duration: DesignSystem.motion.duration.fast,
      easing: DesignSystem.motion.easing.standard,
    };

    contentOpacity.value = withTiming(0, exit);
    iconProgress.value = withTiming(0.92, exit);
    cardTranslateY.value = withTiming(16, exit);
    cardOpacity.value = withTiming(0, exit);
    overlayOpacity.value = withTiming(0, exit, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  }, [
    cardOpacity,
    cardTranslateY,
    contentOpacity,
    finishClose,
    iconProgress,
    overlayOpacity,
  ]);

  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  useEffect(() => {
    if (!isVisible) {
      closingRef.current = false;
      overlayOpacity.value = 0;
      cardOpacity.value = 0;
      cardTranslateY.value = 28;
      iconProgress.value = 0;
      contentOpacity.value = 0;
      return;
    }

    closingRef.current = false;
    triggerSuccess();

    const enter = {
      duration: reducedMotion ? 0 : 360,
      easing: EASE_OUT,
    };

    overlayOpacity.value = withTiming(1, enter);
    cardOpacity.value = withTiming(1, enter);
    cardTranslateY.value = withTiming(0, enter);

    // One curve only — no spring sequence (that was the checkmark glitch).
    iconProgress.value = reducedMotion
      ? withTiming(1, { duration: 0 })
      : withDelay(80, withTiming(1, { duration: 520, easing: EASE_OUT }));

    contentOpacity.value = withDelay(
      reducedMotion ? 0 : 220,
      withTiming(1, {
        duration: reducedMotion ? 0 : 320,
        easing: EASE_IN_OUT,
      })
    );

    const timer = setTimeout(() => {
      handleCloseRef.current();
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
    // Open once per visibility flip — do not depend on unstable callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, reducedMotion]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  // Opacity + scale from one progress value — never nests with a card scale.
  const iconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(iconProgress.value, [0, 0.2, 1], [0, 1, 1]),
    transform: [
      {
        scale: interpolate(iconProgress.value, [0, 1], [0.72, 1]),
      },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(iconProgress.value, [0, 0.35, 1], [0, 0.9, 1]),
    transform: [
      {
        scale: interpolate(iconProgress.value, [0, 1], [0.85, 1]),
      },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  if (!isVisible) return null;

  const iconSize = isTablet ? 72 : 58;
  const haloSize = isTablet ? 128 : 104;
  const ringSize = isTablet ? 104 : 88;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlayContainer} pointerEvents="box-none">
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Dismiss celebration"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            cardStyle,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              maxWidth: isTablet ? 450 : 350,
            },
            DesignSystem.shadows.softKey,
          ]}
        >
          {/* Clip only the fill — confetti lives above and can overflow freely. */}
          <View style={styles.cardClip} pointerEvents="none">
            <LinearGradient
              colors={authAtmosphere}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.35 }}
              style={StyleSheet.absoluteFill}
            />
          </View>

        <View
          style={[
            styles.content,
            {
              padding: isTablet
                ? DesignSystem.spacing.xxl
                : DesignSystem.spacing.xl,
            },
          ]}
        >
          <View
            style={[
              styles.trophyWrap,
              {
                marginBottom: isTablet
                  ? DesignSystem.spacing.lg
                  : DesignSystem.spacing.md,
              },
            ]}
          >
            <View style={styles.burstLayer} pointerEvents="none">
              {!reducedMotion ? (
                <>
                  <BurstRing
                    delay={60}
                    size={ringSize}
                    color={hexWithAlpha(colors.primary, 0.55)}
                    reduced={false}
                  />
                  <BurstRing
                    delay={180}
                    size={ringSize}
                    color={hexWithAlpha(colors.primary, 0.32)}
                    reduced={false}
                  />
                  {CONFETTI.map((piece, index) => (
                    <ConfettiPiece
                      key={index}
                      {...piece}
                      color={confettiColors[index % confettiColors.length]}
                      reduced={false}
                    />
                  ))}
                </>
              ) : null}
            </View>

            <Animated.View
              style={[
                styles.trophyHalo,
                haloStyle,
                {
                  width: haloSize,
                  height: haloSize,
                  borderRadius: haloSize / 2,
                  backgroundColor: hexWithAlpha(colors.primary, 0.16),
                  borderColor: hexWithAlpha(colors.primary, 0.28),
                },
              ]}
            />
            <Animated.View style={iconStyle}>
              <Ionicons
                name="checkmark-circle"
                size={iconSize}
                color={colors.primary}
              />
            </Animated.View>
          </View>

          <Animated.View style={[styles.copyBlock, contentStyle]}>
            <Text
              style={[
                styles.headline,
                {
                  color: colors.text,
                  marginBottom: DesignSystem.spacing.xs,
                },
              ]}
            >
              {headline}
            </Text>

            {snapshot?.title ? (
              <Text
                style={[styles.taskTitle, { color: colors.text }]}
                numberOfLines={2}
              >
                {snapshot.title}
              </Text>
            ) : null}

            <View style={styles.metaRow}>
              <View
                style={[
                  styles.chip,
                  { backgroundColor: hexWithAlpha(category.color, 0.16) },
                ]}
              >
                <Ionicons
                  name={category.icon as keyof typeof Ionicons.glyphMap}
                  size={13}
                  color={category.color}
                />
                <Text style={[styles.chipLabel, { color: colors.text }]}>
                  {category.displayName}
                </Text>
              </View>
              {snapshot?.estimated_duration_minutes ? (
                <View
                  style={[styles.chip, { backgroundColor: colors.fieldFill }]}
                >
                  <Ionicons
                    name="time-outline"
                    size={13}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.chipLabel, { color: colors.textSecondary }]}
                  >
                    {snapshot.estimated_duration_minutes}m
                  </Text>
                </View>
              ) : null}
              {snapshot?.wasOverdue ? (
                <View
                  style={[
                    styles.chip,
                    { backgroundColor: hexWithAlpha(colors.error, 0.14) },
                  ]}
                >
                  <Text style={[styles.chipLabel, { color: colors.error }]}>
                    Was overdue
                  </Text>
                </View>
              ) : null}
            </View>

            {insight ? (
              <Text style={[styles.insight, { color: colors.textSecondary }]}>
                {insight}
              </Text>
            ) : null}

            <View style={styles.buttonWrap}>
              <Button label="Continue" onPress={handleClose} />
            </View>
          </Animated.View>
        </View>
      </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(26, 22, 18, 0.5)",
  },
  card: {
    width: "85%",
    borderRadius: DesignSystem.borders.radius.xlarge,
    borderWidth: StyleSheet.hairlineWidth,
    // Critical: do not clip confetti.
    overflow: "visible",
  },
  cardClip: {
    ...StyleSheet.absoluteFill,
    borderRadius: DesignSystem.borders.radius.xlarge,
    overflow: "hidden",
  },
  content: {
    alignItems: "center",
  },
  trophyWrap: {
    width: 260,
    height: 168,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  burstLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  trophyHalo: {
    position: "absolute",
    borderWidth: DesignSystem.borders.hairline,
  },
  burstRing: {
    position: "absolute",
    borderWidth: 2,
  },
  confetti: {
    position: "absolute",
  },
  copyBlock: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  headline: {
    ...DesignSystem.typography.title2,
    textAlign: "center",
  },
  taskTitle: {
    ...DesignSystem.typography.bodySemiBold,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: DesignSystem.spacing.xs,
    marginBottom: DesignSystem.spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 5,
    borderRadius: DesignSystem.borders.radius.round,
  },
  chipLabel: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
  },
  insight: {
    ...DesignSystem.typography.footnote,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.sm,
  },
  buttonWrap: {
    alignSelf: "stretch",
  },
});
