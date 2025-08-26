import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { DesignSystem } from "../../theme/designSystem";
import { colors } from "../../theme/colors";

interface StreakPopupProps {
  streak: number;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get("window");

const StreakPopup: React.FC<StreakPopupProps> = ({ streak, onClose }) => {
  // Animation values
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const streakScale = useSharedValue(0.5);
  const dotsOpacity = useSharedValue(0);

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
          style={[styles.streakDot, { backgroundColor: colors.light.accent }]}
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
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        <LinearGradient
          colors={["#FF6B35", "#F7931E"]}
          style={styles.gradientBackground}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.light.surface} />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            {/* Streak Icon */}
            <View style={styles.streakIcon}>
              <Ionicons name="flame" size={48} color="white" />
            </View>

            {/* Streak Number */}
            <Animated.View style={[styles.streakNumber, streakAnimatedStyle]}>
              <Text style={styles.streakText}>{streak}</Text>
            </Animated.View>

            {/* Streak Label */}
            <Text style={styles.streakLabel}>
              {streak === 1 ? "Day Streak" : "Day Streak"}
            </Text>

            {/* Streak Message */}
            <Text style={styles.streakMessage}>{getStreakMessage(streak)}</Text>

            {/* Streak Dots */}
            {streak > 0 && (
              <Animated.View style={[styles.streakDots, dotsAnimatedStyle]}>
                {renderStreakDots()}
              </Animated.View>
            )}

            {/* Continue Button */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
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
    color: colors.light.surface,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  streakLabel: {
    ...DesignSystem.typography.h3,
    marginBottom: DesignSystem.spacing.md,
    textAlign: "center",
    color: colors.light.surface,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  streakMessage: {
    ...DesignSystem.typography.body,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.md,
    lineHeight: 24,
    color: colors.light.surface,
    opacity: 0.9,
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  continueButtonText: {
    ...DesignSystem.typography.button,
    color: colors.light.surface,
  },
});

export default StreakPopup;
