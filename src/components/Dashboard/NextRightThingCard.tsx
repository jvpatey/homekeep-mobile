import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  CategoryKey,
  HOME_MAINTENANCE_CATEGORIES,
  MaintenanceTask,
} from "../../types/maintenance";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";
import { HearthSurfaceCard } from "../ui";

interface NextRightThingCardProps {
  task: MaintenanceTask;
  why: string;
  onPress: () => void;
  onMarkDone?: () => void;
  completing?: boolean;
  style?: StyleProp<ViewStyle>;
}

function formatDuration(minutes: number | null | undefined): string | null {
  if (!minutes) return null;
  return minutes < 60 ? `~${minutes} min` : `~${Math.round(minutes / 60)} hr`;
}

export function NextRightThingCard({
  task,
  why,
  onPress,
  onMarkDone,
  completing = false,
  style,
}: NextRightThingCardProps) {
  const { colors } = useTheme();
  const category =
    HOME_MAINTENANCE_CATEGORIES[task.category as CategoryKey] ??
    HOME_MAINTENANCE_CATEGORIES.GENERAL;
  const duration = formatDuration(task.estimated_duration_minutes);
  const urgent = task.is_overdue;
  const whyColor = urgent ? colors.error : colors.textSecondary;

  return (
    <HearthSurfaceCard
      containerStyle={style}
      emphasis={urgent ? "tinted" : "default"}
      tint={urgent ? colors.error : undefined}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Do this next: ${task.title}. ${why}.${
          duration ? ` ${duration}.` : ""
        }`}
        accessibilityHint="Opens the task details"
      >
        <View style={styles.topRow}>
          <View
            style={[styles.iconChip, { backgroundColor: category.color + "24" }]}
          >
            <Ionicons
              name={category.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={category.color}
            />
          </View>
          <View style={styles.copy}>
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={2}
              maxFontSizeMultiplier={1.4}
            >
              {task.title}
            </Text>
            <View style={styles.metaRow}>
              {urgent ? (
                <Ionicons name="alert-circle" size={14} color={whyColor} />
              ) : null}
              <Text style={[styles.meta, { color: whyColor }]} numberOfLines={1}>
                {why}
              </Text>
              {duration ? (
                <Text
                  style={[styles.meta, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  · {duration}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </Pressable>

      {onMarkDone ? (
        <View style={styles.actions}>
          <Pressable
            onPress={onMarkDone}
            disabled={completing}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.primary },
              (pressed || completing) && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Mark ${task.title} done`}
            accessibilityState={{ disabled: completing, busy: completing }}
          >
            {completing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.primaryLabel} maxFontSizeMultiplier={1.4}>
              Mark done
            </Text>
          </Pressable>
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: colors.fieldFill },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Details for ${task.title}`}
          >
            <Text
              style={[styles.secondaryLabel, { color: colors.text }]}
              maxFontSizeMultiplier={1.4}
            >
              Details
            </Text>
          </Pressable>
        </View>
      ) : null}
    </HearthSurfaceCard>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.sm + 4,
  },
  pressed: {
    opacity: 0.7,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignSystem.spacing.md - 4,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontFamily: DesignSystem.fonts.displaySemiBold,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  meta: {
    ...DesignSystem.typography.subhead,
  },
  actions: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.md,
  },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: DesignSystem.borders.radius.round,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryLabel: {
    ...DesignSystem.typography.subhead,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButton: {
    minHeight: 44,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borders.radius.round,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryLabel: {
    ...DesignSystem.typography.subhead,
    fontWeight: "600",
  },
});
