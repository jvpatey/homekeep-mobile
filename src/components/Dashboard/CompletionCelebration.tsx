import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";
import { DesignSystem } from "../../theme/designSystem";
import { Ionicons } from "@expo/vector-icons";

interface CompletionCelebrationProps {
  isVisible: boolean;
  onClose: () => void;
  completedCount: number;
  totalCount: number;
  streak?: number;
}

const CompletionCelebration: React.FC<CompletionCelebrationProps> = ({
  isVisible,
  onClose,
  completedCount,
  totalCount,
  streak = 0,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [isVisible]);

  const hideCelebration = () => {
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
      onClose();
    });
  };

  const getAchievementMessage = () => {
    if (streak >= 5) return "🔥 On Fire!";
    if (streak >= 3) return "🚀 Great Streak!";
    if (completedCount === totalCount) return "🎉 All Done!";
    if (completedCount >= totalCount * 0.8) return "💪 Almost There!";
    return "✨ Great Job!";
  };

  const getProgressPercentage = () => {
    return totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
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

            {/* Progress Section */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Progress</Text>
                <Text style={styles.progressCount}>
                  {completedCount} of {totalCount}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: `${getProgressPercentage()}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressPercentage}>
                  {Math.round(getProgressPercentage())}%
                </Text>
              </View>
            </View>

            {/* Streak Info */}
            {streak > 0 && (
              <View style={styles.streakContainer}>
                <Ionicons name="flame" size={20} color="#FF6B35" />
                <Text style={styles.streakText}>
                  {streak} day{streak !== 1 ? "s" : ""} streak!
                </Text>
              </View>
            )}

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
};

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
  progressSection: {
    width: "100%",
    marginBottom: DesignSystem.spacing.lg,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.sm,
  },
  progressTitle: {
    ...DesignSystem.typography.bodySemiBold,
    color: colors.light.surface,
  },
  progressCount: {
    ...DesignSystem.typography.small,
    color: colors.light.surface,
    opacity: 0.8,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.light.accent,
    borderRadius: 4,
  },
  progressPercentage: {
    ...DesignSystem.typography.captionSemiBold,
    color: colors.light.surface,
    minWidth: 35,
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.medium,
    marginBottom: DesignSystem.spacing.lg,
  },
  streakText: {
    ...DesignSystem.typography.bodyMedium,
    color: colors.light.surface,
    marginLeft: DesignSystem.spacing.xs,
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

export default CompletionCelebration;
