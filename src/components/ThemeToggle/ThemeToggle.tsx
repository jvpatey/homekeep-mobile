import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

export function ThemeToggle() {
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.toggleButton,
        {
          backgroundColor: colors.primary,
          borderColor: colors.border,
        },
      ]}
      onPress={toggleTheme}
    >
      <Ionicons
        name={isDark ? "sunny-outline" : "moon-outline"}
        size={20}
        color="white"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
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
    zIndex: 1000,
  },
});
