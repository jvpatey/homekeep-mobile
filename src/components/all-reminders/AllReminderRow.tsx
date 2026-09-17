import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";
import { PriorityMark } from "../ui/PriorityMark";
import { MaintenanceRoutine } from "../../types/maintenance";
import { formatRoutineInterval } from "./groupRoutines";

interface AllReminderRowProps {
  item: MaintenanceRoutine;
  accent: string;
  isDeleting: boolean;
  isResuming: boolean;
  onResume: (id: string) => void;
  onDelete: (id: string, title: string) => void;
}

export function AllReminderRow({
  item,
  accent,
  isDeleting,
  isResuming,
  onResume,
  onDelete,
}: AllReminderRowProps) {
  const { colors } = useTheme();
  const interval = formatRoutineInterval(item.interval_days);
  const duration =
    item.estimated_duration_minutes > 0
      ? `~${item.estimated_duration_minutes} min`
      : null;
  const busy = isDeleting || isResuming;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        DesignSystem.shadows.softKey,
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <PriorityMark priority={item.priority} showLabel size={8} />
        </View>

        <View style={styles.metaRow}>
          <View
            style={[styles.chip, { backgroundColor: colors.fieldFill ?? colors.glassTint }]}
          >
            <Text style={[styles.chipText, { color: colors.textSecondary }]}>
              {interval}
            </Text>
          </View>
          {duration ? (
            <View
              style={[
                styles.chip,
                { backgroundColor: colors.fieldFill ?? colors.glassTint },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={12}
                color={colors.textSecondary}
              />
              <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                {duration}
              </Text>
            </View>
          ) : null}
          {!item.is_active ? (
            <View
              style={[styles.chip, { backgroundColor: `${colors.warning}22` }]}
            >
              <Text style={[styles.chipText, { color: colors.warning }]}>
                Paused
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        {!item.is_active ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: `${colors.primary}18` }]}
            onPress={() => onResume(item.id)}
            disabled={busy}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Resume ${item.title}`}
          >
            <Ionicons
              name={isResuming ? "hourglass-outline" : "play"}
              size={18}
              color={colors.primary}
            />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: `${colors.error}15` }]}
          onPress={() => onDelete(item.id, item.title)}
          disabled={busy}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.title}`}
        >
          <Ionicons
            name={isDeleting ? "hourglass-outline" : "trash-outline"}
            size={18}
            color={colors.error}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    opacity: 1,
  },
  accentBar: {
    width: 4,
    alignSelf: "stretch",
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignSystem.spacing.sm,
  },
  title: {
    ...DesignSystem.typography.smallSemiBold,
    fontSize: 16,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 4,
    borderRadius: DesignSystem.borders.radius.round,
  },
  chipText: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
    paddingRight: DesignSystem.spacing.md,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
