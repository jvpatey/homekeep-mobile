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
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "../../theme/designSystem";
import { useTheme } from "../../context/ThemeContext";
import { useDevice, useGradients, useHaptics, useReducedMotion } from "../../hooks";
import { Button } from "../ui/Button";
import { HOMEKEEP_PLUS_NAME } from "../../lib/purchases";
import { hexWithAlpha } from "../Dashboard/popups/popupChrome";

export type PlusSuccessKind = "subscribe" | "trial" | "restore";

type PlusSuccessCelebrationProps = {
  isVisible: boolean;
  kind: PlusSuccessKind;
  onClose: () => void;
};

const CONFETTI = [
  { x: -100, y: -64, spin: -140, delay: 40, w: 10, h: 14 },
  { x: 96, y: -78, spin: 120, delay: 70, w: 9, h: 13 },
  { x: -70, y: -98, spin: 90, delay: 95, w: 8, h: 12 },
  { x: 78, y: -52, spin: -100, delay: 55, w: 12, h: 7 },
  { x: -118, y: 6, spin: 150, delay: 110, w: 9, h: 14 },
  { x: 112, y: -2, spin: -130, delay: 125, w: 8, h: 15 },
  { x: -28, y: -108, spin: -60, delay: 80, w: 10, h: 8 },
  { x: 24, y: 58, spin: -80, delay: 150, w: 8, h: 8 },
];

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN_OUT = Easing.bezier(0.4, 0, 0.2, 1);
const CONFETTI_MS = 1400;
const AUTO_DISMISS_MS = 3600;

function copyFor(kind: PlusSuccessKind): { headline: string; body: string } {
  if (kind === "restore") {
    return {
      headline: "Welcome back",
      body: `${HOMEKEEP_PLUS_NAME} is active on this account.`,
    };
  }
  if (kind === "trial") {
    return {
      headline: "You're in",
      body: `Your ${HOMEKEEP_PLUS_NAME} trial is active.`,
    };
  }
  return {
    headline: "You're in",
    body: `${HOMEKEEP_PLUS_NAME} is active.`,
  };
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
        { translateY: y * p + 80 * p * p },
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

/** Brief post-subscribe delight — lighter and shorter than task completion. */
export function PlusSuccessCelebration({
  isVisible,
  kind,
  onClose,
}: PlusSuccessCelebrationProps) {
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
  const cardTranslateY = useSharedValue(24);
  const iconProgress = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  const { headline, body } = copyFor(kind);
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
    cardTranslateY.value = withTiming(14, exit);
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
      cardTranslateY.value = 24;
      iconProgress.value = 0;
      contentOpacity.value = 0;
      return;
    }

    closingRef.current = false;
    triggerSuccess();

    const enter = {
      duration: reducedMotion ? 0 : 320,
      easing: EASE_OUT,
    };

    overlayOpacity.value = withTiming(1, enter);
    cardOpacity.value = withTiming(1, enter);
    cardTranslateY.value = withTiming(0, enter);
    iconProgress.value = reducedMotion
      ? withTiming(1, { duration: 0 })
      : withDelay(60, withTiming(1, { duration: 480, easing: EASE_OUT }));
    contentOpacity.value = withDelay(
      reducedMotion ? 0 : 180,
      withTiming(1, {
        duration: reducedMotion ? 0 : 280,
        easing: EASE_IN_OUT,
      })
    );

    const timer = setTimeout(() => {
      handleCloseRef.current();
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
    // Open once per visibility flip.
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
    transform: [{ scale: interpolate(iconProgress.value, [0, 1], [0.72, 1]) }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  if (!isVisible) return null;

  const iconSize = isTablet ? 64 : 54;

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
            accessibilityLabel="Dismiss"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            cardStyle,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              maxWidth: isTablet ? 420 : 340,
            },
            DesignSystem.shadows.softKey,
          ]}
        >
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
            <View style={styles.iconWrap}>
              {!reducedMotion
                ? CONFETTI.map((piece, i) => (
                    <ConfettiPiece
                      key={i}
                      {...piece}
                      color={confettiColors[i % confettiColors.length]}
                      reduced={reducedMotion}
                    />
                  ))
                : null}
              <Animated.View
                style={[
                  styles.iconHalo,
                  {
                    backgroundColor: colors.glassGlow,
                    width: iconSize + 36,
                    height: iconSize + 36,
                    borderRadius: (iconSize + 36) / 2,
                  },
                  iconStyle,
                ]}
              >
                <Ionicons
                  name="sparkles"
                  size={iconSize * 0.55}
                  color={colors.primary}
                />
              </Animated.View>
            </View>

            <Animated.View style={[styles.copy, contentStyle]}>
              <Text style={[styles.headline, { color: colors.text }]}>
                {headline}
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                {body}
              </Text>
              <Button label="Continue" onPress={handleClose} />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(26, 22, 18, 0.5)",
  },
  card: {
    width: "100%",
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "visible",
  },
  cardClip: {
    ...StyleSheet.absoluteFill,
    borderRadius: DesignSystem.borders.radius.large,
    overflow: "hidden",
  },
  content: {
    alignItems: "center",
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.md,
    minHeight: 88,
  },
  iconHalo: {
    alignItems: "center",
    justifyContent: "center",
  },
  confetti: {
    position: "absolute",
  },
  copy: {
    width: "100%",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  headline: {
    ...DesignSystem.typography.title2,
    textAlign: "center",
  },
  body: {
    ...DesignSystem.typography.callout,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.sm,
  },
});
