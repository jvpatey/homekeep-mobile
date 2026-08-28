import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface HouseMarkProps {
  size?: number;
  /** Compact sizing for inline wordmark rows beside text. */
  inline?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Theme-aware three-bar house mark — sage, copper, ink. No background plate.
 */
export function HouseMark({
  size = 48,
  inline = false,
  style,
}: HouseMarkProps) {
  const { colors } = useTheme();

  const barWidth = size * 0.22;
  const gap = size * 0.06;
  const radius = size * 0.08;
  const heights = [size * 0.55, size * 0.85, size * 0.42];
  const barColors = [colors.secondary, colors.primary, colors.text];
  const containerHeight = inline ? size * 0.85 : size;

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "flex-end",
          gap,
          height: containerHeight,
          justifyContent: "center",
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="HomeKeep"
    >
      {heights.map((height, index) => (
        <View
          key={index}
          style={{
            width: barWidth,
            height,
            borderRadius: radius,
            backgroundColor: barColors[index],
          }}
        />
      ))}
    </View>
  );
}
