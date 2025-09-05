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

  // Animation for button press feedback only
  const pressScale = useSharedValue(1);

  // Removed animations for cleaner experience

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
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
        style={[
          fabStyles.floatingActionButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.primary,
            borderWidth: 2,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 6,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.primary} />
      </TouchableOpacity>
    </Animated.View>
  );
}
