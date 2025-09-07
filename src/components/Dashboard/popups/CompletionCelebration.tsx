import React, { useEffect, useRef, useCallback, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../../theme/colors";
import { DesignSystem } from "../../../theme/designSystem";
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
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useLayoutEffect(() => {
    if (isVisible) {
      // Start celebration animation
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        hideCelebration();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, scaleAnim, opacityAnim, confettiAnim, hideCelebration]);

  // Reset animations when component becomes invisible
  useEffect(() => {
    if (!isVisible) {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      confettiAnim.setValue(0);
    }
  }, [isVisible, scaleAnim, opacityAnim, confettiAnim]);

  const hideCelebration = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Use setTimeout to ensure onClose doesn't trigger during insertion effect
      setTimeout(() => {
        onClose();
      }, 0);
    });
  }, [scaleAnim, opacityAnim, onClose]);

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
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: opacityAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.gradientBackground}
        >
          {/* Confetti Animation */}
          <Animated.View
            style={[
              styles.confettiContainer,
              {
                opacity: confettiAnim,
              },
            ]}
          >
            {[...Array(8)].map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.confetti,
                  {
                    left: `${Math.random() * 100}%`,
                    transform: [
                      { rotate: `${Math.random() * 360}deg` },
                      { scale: Math.random() * 0.5 + 0.5 },
                    ],
                  },
                ]}
              />
            ))}
          </Animated.View>

          {/* Content */}
          <View style={styles.content}>
            {/* Achievement Icon */}
            <View style={styles.achievementIcon}>
              <Ionicons name="trophy" size={48} color={colors.light.surface} />
            </View>

            {/* Achievement Message */}
            <Text style={styles.achievementMessage}>
              {getAchievementMessage()}
            </Text>

            {/* Streak Section */}
            <View style={styles.streakSection}>
              <View style={styles.streakHeader}>
                <Ionicons name="flame" size={24} color="#FF6B35" />
                <Text style={styles.streakTitle}>Your Streak</Text>
              </View>
              <Text style={styles.streakMessage}>{getStreakMessage()}</Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={hideCelebration}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
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
  confettiContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confetti: {
    position: "absolute",
    width: 8,
    height: 8,
    backgroundColor: colors.light.accent,
    borderRadius: 4,
  },
  content: {
    alignItems: "center",
  },
  achievementIcon: {
    marginBottom: DesignSystem.spacing.md,
  },
  achievementMessage: {
    ...DesignSystem.typography.h2,
    color: colors.light.surface,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.lg,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  streakSection: {
    width: "100%",
    marginBottom: DesignSystem.spacing.lg,
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
    color: colors.light.surface,
    fontSize: 18,
  },
  streakMessage: {
    ...DesignSystem.typography.body,
    color: colors.light.surface,
    textAlign: "center",
    opacity: 0.9,
  },

  closeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  closeButtonText: {
    ...DesignSystem.typography.button,
    color: colors.light.surface,
  },
});
