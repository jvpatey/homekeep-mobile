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
import { DesignSystem } from "../../theme/designSystem";
import { useTheme } from "../../context/ThemeContext";
import { useDevice, useGradients, useHaptics, useReducedMotion } from "../../hooks";
import { Button } from "../ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { hexWithAlpha } from "./popups/popupChrome";
import { WeekendPlanHistoryEntry } from "../../utils/weekendPlanStorage";

export type WeekendPlanCelebrationSnapshot = {
  taskCount: number;
  totalMinutes: number;
  titles: string[];
  history?: WeekendPlanHistoryEntry[];
};

interface WeekendPlanCelebrationProps {
  isVisible: boolean;
  onClose: () => void;
  snapshot: WeekendPlanCelebrationSnapshot | null;
}

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const AUTO_DISMISS_MS = 6200;

const CONFETTI = [
  { x: -130, y: -80, spin: -160, delay: 40, w: 12, h: 17 },
  { x: 120, y: -92, spin: 140, delay: 70, w: 11, h: 15 },
  { x: -86, y: -118, spin: 100, delay: 95, w: 10, h: 14 },
  { x: 96, y: -64, spin: -120, delay: 55, w: 14, h: 9 },
  { x: -142, y: 10, spin: 170, delay: 110, w: 11, h: 16 },
  { x: 136, y: -8, spin: -150, delay: 125, w: 10, h: 17 },
  { x: -52, y: -128, spin: -75, delay: 80, w: 13, h: 9 },
  { x: 40, y: -122, spin: 190, delay: 100, w: 10, h: 13 },
  { x: -108, y: 56, spin: 55, delay: 140, w: 12, h: 10 },
  { x: 112, y: 60, spin: -65, delay: 155, w: 11, h: 15 },
  { x: -24, y: -104, spin: 45, delay: 60, w: 9, h: 13 },
  { x: 20, y: 78, spin: -95, delay: 170, w: 10, h: 10 },
];

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
      withTiming(1, { duration: 1700, easing: EASE_OUT })
    );
  }, [delay, reduced, t]);

  const style = useAnimatedStyle(() => {
    const p = t.value;
    return {
      opacity: interpolate(p, [0, 0.08, 0.72, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: x * p },
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
        { width: w, height: h, borderRadius: 2.5, backgroundColor: color },
        style,
      ]}
    />
  );
}

export function WeekendPlanCelebration({
  isVisible,
  onClose,
  snapshot,
}: WeekendPlanCelebrationProps) {
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

  const finishClose = useCallback(() => {
    closingRef.current = false;
    onCloseRef.current();
  }, []);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
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
      duration: reducedMotion ? 0 : 380,
      easing: EASE_OUT,
    };
    overlayOpacity.value = withTiming(1, enter);
    cardOpacity.value = withTiming(1, enter);
    cardTranslateY.value = withTiming(0, enter);
    iconProgress.value = reducedMotion
      ? withTiming(1, { duration: 0 })
      : withDelay(90, withTiming(1, { duration: 560, easing: EASE_OUT }));
    contentOpacity.value = withDelay(
      reducedMotion ? 0 : 240,
      withTiming(1, {
        duration: reducedMotion ? 0 : 340,
        easing: DesignSystem.motion.easing.standard,
      })
    );

    const timer = setTimeout(() => handleCloseRef.current(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, reducedMotion]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(iconProgress.value, [0, 0.2, 1], [0, 1, 1]),
    transform: [{ scale: interpolate(iconProgress.value, [0, 1], [0.7, 1]) }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  if (!isVisible || !snapshot) return null;

  const confettiColors = [
    colors.primary,
    colors.warning,
    hexWithAlpha(colors.primary, 0.8),
    colors.textSecondary,
  ];
  const shownTitles = snapshot.titles.slice(0, 4);
  const extra = snapshot.titles.length - shownTitles.length;

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
            accessibilityLabel="Dismiss weekend celebration"
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
          <View style={styles.cardClip} pointerEvents="none">
            <LinearGradient
              colors={authAtmosphere}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.4 }}
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
          <View style={styles.trophyWrap}>
            {!reducedMotion
              ? CONFETTI.map((piece, index) => (
                  <ConfettiPiece
                    key={index}
                    {...piece}
                    color={confettiColors[index % confettiColors.length]}
                    reduced={false}
                  />
                ))
              : null}
            <Animated.View style={iconStyle}>
              <Ionicons name="trophy" size={isTablet ? 64 : 54} color={colors.primary} />
            </Animated.View>
          </View>

          <Animated.View style={[styles.copyBlock, contentStyle]}>
            <Text style={[styles.kicker, { color: colors.primary }]}>
              Weekend complete
            </Text>
            <Text style={[styles.headline, { color: colors.text }]}>
              You knocked out the list
            </Text>
            <Text style={[styles.summary, { color: colors.textSecondary }]}>
              {snapshot.taskCount} job{snapshot.taskCount === 1 ? "" : "s"} ·{" "}
              {snapshot.totalMinutes} min
            </Text>

            <View style={styles.titleList}>
              {shownTitles.map((title, index) => (
                <View key={`${index}-${title}`} style={styles.titleRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.titleItem, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                </View>
              ))}
              {extra > 0 ? (
                <Text style={{ color: colors.textSecondary }}>
                  +{extra} more
                </Text>
              ) : null}
            </View>

            {snapshot.history && snapshot.history.length > 0 ? (
              <Text style={[styles.historyNote, { color: colors.textSecondary }]}>
                Saved to your weekend history
                {snapshot.history.length > 1
                  ? ` · ${snapshot.history.length} weekends logged`
                  : ""}
              </Text>
            ) : null}

            <View style={styles.buttonWrap}>
              <Button label="Nice" onPress={handleClose} />
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
    backgroundColor: "rgba(26, 22, 18, 0.55)",
  },
  card: {
    width: "88%",
    borderRadius: DesignSystem.borders.radius.xlarge,
    borderWidth: StyleSheet.hairlineWidth,
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
    width: 280,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  confetti: {
    position: "absolute",
  },
  copyBlock: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  kicker: {
    ...DesignSystem.typography.caption,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: DesignSystem.spacing.xs,
  },
  headline: {
    ...DesignSystem.typography.title2,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.xs,
  },
  summary: {
    ...DesignSystem.typography.bodySemiBold,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  titleList: {
    alignSelf: "stretch",
    gap: DesignSystem.spacing.xs,
    marginBottom: DesignSystem.spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  titleItem: {
    ...DesignSystem.typography.footnote,
    flex: 1,
  },
  historyNote: {
    ...DesignSystem.typography.caption,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  buttonWrap: {
    alignSelf: "stretch",
  },
});
