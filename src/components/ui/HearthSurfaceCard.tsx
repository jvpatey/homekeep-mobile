import React, { ReactNode } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";

interface HearthSurfaceCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

/** Warm surface card — replaces GlassCard on Hearth screens. */
export function HearthSurfaceCard({
  children,
  style,
  containerStyle,
}: HearthSurfaceCardProps) {
  const { colors } = useTheme();

  return (
    <View style={containerStyle}>
      <View
        style={[
          styles.surface,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          DesignSystem.shadows.softKey,
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});
