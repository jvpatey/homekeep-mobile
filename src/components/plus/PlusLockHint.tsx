import React from "react";
import { Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";
import { HOMEKEEP_PLUS_NAME } from "../../lib/purchases";

export function PlusLockHint() {
  const { colors } = useTheme();
  return (
    <Text
      style={[styles.hint, { color: colors.primary }]}
      accessibilityLabel={`Included with ${HOMEKEEP_PLUS_NAME}`}
    >
      {HOMEKEEP_PLUS_NAME}
    </Text>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...DesignSystem.typography.captionSemiBold,
    marginRight: DesignSystem.spacing.xs,
  },
});
