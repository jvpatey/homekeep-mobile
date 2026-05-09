import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
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
import { useDevice, useGradients } from "../../../hooks";
import { GlassCard } from "../../ui/glass-card/GlassCard";
import { hexWithAlpha } from "./popupChrome";
import { Ionicons } from "@expo/vector-icons";
import { PopupPrimaryButton } from "./PopupPrimaryButton";

interface CompletionCelebrationProps {
  isVisible: boolean;
  onClose: () => void;
  streak?: number;
}

export function CompletionCelebration({
  isVisible,
  onClose,
  streak = 0,
}: CompletionCelebrationProps) {
  const { colors, isDark } = useTheme();
  const { haloGradient } = useGradients();
  const { isTablet } = useDevice();

  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const iconScale = useSharedValue(0.3);
  const contentOpacity = useSharedValue(0);

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

    setTimeout(onClose, DesignSystem.motion.duration.fast);
  };

  useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, {
        duration: DesignSystem.motion.duration.base,
        easing: DesignSystem.motion.easing.standard,
      });
      scale.value = withSpring(1, DesignSystem.motion.spring.smooth);
      translateY.value = withTiming(0, {
        duration: DesignSystem.motion.duration.base,
        easing: DesignSystem.motion.easing.standard,
      });

      iconScale.value = withDelay(
        DesignSystem.motion.stagger,
        withSequence(
          withSpring(1.18, DesignSystem.motion.spring.bouncy),
          withSpring(1, DesignSystem.motion.spring.smooth)
        )
      );

      contentOpacity.value = withDelay(
        DesignSystem.motion.stagger * 2,
        withTiming(1, {
          duration: DesignSystem.motion.duration.base,
          easing: DesignSystem.motion.easing.standard,
        })
      );

      const timer = setTimeout(() => {
        handleClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      scale.value = 0.7;
      opacity.value = 0;
      translateY.value = 50;
      iconScale.value = 0.3;
      contentOpacity.value = 0;
    }
  }, [isVisible]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const getAchievementMessage = () => {
    if (streak >= 7) return "Week Warrior!";
    if (streak >= 5) return "On Fire!";
    if (streak >= 3) return "Streaking!";
    if (streak >= 2) return "Building Momentum!";
    return "Great Start!";
  };

  const getStreakMessage = () => {
    if (streak === 0) return "Complete a task to start your streak!";
    if (streak === 1) return "1 day streak - keep it going!";
    return `${streak} day${streak !== 1 ? "s" : ""} in a row!`;
  };

  if (!isVisible) return null;

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
            maxWidth: isTablet ? 450 : 350,
          },
        ]}
      >
        <GlassCard
          material="thick"
          radius={DesignSystem.borders.radius.glass}
          containerStyle={{ width: "100%" }}
          style={{ overflow: "hidden" }}
        >
          <LinearGradient
            colors={[...haloGradient]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[
              styles.gradientBackground,
              { position: "relative" },
              {
                padding: isTablet
                  ? DesignSystem.spacing.xxl
                  : DesignSystem.spacing.xl,
              },
            ]}
          >
            <LinearGradient
              pointerEvents="none"
              colors={[
                hexWithAlpha(colors.warning, isDark ? 0.24 : 0.15),
                hexWithAlpha(colors.primary, isDark ? 0.16 : 0.1),
                hexWithAlpha(colors.primary, isDark ? 0.09 : 0.055),
              ]}
              locations={[0, 0.48, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.popupAtmosphere}
            />
            <Animated.View style={[styles.content, contentAnimatedStyle]}>
              <View
                style={[
                  styles.trophyWrap,
                  {
                    marginBottom: isTablet
                      ? DesignSystem.spacing.lg
                      : DesignSystem.spacing.md,
                    minHeight: isTablet ? 120 : 96,
                  },
                ]}
              >
                <View
                  style={[
                    styles.trophyHalo,
                    {
                      width: isTablet ? 112 : 88,
                      height: isTablet ? 112 : 88,
                      borderRadius: isTablet ? 56 : 44,
                      backgroundColor: hexWithAlpha(
                        colors.primary,
                        isDark ? 0.2 : 0.1
                      ),
                      borderColor: hexWithAlpha(
                        colors.primary,
                        isDark ? 0.42 : 0.26
                      ),
                    },
                  ]}
                />
                <Animated.View
                  style={[styles.achievementIcon, iconAnimatedStyle]}
                >
                  <Ionicons
                    name="trophy"
                    size={isTablet ? 64 : 48}
                    color={colors.primary}
                  />
                </Animated.View>
              </View>

              <Text
                style={[
                  styles.achievementMessage,
                  {
                    color: colors.text,
                    fontSize: isTablet ? 32 : 24,
                    marginBottom: isTablet
                      ? DesignSystem.spacing.xl
                      : DesignSystem.spacing.lg,
                  },
                ]}
              >
                {getAchievementMessage()}
              </Text>

              <View
                style={[
                  styles.streakSection,
                  {
                    marginBottom: isTablet
                      ? DesignSystem.spacing.xl
                      : DesignSystem.spacing.lg,
                    backgroundColor: hexWithAlpha(
                      colors.primary,
                      isDark ? 0.12 : 0.06
                    ),
                    borderWidth: DesignSystem.borders.hairline,
                    borderColor: hexWithAlpha(
                      colors.primary,
                      isDark ? 0.28 : 0.16
                    ),
                    borderRadius: DesignSystem.borders.radius.large,
                    padding: DesignSystem.spacing.md,
                  },
                ]}
              >
                <View style={styles.streakHeader}>
                  <Ionicons
                    name="flame"
                    size={isTablet ? 32 : 24}
                    color={colors.accent}
                  />
                  <Text
                    style={[
                      styles.streakTitle,
                      {
                        color: colors.text,
                        fontSize: isTablet ? 24 : 18,
                      },
                    ]}
                  >
                    Your Streak
                  </Text>
                </View>
                <Text style={[styles.streakMessage, { color: colors.textSecondary }]}>
                  {getStreakMessage()}
                </Text>
              </View>

              <PopupPrimaryButton label="Continue" onPress={handleClose} />
            </Animated.View>
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
  popupAtmosphere: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    alignItems: "center",
  },
  trophyWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  trophyHalo: {
    position: "absolute",
    borderWidth: DesignSystem.borders.hairline,
  },
  achievementIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  achievementMessage: {
    ...DesignSystem.typography.h2,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  streakSection: {
    width: "100%",
    alignItems: "center",
  },
  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.sm,
  },
  streakTitle: {
    ...DesignSystem.typography.bodySemiBold,
    fontSize: 18,
  },
  streakMessage: {
    ...DesignSystem.typography.body,
    textAlign: "center",
  },
});
