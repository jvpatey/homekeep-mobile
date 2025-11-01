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
import { useDevice } from "../../../hooks";
import { Ionicons } from "@expo/vector-icons";

// CompletionCelebrationProps
interface CompletionCelebrationProps {
  isVisible: boolean;
  onClose: () => void;
  streak?: number;
}

// CompletionCelebration component for the Dashboard
export function CompletionCelebration({
  isVisible,
  onClose,
  streak = 0,
}: CompletionCelebrationProps) {
  const { isDark } = useTheme();
  const { isTablet } = useDevice();
  
  // Animation values using reanimated
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const iconScale = useSharedValue(0.3);
  const contentOpacity = useSharedValue(0);

  // Glass-like purple/blue gradient with subtle transparency
  const glassGradient = (isDark
    ? [
        "rgba(102, 126, 234, 0.15)",
        "rgba(118, 75, 162, 0.25)",
        "rgba(15, 23, 42, 0.85)",
      ]
    : [
        "rgba(102, 126, 234, 0.12)",
        "rgba(147, 165, 250, 0.18)",
        "rgba(255, 255, 255, 0.85)",
      ]) as [string, string, string];

  const handleClose = () => {
    // Exit animation - smooth and slower
    opacity.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(0.95, { duration: 200 });
    translateY.value = withTiming(20, { duration: 200 });

    // Close after animation
    setTimeout(onClose, 200);
  };

  useEffect(() => {
    if (isVisible) {
      // Entrance animation - smoother and slower like other popups
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 20, stiffness: 180 });
      translateY.value = withTiming(0, { duration: 300 });

      // Icon bounce animation - smoother
      iconScale.value = withDelay(
        150,
        withSequence(
          withSpring(1.3, { damping: 12, stiffness: 200 }),
          withSpring(1, { damping: 15, stiffness: 150 })
        )
      );

      // Content fade in
      contentOpacity.value = withDelay(
        200,
        withTiming(1, { duration: 250 })
      );

      const timer = setTimeout(() => {
        handleClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      // Reset values when hidden
      scale.value = 0.7;
      opacity.value = 0;
      translateY.value = 50;
      iconScale.value = 0.3;
      contentOpacity.value = 0;
    }
  }, [isVisible]);

  // Animated styles
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
    if (streak >= 7) return "🔥 Week Warrior!";
    if (streak >= 5) return "🚀 On Fire!";
    if (streak >= 3) return "💪 Streaking!";
    if (streak >= 2) return "✨ Building Momentum!";
    return "🎯 Great Start!";
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
            backgroundColor: isDark
              ? "rgba(15, 23, 42, 0.85)"
              : "rgba(255, 255, 255, 0.85)",
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(102, 126, 234, 0.3)"
              : "rgba(102, 126, 234, 0.2)",
            maxWidth: isTablet ? 450 : 350,
          },
        ]}
      >
        <LinearGradient
          colors={glassGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientBackground,
            { padding: isTablet ? DesignSystem.spacing.xxl : DesignSystem.spacing.xl },
          ]}
        >
          {/* Content */}
          <Animated.View style={[styles.content, contentAnimatedStyle]}>
            {/* Achievement Icon with smooth bounce animation */}
            <Animated.View
              style={[
                styles.achievementIcon,
                iconAnimatedStyle,
                {
                  marginBottom: isTablet ? DesignSystem.spacing.lg : DesignSystem.spacing.md,
                },
              ]}
            >
              <Ionicons
                name="trophy"
                size={isTablet ? 64 : 48}
                color={isDark ? "#60A5FA" : "#667eea"}
              />
            </Animated.View>

            {/* Achievement Message */}
            <Text
              style={[
                styles.achievementMessage,
                {
                  color: isDark
                    ? "rgba(255, 255, 255, 0.95)"
                    : "rgba(15, 23, 42, 0.9)",
                  fontSize: isTablet ? 32 : 24,
                  marginBottom: isTablet ? DesignSystem.spacing.xl : DesignSystem.spacing.lg,
                },
              ]}
            >
              {getAchievementMessage()}
            </Text>

            {/* Streak Section */}
            <View style={[styles.streakSection, { marginBottom: isTablet ? DesignSystem.spacing.xl : DesignSystem.spacing.lg }]}>
              <View style={styles.streakHeader}>
                <Ionicons name="flame" size={isTablet ? 32 : 24} color="#FF6B35" />
                <Text
                  style={[
                    styles.streakTitle,
                    {
                      color: isDark
                        ? "rgba(255, 255, 255, 0.95)"
                        : "rgba(15, 23, 42, 0.9)",
                      fontSize: isTablet ? 24 : 18,
                    },
                  ]}
                >
                  Your Streak
                </Text>
              </View>
              <Text
                style={[
                  styles.streakMessage,
                  {
                    color: isDark
                      ? "rgba(255, 255, 255, 0.8)"
                      : "rgba(15, 23, 42, 0.75)",
                  },
                ]}
              >
                {getStreakMessage()}
              </Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDark
                    ? "rgba(102, 126, 234, 0.15)"
                    : "rgba(102, 126, 234, 0.12)",
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(102, 126, 234, 0.3)"
                    : "rgba(102, 126, 234, 0.25)",
                  paddingHorizontal: isTablet ? DesignSystem.spacing.xxl : DesignSystem.spacing.xl,
                  paddingVertical: isTablet ? DesignSystem.spacing.lg : DesignSystem.spacing.md,
                },
              ]}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.closeButtonText,
                  {
                    color: isDark
                      ? "rgba(255, 255, 255, 0.95)"
                      : "rgba(102, 126, 234, 0.9)",
                  },
                ]}
              >
                Continue
              </Text>
            </TouchableOpacity>
          </Animated.View>
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
  content: {
    alignItems: "center",
  },
  achievementIcon: {
    marginBottom: DesignSystem.spacing.md,
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

  closeButton: {
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
  },
  closeButtonText: {
    ...DesignSystem.typography.button,
  },
});
