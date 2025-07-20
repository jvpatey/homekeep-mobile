import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { styles } from "./styles";

/**
 * GradientDivider - A decorative divider component that displays a gradient line
 * with fade effects on the edges. Adapts to the current theme (light/dark mode).
 */
export function GradientDivider() {
  const { colors, isDark } = useTheme();

  // Define the main gradient colors based on theme
  const gradientColors = (
    isDark
      ? [colors.primary, colors.secondary]
      : [colors.primary, colors.secondary]
  ) as [string, string];

  // Create a fade effect by repeating background colors at the edges
  const fadeColors = [
    colors.background,
    colors.background,
    gradientColors[0],
    gradientColors[1],
    gradientColors[0],
    colors.background,
    colors.background,
  ] as const;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={fadeColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      />
    </View>
  );
}
