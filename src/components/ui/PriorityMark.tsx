import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { ThemeColors } from "../../types/navigation";
import { DesignSystem } from "../../theme/designSystem";

/** Unified priority colors for Hearth — copper / warning / sage. */
export function getPriorityColor(
  priority: string,
  colors: ThemeColors
): string {
  switch (priority) {
    case "urgent":
    case "high":
      return colors.primary;
    case "medium":
      return colors.warning;
    case "low":
      return colors.secondary;
    default:
      return colors.textSecondary;
  }
}

interface PriorityMarkProps {
  priority: string;
  /** Show label beside the dot. */
  showLabel?: boolean;
  size?: number;
}

export function PriorityMark({
  priority,
  showLabel = false,
  size = 6,
}: PriorityMarkProps) {
  const { colors } = useTheme();
  const dotColor = getPriorityColor(priority, colors);

  return (
    <View style={styles.row} accessibilityLabel={`${priority} priority`}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: dotColor,
        }}
      />
      {showLabel && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {priority}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
  },
  label: {
    ...DesignSystem.typography.caption,
    textTransform: "capitalize",
  },
});
