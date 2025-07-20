import React, { useEffect } from "react";
import { View, Image, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { styles } from "./styles";

interface LogoSectionProps {
  showText?: boolean;
  compact?: boolean;
}

export function LogoSection({
  showText = true,
  compact = false,
}: LogoSectionProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });
    translateY.value = withTiming(0, { duration: 800 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        compact ? styles.logoContainerCompact : styles.logoContainer,
        { backgroundColor: colors.background },
        animatedStyle,
      ]}
    >
      <Image
        source={require("../../../assets/images/homekeep-logo.png")}
        style={compact ? styles.logoCompact : styles.logo}
        resizeMode="contain"
      />
      {showText && (
        <Text style={[styles.logoText, { color: colors.text }]}>HOMEKEEP</Text>
      )}
    </Animated.View>
  );
}
