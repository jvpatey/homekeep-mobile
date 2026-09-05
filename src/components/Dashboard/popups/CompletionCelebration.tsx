import React, { useEffect, useMemo } from "react";
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
import { Button } from "../../ui/Button";
import { Ionicons } from "@expo/vector-icons";

interface CompletionCelebrationProps {
  isVisible: boolean;
  onClose: () => void;
}

export function CompletionCelebration({
  isVisible,
  onClose,
}: CompletionCelebrationProps) {
  const { colors } = useTheme();
  const { authAtmosphere } = useGradients();
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

  const achievementMessage = useMemo(() => {
    const pool = [
      "Nice work!",
      "Task completed!",
      "One less thing on your plate!",
      "Keeping the home in shape!",
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <View style={styles.overlayContainer}>
      <TouchableOpacity
        style={styles.overlay}
        onPress={handleClose}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel="Dismiss celebration"
      />
      <Animated.View
        style={[
          styles.container,
          containerAnimatedStyle,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            maxWidth: isTablet ? 450 : 350,
          },
          DesignSystem.shadows.softKey,
        ]}
      >
        <LinearGradient
          colors={authAtmosphere}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.35 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <Animated.View
          style={[
            styles.content,
            contentAnimatedStyle,
            {
              padding: isTablet
                ? DesignSystem.spacing.xxl
                : DesignSystem.spacing.xl,
            },
          ]}
        >
          <View
            style={[
              styles.trophyWrap,
              {
                marginBottom: isTablet
                  ? DesignSystem.spacing.lg
                  : DesignSystem.spacing.md,
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
                  backgroundColor: colors.primary + "18",
                  borderColor: colors.primary + "33",
                },
              ]}
            />
            <Animated.View style={iconAnimatedStyle}>
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
                marginBottom: isTablet
                  ? DesignSystem.spacing.lg
                  : DesignSystem.spacing.md,
              },
            ]}
          >
            {achievementMessage}
          </Text>

          <Button label="Continue" onPress={handleClose} />
        </Animated.View>
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
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(26, 22, 18, 0.45)",
  },
  container: {
    width: "85%",
    borderRadius: DesignSystem.borders.radius.xlarge,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
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
  achievementMessage: {
    ...DesignSystem.typography.title2,
    textAlign: "center",
  },
});
