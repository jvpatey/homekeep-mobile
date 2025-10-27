import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { DesignSystem } from "../../../theme/designSystem";
import { colors } from "../../../theme/colors";
import { useTheme } from "../../../context/ThemeContext";

interface StreakPopupProps {
  streak: number;
  onClose: () => void;
}

// StreakPopup component for the Dashboard
export function StreakPopup({ streak, onClose }: StreakPopupProps) {
  const { isDark } = useTheme();

  // Animation values
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const streakScale = useSharedValue(0.5);
  const dotsOpacity = useSharedValue(0);

  // Glass-like orange/red gradient with subtle transparency
  const glassGradient = isDark
    ? [
        "rgba(255, 107, 53, 0.15)",
        "rgba(247, 147, 30, 0.25)",
        "rgba(15, 23, 42, 0.85)",
      ]
    : [
        "rgba(255, 107, 53, 0.12)",
        "rgba(255, 167, 108, 0.18)",
        "rgba(255, 255, 255, 0.85)",
      ];

  useEffect(() => {
    // Entrance animation
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withTiming(1, { duration: 400 });

    // Streak number animation
    streakScale.value = withDelay(
      200,
      withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 200 })
      )
    );

    // Dots animation
    dotsOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const streakAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  const dotsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value,
  }));

  const handleClose = () => {
    // Exit animation
    opacity.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(0.8, { duration: 200 });

    // Close after animation
    setTimeout(onClose, 200);
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

    for (let i = 0; i < maxDots; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.streakDot,
            {
              backgroundColor: isDark
                ? "rgba(255, 107, 53, 0.6)"
                : colors.light.accent,
            },
          ]}
        />
      );
    }

    return dots;
  };

  return (
    <TouchableOpacity
      style={styles.overlay}
      onPress={handleClose}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.container,
          containerAnimatedStyle,
          {
            backgroundColor: isDark
              ? "rgba(15, 23, 42, 0.85)"
              : "rgba(255, 255, 255, 0.85)",
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(255, 107, 53, 0.3)"
              : "rgba(255, 107, 53, 0.2)",
          },
        ]}
      >
        <LinearGradient
          colors={glassGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          {/* Close Button */}
          <TouchableOpacity
            style={[
              styles.closeButton,
              {
                backgroundColor: isDark
                  ? "rgba(255, 107, 53, 0.15)"
                  : "rgba(255, 107, 53, 0.12)",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(255, 107, 53, 0.3)"
                  : "rgba(255, 107, 53, 0.25)",
              },
            ]}
            onPress={handleClose}
          >
            <Ionicons
              name="close"
              size={22}
              color={
                isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(15, 23, 42, 0.85)"
              }
            />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            {/* Streak Icon */}
            <View
              style={[
                styles.streakIcon,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 107, 53, 0.2)"
                    : "rgba(255, 167, 108, 0.25)",
                  padding: 16,
                  borderRadius: 40,
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(255, 107, 53, 0.4)"
                    : "rgba(255, 107, 53, 0.3)",
                },
              ]}
            >
              <Ionicons name="flame" size={48} color="#FF6B35" />
            </View>

            {/* Streak Number */}
            <Animated.View style={[styles.streakNumber, streakAnimatedStyle]}>
              <Text
                style={[
                  styles.streakText,
                  {
                    color: isDark
                      ? "rgba(255, 255, 255, 0.95)"
                      : "rgba(255, 107, 53, 0.9)",
                  },
                ]}
              >
                {streak}
              </Text>
            </Animated.View>

            {/* Streak Label */}
            <Text
              style={[
                styles.streakLabel,
                {
                  color: isDark
                    ? "rgba(255, 255, 255, 0.95)"
                    : "rgba(255, 107, 53, 0.9)",
                },
              ]}
            >
              {streak === 1 ? "Day Streak" : "Day Streak"}
            </Text>

            {/* Streak Message */}
            <Text
              style={[
                styles.streakMessage,
                {
                  color: isDark
                    ? "rgba(255, 255, 255, 0.8)"
                    : "rgba(255, 107, 53, 0.85)",
                },
              ]}
            >
              {getStreakMessage(streak)}
            </Text>

            {/* Streak Dots */}
            {streak > 0 && (
              <Animated.View style={[styles.streakDots, dotsAnimatedStyle]}>
                {renderStreakDots()}
              </Animated.View>
            )}

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 107, 53, 0.15)"
                    : "rgba(255, 107, 53, 0.12)",
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(255, 107, 53, 0.3)"
                    : "rgba(255, 107, 53, 0.25)",
                },
              ]}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.continueButtonText,
                  {
                    color: isDark
                      ? "rgba(255, 255, 255, 0.95)"
                      : "rgba(255, 107, 53, 0.9)",
                  },
                ]}
              >
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  container: {
    width: "85%",
    maxWidth: 350,
    borderRadius: DesignSystem.borders.radius.xlarge,
    overflow: "hidden",
    ...DesignSystem.shadows.large,
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
  continueButton: {
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
  },
  continueButtonText: {
    ...DesignSystem.typography.button,
  },
});
