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
  withRepeat,
  interpolate,
} from "react-native-reanimated";
import { DesignSystem } from "../../../theme/designSystem";
import { colors } from "../../../theme/colors";
import { useTheme } from "../../../context/ThemeContext";
import { useDevice } from "../../../hooks";

interface StreakPopupProps {
  streak: number;
  onClose: () => void;
}

// StreakPopup component for the Dashboard
export function StreakPopup({ streak, onClose }: StreakPopupProps) {
  const { isDark } = useTheme();
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
    // Entrance animation - faster and more responsive
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, { damping: 20, stiffness: 180 });
    translateY.value = withTiming(0, { duration: 200 });

    // Streak number bounce animation - faster
    streakScale.value = withDelay(
      100,
      withSequence(
        withSpring(1.3, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 150 })
      )
    );

    // Flame rotation animation - faster
    flameRotation.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 200 }),
        withTiming(10, { duration: 200 }),
        withTiming(0, { duration: 200 })
      ),
      2,
      false
    );

    // Dots animation - faster
    dotsOpacity.value = withDelay(
      200,
      withSpring(1, { damping: 20, stiffness: 180 })
    );
    dotsScale.value = withDelay(
      200,
      withSpring(1, { damping: 15, stiffness: 180 })
    );

    // Continue button animation - faster
    continueButtonOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 200 })
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
    // Exit animation - faster
    opacity.value = withTiming(0, { duration: 150 });
    scale.value = withTiming(0.95, { duration: 150 });
    translateY.value = withTiming(20, { duration: 150 });

    // Close after animation
    setTimeout(onClose, 150);
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
              backgroundColor: isDark
                ? "rgba(255, 107, 53, 0.6)"
                : colors.light.accent,
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
            backgroundColor: isDark
              ? "rgba(15, 23, 42, 0.85)"
              : "rgba(255, 255, 255, 0.85)",
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(255, 107, 53, 0.3)"
              : "rgba(255, 107, 53, 0.2)",
          },
          isTablet && {
            maxWidth: getResponsiveValue(350, 500, 600),
          },
        ]}
        pointerEvents="box-none"
      >
        <LinearGradient
          colors={glassGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientBackground,
            isTablet && {
              padding: getResponsiveValue(
                DesignSystem.spacing.xl,
                DesignSystem.spacing.xl + DesignSystem.spacing.md,
                DesignSystem.spacing.xl + DesignSystem.spacing.lg,
              ),
            },
          ]}
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
              size={isTablet ? getResponsiveValue(22, 26, 28) : 22}
              color={
                isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(15, 23, 42, 0.85)"
              }
            />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            {/* Streak Icon */}
            <Animated.View
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
                  color="#FF6B35" 
                />
              </Animated.View>
            </Animated.View>

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
                  isTablet && {
                    fontSize: (styles.streakText.fontSize || 72) * getFontMultiplier(),
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
                isTablet && {
                  fontSize: ((styles.streakLabel.fontSize || DesignSystem.typography.h3.fontSize) * getFontMultiplier()),
                  lineHeight: ((styles.streakLabel.fontSize || DesignSystem.typography.h3.fontSize) * getFontMultiplier()) * 1.2,
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
                isTablet && {
                  fontSize: ((styles.streakMessage.fontSize || DesignSystem.typography.body.fontSize) * getFontMultiplier()),
                  lineHeight: ((styles.streakMessage.fontSize || DesignSystem.typography.body.fontSize) * getFontMultiplier()) * 1.4,
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
            <Animated.View style={continueButtonAnimatedStyle}>
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
                    isTablet && {
                      fontSize: ((styles.continueButtonText.fontSize || DesignSystem.typography.button.fontSize) * getFontMultiplier()),
                    },
                  ]}
                >
                  Continue
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </LinearGradient>
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
