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
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { useReducedMotion } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";

type IconName = keyof typeof Ionicons.glyphMap;

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

function RingingBell() {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const ring = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(ring);
      cancelAnimation(pulse);
      ring.value = 0;
      pulse.value = 0;
      return;
    }
    const swing = (to: number) =>
      withTiming(to, { duration: 90, easing: Easing.inOut(Easing.quad) });
    ring.value = withDelay(
      350,
      withRepeat(
        withSequence(
          swing(1),
          swing(-1),
          swing(0.7),
          swing(-0.7),
          swing(0.3),
          swing(0),
          withTiming(0, { duration: 2200 })
        ),
        -1
      )
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }),
      -1
    );
    return () => {
      cancelAnimation(ring);
      cancelAnimation(pulse);
    };
  }, [pulse, reducedMotion, ring]);

  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ring.value * 16}deg` }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.6 : interpolate(pulse.value, [0, 1], [0.8, 0]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.6]) }],
  }));

  return (
    <View style={styles.bellStage} importantForAccessibility="no-hide-descendants">
      <Animated.View
        style={[styles.bellPulse, { borderColor: colors.primary }, pulseStyle]}
      />
      <View
        style={[
          styles.bellPlate,
          DesignSystem.shadows.glassStrong,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Animated.View style={bellStyle}>
          <Ionicons name="notifications" size={34} color={colors.primary} />
        </Animated.View>
      </View>
    </View>
  );
}

export function SetupNotify({ isPlus }: { isPlus: boolean }) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const enter = (delay: number) =>
    reducedMotion
      ? undefined
      : FadeInDown.delay(delay).duration(420).easing(EASE_OUT);

  const rows: { icon: IconName; title: string; detail: string; plus?: boolean }[] =
    [
      {
        icon: "alarm-outline",
        title: "Due-date reminders",
        detail: "A heads-up before tasks are due",
        plus: !isPlus,
      },
      {
        icon: "calendar-outline",
        title: "Monthly recap",
        detail: "What got done and what's next",
      },
      {
        icon: "warning-outline",
        title: "Recall alerts",
        detail: "If something you own is recalled",
      },
    ];

  return (
    <View style={styles.root}>
      <RingingBell />
      <Animated.Text
        entering={enter(120)}
        style={[styles.headline, { color: colors.text }]}
        accessibilityRole="header"
      >
        Don't miss what matters
      </Animated.Text>
      <Animated.Text
        entering={enter(200)}
        style={[styles.support, { color: colors.textSecondary }]}
      >
        A few well-timed nudges. No spam.
      </Animated.Text>

      <View style={styles.rows}>
        {rows.map((row, index) => (
          <Animated.View
            key={row.title}
            entering={enter(320 + index * 80)}
            style={styles.row}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.glassGlow }]}>
              <Ionicons name={row.icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <View style={styles.rowTitleLine}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  {row.title}
                </Text>
                {row.plus ? (
                  <View
                    style={[
                      styles.plusBadge,
                      { backgroundColor: colors.secondary + "1F" },
                    ]}
                  >
                    <Text style={[styles.plusText, { color: colors.secondary }]}>
                      Plus
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.rowDetail, { color: colors.textSecondary }]}>
                {row.detail}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <Animated.Text
        entering={enter(600)}
        style={[styles.footnote, { color: colors.textSecondary }]}
      >
        Fine-tune or turn these off anytime in Settings.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    paddingBottom: DesignSystem.spacing.lg,
  },
  bellStage: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  bellPulse: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
  },
  bellPlate: {
    width: 88,
    height: 88,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  headline: {
    ...DesignSystem.typography.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.xs,
  },
  support: {
    ...DesignSystem.typography.callout,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  rows: {
    alignSelf: "stretch",
    gap: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  rowTitleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  rowTitle: {
    ...DesignSystem.typography.bodySemiBold,
  },
  rowDetail: {
    ...DesignSystem.typography.footnote,
  },
  plusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: DesignSystem.borders.radius.round,
  },
  plusText: {
    ...DesignSystem.typography.captionSemiBold,
  },
  footnote: {
    ...DesignSystem.typography.footnote,
    textAlign: "center",
  },
});
