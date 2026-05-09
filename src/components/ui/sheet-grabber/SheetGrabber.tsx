import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { DesignSystem } from "../../../theme/designSystem";

interface SheetGrabberProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * 36x4 pill handle used at the top of bottom sheets and modals to telegraph
 * "this surface can be drawn down/dismissed" — same iOS convention as system
 * sheets.
 */
export function SheetGrabber({ style }: SheetGrabberProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          width: 36,
          height: 4,
          borderRadius: 2,
          alignSelf: "center",
          marginTop: DesignSystem.spacing.sm,
          marginBottom: DesignSystem.spacing.md,
          backgroundColor: colors.textSecondary,
          opacity: 0.35,
        },
        style,
      ]}
    />
  );
}
