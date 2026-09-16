import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";
import { ResolvedWeekendPlan } from "../../utils/weekendPlanStorage";

interface WeekendPlanStripProps {
  plan: ResolvedWeekendPlan;
  onPress: () => void;
  onEndPlan: () => void;
}

export function WeekendPlanStrip({
  plan,
  onPress,
  onEndPlan,
}: WeekendPlanStripProps) {
  const { colors, isDark } = useTheme();
  const progressLabel = `${plan.completedCount} of ${plan.totalCount} done`;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: isDark
            ? "rgba(35, 37, 38, 0.45)"
            : "rgba(255, 255, 255, 0.55)",
          borderColor: colors.glassStroke,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={styles.main}
        accessibilityRole="button"
        accessibilityLabel={`Weekend plan, ${progressLabel}. Open plan.`}
      >
        <Ionicons
          name={plan.isComplete ? "checkmark-circle" : "calendar-outline"}
          size={18}
          color={colors.primary}
        />
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            Weekend plan · {progressLabel}
          </Text>
          <Text
            style={[styles.meta, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {plan.completedMinutes} of {plan.plannedMinutes} min
            {plan.remainingCount > 0
              ? ` · ${plan.remainingCount} left`
              : " · All clear"}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textSecondary}
        />
      </Pressable>
      <Pressable
        onPress={onEndPlan}
        hitSlop={10}
        style={styles.clear}
        accessibilityRole="button"
        accessibilityLabel="End weekend plan"
      >
        <Ionicons name="close" size={18} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.glass,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
  },
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.sm,
    paddingLeft: DesignSystem.spacing.md,
    paddingRight: DesignSystem.spacing.xs,
    minWidth: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...DesignSystem.typography.footnote,
    fontWeight: "700",
  },
  meta: {
    ...DesignSystem.typography.caption,
    marginTop: 1,
  },
  clear: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
  },
});
