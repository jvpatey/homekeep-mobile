import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
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

  // Animation for floating action button when no tasks
  const fabScale = useSharedValue(1);
  const fabRotation = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    // Animate FAB when no tasks
    if (!hasTasks) {
      fabScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1,
        true
      );

      fabRotation.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 2000 }),
          withTiming(-10, { duration: 2000 })
        ),
        -1,
        true
      );
    } else {
      fabScale.value = 1;
      fabRotation.value = 0;
    }
  }, [hasTasks]);

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value * pressScale.value },
      { rotate: `${fabRotation.value}deg` },
    ],
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <Animated.View style={fabAnimatedStyle}>
      <TouchableOpacity
        style={fabStyles.floatingActionButton}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.accent, colors.primary]}
          style={fabStyles.floatingActionButtonGradient}
        >
          <Ionicons name="add" size={28} color={colors.surface} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}
