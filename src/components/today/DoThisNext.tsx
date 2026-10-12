import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { addDays, endOfDay, isToday, isValid, parseISO } from "date-fns";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";
import { MaintenanceTask } from "../../types/maintenance";
import {
  formatTaskDueLabel,
  formatTaskLatenessLabel,
} from "../../utils/formatTaskDates";
import { HearthSurfaceCard, SectionHeader } from "../ui";
import { NextRightThingCard } from "../Dashboard/NextRightThingCard";

const MAX_ROWS = 3;

interface DoThisNextProps {
  nextTask: MaintenanceTask | null;
  why: string;
  overdue: MaintenanceTask[];
  upcoming: MaintenanceTask[];
  completingInstanceIds: Set<string>;
  onOpenTask: (task: MaintenanceTask) => void;
  onMarkDone: (task: MaintenanceTask) => void;
  onSeeAll: () => void;
}

function dueDate(task: MaintenanceTask): Date {
  const parsed = parseISO(task.due_date);
  return isValid(parsed) ? parsed : new Date(task.due_date);
}

/** Overdue plus the next 7 days, one row per reminder, soonest first. */
export function tasksThisWeek(
  overdue: MaintenanceTask[],
  upcoming: MaintenanceTask[],
  now = new Date()
): MaintenanceTask[] {
  const horizon = endOfDay(addDays(now, 7)).getTime();
  const seen = new Set<string>();
  return [...overdue, ...upcoming]
    .filter((t) => !t.is_completed && dueDate(t).getTime() <= horizon)
    .sort((a, b) => dueDate(a).getTime() - dueDate(b).getTime())
    .filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
}

export function DoThisNext({
  nextTask,
  why,
  overdue,
  upcoming,
  completingInstanceIds,
  onOpenTask,
  onMarkDone,
  onSeeAll,
}: DoThisNextProps) {
  const { colors } = useTheme();
  const week = useMemo(
    () => tasksThisWeek(overdue, upcoming),
    [overdue, upcoming]
  );
  const rows = week
    .filter((t) => t.instance_id !== nextTask?.instance_id)
    .slice(0, MAX_ROWS);

  if (!nextTask) {
    return (
      <HearthSurfaceCard>
        <View style={styles.caughtUp}>
          <View
            style={[
              styles.caughtUpIcon,
              { backgroundColor: colors.success + "1F" },
            ]}
          >
            <Ionicons name="checkmark-done" size={22} color={colors.success} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.caughtUpTitle, { color: colors.text }]}>
              All caught up
            </Text>
            <Text
              style={[styles.caughtUpBody, { color: colors.textSecondary }]}
            >
              Nothing is due right now. Add a reminder or browse the task library.
            </Text>
          </View>
        </View>
      </HearthSurfaceCard>
    );
  }

  return (
    <View style={styles.wrap}>
      <SectionHeader title="Do this next" />
      <NextRightThingCard
        task={nextTask}
        why={why}
        onPress={() => onOpenTask(nextTask)}
        onMarkDone={() => onMarkDone(nextTask)}
        completing={completingInstanceIds.has(nextTask.instance_id)}
      />
      {rows.length > 0 ? (
        <>
          <SectionHeader
            title="This week"
            actionLabel={`See all ${week.length}`}
            onAction={onSeeAll}
            style={styles.weekHeader}
          />
          <HearthSurfaceCard>
            {rows.map((task, index) => (
              <TodayTaskRow
                key={task.instance_id}
                task={task}
                divider={index > 0}
                completing={completingInstanceIds.has(task.instance_id)}
                onPress={() => onOpenTask(task)}
                onMarkDone={() => onMarkDone(task)}
              />
            ))}
          </HearthSurfaceCard>
        </>
      ) : null}
    </View>
  );
}

function TodayTaskRow({
  task,
  divider,
  completing,
  onPress,
  onMarkDone,
}: {
  task: MaintenanceTask;
  divider: boolean;
  completing: boolean;
  onPress: () => void;
  onMarkDone: () => void;
}) {
  const { colors } = useTheme();
  const late = task.is_overdue;
  const dueToday = isToday(dueDate(task));
  const label = late
    ? formatTaskLatenessLabel(task.due_date)
    : formatTaskDueLabel(task.due_date);
  const labelColor = late
    ? colors.error
    : dueToday
      ? colors.primary
      : colors.textSecondary;

  return (
    <View style={styles.row}>
      {divider ? (
        <View
          style={[styles.divider, { backgroundColor: colors.border }]}
          pointerEvents="none"
        />
      ) : null}
      <Pressable
        onPress={onMarkDone}
        disabled={completing}
        hitSlop={6}
        style={styles.check}
        accessibilityRole="button"
        accessibilityLabel={`Mark ${task.title} done`}
        accessibilityState={{ disabled: completing, busy: completing }}
      >
        {completing ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <View
            style={[
              styles.checkRing,
              { borderColor: late ? colors.error : colors.border },
            ]}
          />
        )}
      </Pressable>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.6 }]}
        accessibilityRole="button"
        accessibilityLabel={`${task.title}. ${label}.`}
        accessibilityHint="Opens the task details"
      >
        <View style={styles.flex}>
          <Text
            style={[styles.rowTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          <Text
            style={[
              styles.rowMeta,
              { color: labelColor, fontWeight: late || dueToday ? "600" : "400" },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    minWidth: 0,
  },
  wrap: {
    gap: DesignSystem.spacing.sm + 2,
  },
  weekHeader: {
    marginTop: DesignSystem.spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 60,
  },
  divider: {
    position: "absolute",
    top: 0,
    left: 56,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  check: {
    width: 56,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  checkRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.sm + 2,
    paddingRight: DesignSystem.spacing.md,
  },
  rowTitle: {
    ...DesignSystem.typography.subhead,
    fontWeight: "600",
  },
  rowMeta: {
    ...DesignSystem.typography.caption,
    marginTop: 2,
  },
  caughtUp: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md - 4,
    padding: DesignSystem.spacing.md,
  },
  caughtUpIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  caughtUpTitle: {
    ...DesignSystem.typography.headline,
  },
  caughtUpBody: {
    ...DesignSystem.typography.subhead,
    marginTop: 2,
  },
});
