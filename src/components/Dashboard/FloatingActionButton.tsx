import React, { useEffect, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useDevice } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { fabStyles } from "./styles";

interface FloatingActionButtonProps {
  onPress: () => void;
}

export function FloatingActionButton({ onPress }: FloatingActionButtonProps) {
  const { colors } = useTheme();
  const { isTablet, getResponsiveValue } = useDevice();

  const pressScale = useSharedValue(1);
  const fabOpacity = useSharedValue(0);
  const fabScale = useSharedValue(0.8);
  const fabTranslateY = useSharedValue(20);

  const triggerFabAnimations = useCallback(() => {
    fabOpacity.value = 0;
    fabScale.value = 0.8;
    fabTranslateY.value = 20;

    const s = DesignSystem.motion.stagger * 2;
    const d = DesignSystem.motion.duration.base;

    fabOpacity.value = withDelay(
      s,
      withTiming(1, { duration: d, easing: DesignSystem.motion.easing.standard })
    );
    fabScale.value = withDelay(s, withSpring(1, DesignSystem.motion.spring.smooth));
    fabTranslateY.value = withDelay(
      s,
      withTiming(0, { duration: d, easing: DesignSystem.motion.easing.standard })
    );
  }, [fabOpacity, fabScale, fabTranslateY]);

  useEffect(() => {
    triggerFabAnimations();
  }, [triggerFabAnimations]);

  useFocusEffect(
    useCallback(() => {
      triggerFabAnimations();
    }, [triggerFabAnimations])
  );

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fabOpacity.value,
    transform: [
      { scale: pressScale.value * fabScale.value },
      { translateY: fabTranslateY.value },
    ],
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.96, DesignSystem.motion.spring.snappy);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, DesignSystem.motion.spring.snappy);
  };

  const size = isTablet ? getResponsiveValue(64, 72, 80) : 56;

  return (
    <Animated.View style={fabAnimatedStyle}>
      <TouchableOpacity
        style={[
          fabStyles.floatingActionButton,
          {
            backgroundColor: colors.primary,
            width: size,
            height: size,
            borderRadius: size / 2,
            ...DesignSystem.shadows.softKey,
          },
          isTablet && {
            bottom: getResponsiveValue(
              DesignSystem.spacing.xl,
              DesignSystem.spacing.xl + DesignSystem.spacing.md,
              DesignSystem.spacing.xl + DesignSystem.spacing.lg
            ),
            right: getResponsiveValue(
              DesignSystem.spacing.xl,
              DesignSystem.spacing.xl + DesignSystem.spacing.md,
              DesignSystem.spacing.xl + DesignSystem.spacing.lg
            ),
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="Add task"
      >
        <Ionicons
          name="add"
          size={isTablet ? getResponsiveValue(28, 32, 36) : 28}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </Animated.View>
  );
}
