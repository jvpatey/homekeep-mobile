import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

interface ThemeToggleProps {
  style?: ViewStyle | ViewStyle[];
  size?: number;
  iconSize?: number;
}

export function ThemeToggle({
  style,
  size = 44,
  iconSize = 20,
}: ThemeToggleProps) {
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.toggleButton,
        {
          backgroundColor: colors.primary,
          borderColor: colors.border,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
      onPress={toggleTheme}
    >
      <Ionicons
        name={isDark ? "sunny-outline" : "moon-outline"}
        size={iconSize}
        color={isDark ? "white" : colors.text}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
