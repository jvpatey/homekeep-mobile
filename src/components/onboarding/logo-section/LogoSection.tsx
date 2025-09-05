import React from "react";
import { View, Image, Text } from "react-native";
import Animated from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { useSimpleAnimation } from "../../../hooks";
import { styles } from "./styles";

interface LogoSectionProps {
  showText?: boolean;
  compact?: boolean;
}

// LogoSection component for the LogoSection on the onboarding screen
export function LogoSection({
  showText = true,
  compact = false,
}: LogoSectionProps) {
  const { colors } = useTheme();
  const animatedStyle = useSimpleAnimation(0, 800, 20);

  return (
    <Animated.View
      style={[
        compact ? styles.logoContainerCompact : styles.logoContainer,
        animatedStyle,
      ]}
    >
      <Image
        source={require("../../../../assets/images/homekeep-logo.png")}
        style={compact ? styles.logoCompact : styles.logo}
        resizeMode="contain"
      />
      {showText && (
        <Text style={[styles.logoText, { color: colors.text }]}>HomeKeep</Text>
      )}
    </Animated.View>
  );
}
