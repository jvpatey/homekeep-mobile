import React from "react";
import { Text, StyleSheet, StyleProp, TextStyle, ViewStyle, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";

interface SettingsSectionLabelProps {
  children: string;
  /** Skip top margin for the first section under an identity / intro block. */
  first?: boolean;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

/** Uppercase caption used above HearthSurfaceCard groups in Settings-family UIs. */
export function SettingsSectionLabel({
  children,
  first = false,
  style,
  containerStyle,
}: SettingsSectionLabelProps) {
  const { colors } = useTheme();

  return (
    <View style={containerStyle}>
      <Text
        style={[
          styles.label,
          first ? styles.first : null,
          { color: colors.textSecondary },
          style,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  first: {
    marginTop: 0,
  },
});
