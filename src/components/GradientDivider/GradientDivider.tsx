import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";

export const GradientDivider: React.FC = () => {
  const { colors, isDark } = useTheme();

  const gradientColors = (
    isDark
      ? [colors.primary, colors.secondary]
      : [colors.primary, colors.secondary]
  ) as [string, string];

  const fadeColors = [
    colors.background,
    colors.background,
    gradientColors[0],
    gradientColors[1],
    gradientColors[0],
    colors.background,
    colors.background,
  ] as const;

  const styles = StyleSheet.create({
    container: {
      width: "100%",
      paddingHorizontal: 32,
      marginTop: 0,
      marginBottom: 20,
    },
    gradient: {
      height: 2,
      width: "100%",
      borderRadius: 1,
    },
  });

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
};
