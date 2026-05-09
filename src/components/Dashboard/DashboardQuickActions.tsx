import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";

interface DashboardQuickActionsProps {
  onAddTask: () => void;
  onBrowseMaintenancePlans?: () => void;
}

export function DashboardQuickActions({
  onAddTask,
  onBrowseMaintenancePlans,
}: DashboardQuickActionsProps) {
  const { colors, isDark } = useTheme();

  const surface: StyleProp<ViewStyle> = {
    backgroundColor: isDark
      ? "rgba(35, 37, 38, 0.35)"
      : "rgba(255, 255, 255, 0.5)",
    borderColor: isDark
      ? "rgba(255, 255, 255, 0.12)"
      : "rgba(255, 255, 255, 0.55)",
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.btn, surface]}
        onPress={onAddTask}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Add a task"
      >
        <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
        <Text style={[styles.btnLabel, { color: colors.text }]} numberOfLines={1}>
          Add task
        </Text>
      </TouchableOpacity>

      {onBrowseMaintenancePlans ? (
        <TouchableOpacity
          style={[styles.btn, surface]}
          onPress={onBrowseMaintenancePlans}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Browse maintenance plans"
        >
          <Ionicons name="library-outline" size={22} color={colors.primary} />
          <Text
            style={[styles.btnLabel, { color: colors.text }]}
            numberOfLines={1}
          >
            Maintenance plans
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    /** Pull up toward stats card (header has bottom padding + section margin). */
    marginTop: -DesignSystem.spacing.xl,
    paddingTop: DesignSystem.spacing.xs,
    paddingBottom: DesignSystem.spacing.xs,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DesignSystem.spacing.xs,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  btnLabel: {
    ...DesignSystem.typography.smallSemiBold,
    flexShrink: 1,
  },
});
