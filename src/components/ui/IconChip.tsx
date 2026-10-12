import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface IconChipProps {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  size?: number;
  shape?: "circle" | "rounded";
  /** Overrides the glyph colour when `tint` is too pale to read. */
  glyphColor?: string;
  style?: StyleProp<ViewStyle>;
}

/** Soft tinted icon chip: `tint` at low opacity behind a `tint` glyph. */
export function IconChip({
  icon,
  tint,
  size = 32,
  shape = "circle",
  glyphColor,
  style,
}: IconChipProps) {
  return (
    <View
      style={[
        styles.chip,
        {
          width: size,
          height: size,
          borderRadius: shape === "circle" ? size / 2 : Math.round(size * 0.28),
          backgroundColor: tint + "1F",
        },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Ionicons
        name={icon}
        size={Math.round(size * 0.52)}
        color={glyphColor ?? tint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    justifyContent: "center",
  },
});
