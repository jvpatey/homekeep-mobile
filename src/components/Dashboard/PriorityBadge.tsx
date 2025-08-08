import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PriorityBadgeProps {
  priority: string;
  size?: "small" | "medium" | "large";
  variant?: "header" | "card";
}

export function PriorityBadge({
  priority,
  size = "medium",
  variant = "card",
}: PriorityBadgeProps) {
  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "alert-circle";
      case "medium":
        return "warning";
      case "low":
        return "checkmark-circle";
      default:
        return "remove";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          container: {
            paddingHorizontal: 6,
            paddingVertical: 3,
            borderRadius: 8,
          },
          text: {
            fontSize: 10,
            fontWeight: "600",
          },
          icon: 12,
        };
      case "large":
        return {
          container: {
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 12,
          },
          text: {
            fontSize: 14,
            fontWeight: "700",
          },
          icon: 18,
        };
      default: // medium
        return {
          container: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 10,
          },
          text: {
            fontSize: 11,
            fontWeight: "600",
          },
          icon: 14,
        };
    }
  };

  const getVariantStyles = () => {
    if (variant === "header") {
      return {
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        textColor: "white",
        iconColor: "white",
      };
    } else {
      return {
        backgroundColor: "rgba(0, 0, 0, 0.05)",
        textColor: "#666",
        iconColor: "#666",
      };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: variantStyles.backgroundColor,
          alignSelf: "flex-start",
        },
        sizeStyles.container,
      ]}
    >
      <Ionicons
        name={getPriorityIcon(priority) as any}
        size={sizeStyles.icon}
        color={variantStyles.iconColor}
        style={{ marginRight: 4 }}
      />
      <Text
        style={[
          {
            color: variantStyles.textColor,
            letterSpacing: 0.3,
          },
          sizeStyles.text,
        ]}
      >
        {priority.toUpperCase()}
      </Text>
    </View>
  );
}
