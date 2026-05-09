import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { DesignSystem } from "../../../theme/designSystem";
import { useTheme } from "../../../context/ThemeContext";
import { useDevice } from "../../../hooks";
import { GlassCard } from "../../ui/glass-card/GlassCard";
import { PopupPrimaryButton } from "./PopupPrimaryButton";
import { hexWithAlpha } from "./popupChrome";

interface StreakPopupProps {
  streak: number;
  onClose: () => void;
}

// StreakPopup component for the Dashboard
export function StreakPopup({ streak, onClose }: StreakPopupProps) {
  const { colors, isDark } = useTheme();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();

  // Animation values
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const streakScale = useSharedValue(0.3);
  const flameRotation = useSharedValue(0);
  const dotsOpacity = useSharedValue(0);
  const dotsScale = useSharedValue(0.5);
  const continueButtonOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: DesignSystem.motion.duration.fast,
      easing: DesignSystem.motion.easing.standard,
    });
    scale.value = withSpring(1, DesignSystem.motion.spring.snappy);
    translateY.value = withTiming(0, {
      duration: DesignSystem.motion.duration.fast,
      easing: DesignSystem.motion.easing.standard,
    });

    streakScale.value = withDelay(
      DesignSystem.motion.stagger,
      withSequence(
        withSpring(1.18, DesignSystem.motion.spring.bouncy),
        withSpring(1, DesignSystem.motion.spring.smooth)
      )
    );

    // Subtle single wobble (no looping)
    flameRotation.value = withDelay(
      DesignSystem.motion.stagger,
      withSequence(
        withTiming(-6, {
          duration: DesignSystem.motion.duration.fast,
          easing: DesignSystem.motion.easing.standard,
        }),
        withTiming(6, {
          duration: DesignSystem.motion.duration.fast,
          easing: DesignSystem.motion.easing.standard,
        }),
        withTiming(0, {
          duration: DesignSystem.motion.duration.fast,
          easing: DesignSystem.motion.easing.standard,
        })
      )
    );

    dotsOpacity.value = withDelay(
      DesignSystem.motion.stagger * 2,
      withTiming(1, {
        duration: DesignSystem.motion.duration.base,
        easing: DesignSystem.motion.easing.standard,
      })
    );
    dotsScale.value = withDelay(
      DesignSystem.motion.stagger * 2,
      withSpring(1, DesignSystem.motion.spring.smooth)
    );

    continueButtonOpacity.value = withDelay(
      DesignSystem.motion.stagger * 3,
      withTiming(1, {
        duration: DesignSystem.motion.duration.base,
        easing: DesignSystem.motion.easing.standard,
      })
    );
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const flameAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${flameRotation.value}deg` }],
  }));

  const streakAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  const dotsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value,
    transform: [{ scale: dotsScale.value }],
  }));

  const continueButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: continueButtonOpacity.value,
  }));

  const handleClose = () => {
    opacity.value = withTiming(0, {
      duration: DesignSystem.motion.duration.fast,
      easing: DesignSystem.motion.easing.standard,
    });
    scale.value = withTiming(0.96, {
      duration: DesignSystem.motion.duration.fast,
      easing: DesignSystem.motion.easing.standard,
    });
    translateY.value = withTiming(20, {
      duration: DesignSystem.motion.duration.fast,
      easing: DesignSystem.motion.easing.standard,
    });

    // Close after animation
    setTimeout(onClose, DesignSystem.motion.duration.fast);
  };

  const getStreakMessage = (streakCount: number) => {
    if (streakCount === 0) return "Start your maintenance streak today!";
    if (streakCount === 1) return "Great start! Keep it going!";
    if (streakCount < 5) return "You're building great habits!";
    if (streakCount < 10) return "Impressive consistency!";
    if (streakCount < 20) return "You're on fire! 🔥";
    return "Unstoppable! You're a maintenance master! 🏆";
  };

  const renderStreakDots = () => {
    const maxDots = Math.min(streak, 10); // Cap at 10 dots for readability
    const dots = [];
    const dotSize = isTablet ? getResponsiveValue(12, 16, 18) : 12;
    const dotRadius = dotSize / 2;

    for (let i = 0; i < maxDots; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.streakDot,
            {
              backgroundColor: colors.accent,
              width: dotSize,
              height: dotSize,
              borderRadius: dotRadius,
            },
          ]}
        />
      );
    }

    return dots;
  };

  return (
    <View style={styles.overlayContainer}>
      <TouchableOpacity
        style={styles.overlay}
        onPress={handleClose}
        activeOpacity={1}
      />
      <Animated.View
        style={[
          styles.container,
          containerAnimatedStyle,
          {
            borderRadius: DesignSystem.borders.radius.glass,
            overflow: "hidden",
          },
          isTablet && {
            maxWidth: getResponsiveValue(350, 500, 600),
          },
        ]}
        pointerEvents="box-none"
      >
        <GlassCard
          material="thick"
          radius={DesignSystem.borders.radius.glass}
          containerStyle={{ width: "100%" }}
          style={{ overflow: "hidden" }}
        >
          <LinearGradient
            colors={[
              hexWithAlpha(colors.accent, isDark ? 0.38 : 0.26),
              hexWithAlpha(colors.accent, isDark ? 0.22 : 0.14),
              hexWithAlpha(colors.accent, isDark ? 0.11 : 0.065),
            ]}
            locations={[0, 0.48, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[
              styles.gradientBackground,
              { position: "relative" },
              isTablet && {
                padding: getResponsiveValue(
                  DesignSystem.spacing.xl,
                  DesignSystem.spacing.xl + DesignSystem.spacing.md,
                  DesignSystem.spacing.xl + DesignSystem.spacing.lg,
                ),
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDark
                    ? "rgba(35, 37, 38, 0.55)"
                    : "rgba(255, 255, 255, 0.45)",
                  borderRadius: 20,
                  borderWidth: DesignSystem.borders.hairline,
                  borderColor: colors.glassStroke,
                },
              ]}
              onPress={handleClose}
            >
              <Ionicons
                name="close"
                size={isTablet ? getResponsiveValue(22, 26, 28) : 22}
                color={colors.text}
              />
            </TouchableOpacity>

            <View style={styles.content}>
              <Animated.View
                style={[
                  styles.streakIcon,
                  {
                    backgroundColor: hexWithAlpha(
                      colors.accent,
                      isDark ? 0.22 : 0.12
                    ),
                    padding: 16,
                    borderRadius: 40,
                    borderWidth: DesignSystem.borders.hairline,
                    borderColor: hexWithAlpha(
                      colors.accent,
                      isDark ? 0.45 : 0.3
                    ),
                  },
                  isTablet && {
                    padding: getResponsiveValue(16, 20, 24),
                    borderRadius: getResponsiveValue(40, 50, 60),
                  },
                ]}
              >
                <Animated.View style={flameAnimatedStyle}>
                  <Ionicons
                    name="flame"
                    size={isTablet ? getResponsiveValue(48, 60, 72) : 48}
                    color={colors.accent}
                  />
                </Animated.View>
              </Animated.View>

              <Animated.View style={[styles.streakNumber, streakAnimatedStyle]}>
                <Text
                  style={[
                    styles.streakText,
                    { color: colors.accent },
                    isTablet && {
                      fontSize:
                        (styles.streakText.fontSize || 72) * getFontMultiplier(),
                    },
                  ]}
                >
                  {streak}
                </Text>
              </Animated.View>

              <Text
                style={[
                  styles.streakLabel,
                  { color: colors.text },
                  isTablet && {
                    fontSize:
                      (styles.streakLabel.fontSize ||
                        DesignSystem.typography.h3.fontSize) *
                      getFontMultiplier(),
                    lineHeight:
                      (styles.streakLabel.fontSize ||
                        DesignSystem.typography.h3.fontSize) *
                      getFontMultiplier() *
                      1.2,
                  },
                ]}
              >
                {streak === 1 ? "Day Streak" : "Day Streak"}
              </Text>

              <Text
                style={[
                  styles.streakMessage,
                  { color: colors.textSecondary },
                  isTablet && {
                    fontSize:
                      (styles.streakMessage.fontSize ||
                        DesignSystem.typography.body.fontSize) *
                      getFontMultiplier(),
                    lineHeight:
                      (styles.streakMessage.fontSize ||
                        DesignSystem.typography.body.fontSize) *
                      getFontMultiplier() *
                      1.4,
                  },
                ]}
              >
                {getStreakMessage(streak)}
              </Text>

              {streak > 0 && (
                <Animated.View style={[styles.streakDots, dotsAnimatedStyle]}>
                  {renderStreakDots()}
                </Animated.View>
              )}

              <Animated.View
                style={[styles.continueButtonWrap, continueButtonAnimatedStyle]}
              >
                <PopupPrimaryButton
                  label="Continue"
                  onPress={handleClose}
                  tone="accent"
                />
              </Animated.View>
            </View>
          </LinearGradient>
        </GlassCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    width: "85%",
    maxWidth: 350,
    overflow: "hidden",
  },
  gradientBackground: {
    padding: DesignSystem.spacing.xl,
  },
  closeButton: {
    position: "absolute",
    top: DesignSystem.spacing.md,
    right: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.xs,
  },
  content: {
    alignItems: "center",
  },
  streakIcon: {
    marginBottom: DesignSystem.spacing.md,
  },
  streakNumber: {
    marginBottom: DesignSystem.spacing.sm,
  },
  streakText: {
    fontSize: 72,
    fontWeight: "bold",
    textAlign: "center",
  },
  streakLabel: {
    ...DesignSystem.typography.h3,
    marginBottom: DesignSystem.spacing.md,
    textAlign: "center",
  },
  streakMessage: {
    ...DesignSystem.typography.body,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.md,
    lineHeight: 24,
  },
  streakDots: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.lg,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  streakDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  continueButtonWrap: {
    width: "100%",
    marginTop: DesignSystem.spacing.md,
  },
});
