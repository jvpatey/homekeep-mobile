import React from "react";
import { View, Image, Text } from "react-native";
import Animated from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useTheme } from "../../../context/ThemeContext";
import { useLogoAnimation } from "../../../hooks";
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
  const { colors, isDark } = useTheme();
  const animatedStyle = useLogoAnimation(0);

  const gradientColors = isDark
    ? [colors.primary, colors.secondary, colors.accent]
    : [colors.primary, colors.secondary, colors.accent];

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
        <MaskedView maskElement={<Text style={styles.logoText}>HomeKeep</Text>}>
          <LinearGradient
            colors={gradientColors}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.logoText, { opacity: 0 }]}>HomeKeep</Text>
          </LinearGradient>
        </MaskedView>
      )}
    </Animated.View>
  );
}
