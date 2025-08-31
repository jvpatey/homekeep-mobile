import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../context/ThemeContext";

interface PriorityBadgeProps {
  priority: string;
  size?: "small" | "medium" | "large";
  variant?: "default" | "card" | "header";
}

// PriorityBadge component for the Dashboard
export function PriorityBadge({
  priority,
  size = "medium",
  variant = "default",
}: PriorityBadgeProps) {
  const { colors } = useTheme();

  // getPriorityColor function to get the priority color
  const getPriorityColor = () => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return colors.error;
      case "high":
        return colors.warning;
      case "medium":
        return colors.accent;
      case "low":
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  // getSizeStyles function to get the size styles
  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10 };
      case "large":
        return { paddingHorizontal: 12, paddingVertical: 6, fontSize: 14 };
      default:
        return { paddingHorizontal: 8, paddingVertical: 4, fontSize: 12 };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getPriorityColor(),
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: sizeStyles.fontSize,
            color: variant === "card" ? "white" : "white",
          },
        ]}
      >
        {priority.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
