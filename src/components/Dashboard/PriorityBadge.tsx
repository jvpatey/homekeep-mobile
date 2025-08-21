import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface PriorityBadgeProps {
  priority: string;
  size?: "small" | "medium" | "large";
  variant?: "default" | "card" | "header";
}

export function PriorityBadge({
  priority,
  size = "medium",
  variant = "default",
}: PriorityBadgeProps) {
  const getPriorityColor = () => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "#E74C3C";
      case "high":
        return "#FF6B35";
      case "medium":
        return "#F2C94C";
      case "low":
        return "#27AE60";
      default:
        return "#95A5A6";
    }
  };

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
