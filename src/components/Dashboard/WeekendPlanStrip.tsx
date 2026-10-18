import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { ResolvedWeekendPlan } from "../../utils/weekendPlanStorage";
import { HearthSurfaceCard } from "../ui";

interface WeekendPlanStripProps {
  plan: ResolvedWeekendPlan;
  onPress: () => void;
  onEndPlan: () => void;
  style?: StyleProp<ViewStyle>;
}

export function WeekendPlanStrip({
  plan,
  onPress,
  onEndPlan,
  style,
}: WeekendPlanStripProps) {
  const { colors } = useTheme();
  const progressLabel = `${plan.completedCount} of ${plan.totalCount} done`;
  const ratio = plan.totalCount > 0 ? plan.completedCount / plan.totalCount : 0;

  return (
    <HearthSurfaceCard containerStyle={style}>
      <View style={styles.row}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.main, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={`Weekend plan, ${progressLabel}. Open plan.`}
        >
          <View
            style={[styles.iconWrap, { backgroundColor: colors.primary + "1F" }]}
          >
            <Ionicons
              name={plan.isComplete ? "checkmark-circle" : "calendar"}
              size={18}
              color={colors.primary}
            />
          </View>
          <View style={styles.copy}>
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={1}
            >
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
            <View style={[styles.track, { backgroundColor: colors.fieldFill }]}>
              <View
                style={[
                  styles.fill,
                  { width: `${ratio * 100}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
          </View>
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
    </HearthSurfaceCard>
  );
}

/** Quiet entry point to the weekend planner when no plan is running. */
export function WeekendPlanPrompt({
  onPress,
  style,
}: {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  return (
    <Pressable
      onPress={() => {
        void triggerLight();
        onPress();
      }}
      style={({ pressed }) => [styles.prompt, style, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel="Plan a weekend with a time budget"
    >
      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
      <Text style={[styles.promptText, { color: colors.primary }]}>
        I have some time this weekend
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md - 4,
    paddingVertical: DesignSystem.spacing.md - 2,
    paddingLeft: DesignSystem.spacing.md,
    paddingRight: DesignSystem.spacing.xs,
    minWidth: 0,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...DesignSystem.typography.subhead,
    fontWeight: "600",
  },
  meta: {
    ...DesignSystem.typography.caption,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 6,
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
  clear: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
  },
  prompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DesignSystem.spacing.xs + 2,
    minHeight: DesignSystem.components.minTouchTarget,
    alignSelf: "center",
    paddingHorizontal: DesignSystem.spacing.md,
  },
  promptText: {
    ...DesignSystem.typography.subhead,
    fontWeight: "600",
  },
});
