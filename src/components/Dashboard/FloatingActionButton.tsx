import React, { useEffect, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
  hasTasks: boolean;
}

export function FloatingActionButton({
  onPress,
  hasTasks,
}: FloatingActionButtonProps) {
  const { colors } = useTheme();
  const { isTablet, getResponsiveValue } = useDevice();

  // Animation for button press feedback
  const pressScale = useSharedValue(1);
  
  // Entrance animations
  const fabOpacity = useSharedValue(0);
  const fabScale = useSharedValue(0.8);
  const fabTranslateY = useSharedValue(20);

  const triggerFabAnimations = useCallback(() => {
    // reset
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
  }, []);

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

  return (
    <Animated.View style={fabAnimatedStyle}>
      <TouchableOpacity
        style={[
          fabStyles.floatingActionButton,
          {
            backgroundColor: colors.glass,
            borderColor: colors.glassStroke,
            borderWidth: DesignSystem.borders.hairline,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.06,
            shadowRadius: 24,
            elevation: 4,
          },
          isTablet && {
            width: getResponsiveValue(64, 72, 80),
            height: getResponsiveValue(64, 72, 80),
            borderRadius: getResponsiveValue(32, 36, 40),
            bottom: getResponsiveValue(
              DesignSystem.spacing.xl,
              DesignSystem.spacing.xl + DesignSystem.spacing.md,
              DesignSystem.spacing.xl + DesignSystem.spacing.lg,
            ),
            right: getResponsiveValue(
              DesignSystem.spacing.xl,
              DesignSystem.spacing.xl + DesignSystem.spacing.md,
              DesignSystem.spacing.xl + DesignSystem.spacing.lg,
            ),
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Ionicons 
          name="add" 
          size={isTablet ? getResponsiveValue(28, 32, 36) : 28} 
          color={colors.primary} 
        />
      </TouchableOpacity>
    </Animated.View>
  );
}
