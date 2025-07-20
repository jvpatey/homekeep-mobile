import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useGradients } from "../../hooks";
import { styles } from "./styles";

/**
 * GradientDivider - A decorative divider component that displays a gradient line
 * with fade effects on the edges. Adapts to the current theme (light/dark mode).
 */
export function GradientDivider() {
  const { fadeGradient } = useGradients();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={fadeGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      />
    </View>
  );
}
