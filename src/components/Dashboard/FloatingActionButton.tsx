import React, { useEffect, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useScalePress } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";

interface FloatingActionButtonProps {
  onPress: () => void;
}

/**
 * Centered dock pill — distinct from per-row copper complete circles on the right.
 * Sits bottom-center so it never stacks on task complete buttons.
 */
export function FloatingActionButton({ onPress }: FloatingActionButtonProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { animatedStyle, onPressIn, onPressOut } = useScalePress(0.97);

  const fabOpacity = useSharedValue(0);
  const fabTranslateY = useSharedValue(16);

  const triggerFabAnimations = useCallback(() => {
    fabOpacity.value = 0;
    fabTranslateY.value = 16;

    const delay = DesignSystem.motion.stagger * 2;
    const duration = DesignSystem.motion.duration.base;

    fabOpacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: DesignSystem.motion.easing.standard })
    );
    fabTranslateY.value = withDelay(
      delay,
      withTiming(0, { duration, easing: DesignSystem.motion.easing.emphasized })
    );
  }, [fabOpacity, fabTranslateY]);

  useEffect(() => {
    triggerFabAnimations();
  }, [triggerFabAnimations]);

  useFocusEffect(
    useCallback(() => {
      triggerFabAnimations();
    }, [triggerFabAnimations])
  );

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: fabOpacity.value,
    transform: [{ translateY: fabTranslateY.value }],
  }));

  return (
    <View
      style={[
        styles.dock,
        { paddingBottom: insets.bottom + DesignSystem.spacing.md },
      ]}
      pointerEvents="box-none"
    >
      <Animated.View style={entranceStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityLabel="Add task"
        >
          <Animated.View
            style={[
              styles.pillOuter,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              DesignSystem.shadows.softKey,
              animatedStyle,
            ]}
          >
            <View
              style={[
                styles.pillInner,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
              <Text style={styles.pillLabel}>Add task</Text>
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  pillOuter: {
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
  },
  pillInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DesignSystem.spacing.sm,
    minHeight: DesignSystem.components.buttonLarge,
    paddingHorizontal: DesignSystem.spacing.xl,
    borderRadius: DesignSystem.borders.radius.round,
  },
  pillLabel: {
    ...DesignSystem.typography.button,
    color: "#FFFFFF",
    fontSize: 17,
  },
});
