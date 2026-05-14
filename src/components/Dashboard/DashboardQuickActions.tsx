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
import { useDevice } from "../../hooks";
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
  const { isTablet, getResponsiveValue } = useDevice();
  const rowPadH = isTablet
    ? getResponsiveValue(
        DesignSystem.spacing.md,
        DesignSystem.spacing.lg,
        DesignSystem.spacing.xl,
      )
    : DesignSystem.spacing.md;

  const surface: StyleProp<ViewStyle> = {
    backgroundColor: isDark
      ? "rgba(35, 37, 38, 0.35)"
      : "rgba(255, 255, 255, 0.5)",
    borderColor: isDark
      ? "rgba(255, 255, 255, 0.12)"
      : "rgba(255, 255, 255, 0.55)",
  };

  return (
    <View
      style={[
        styles.row,
        {
          paddingHorizontal: rowPadH,
          paddingBottom: isTablet
            ? getResponsiveValue(
                DesignSystem.spacing.sm,
                DesignSystem.spacing.md,
                DesignSystem.spacing.md,
              )
            : DesignSystem.spacing.sm,
        },
        isTablet && {
          gap: getResponsiveValue(
            DesignSystem.spacing.sm,
            DesignSystem.spacing.md,
            DesignSystem.spacing.md,
          ),
        },
      ]}
    >
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
    /** paddingHorizontal and paddingBottom set in component for tablet. */
    paddingTop: 0,
  },
  btn: {
    flex: 1,
    flexBasis: 0,
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
