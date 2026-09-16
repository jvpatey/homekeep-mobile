import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { MaintenanceTask } from "../../types/maintenance";
import {
  buildWeekendPlan,
  taskDurationMinutes,
} from "../../utils/seasonalTasks";
import {
  formatTaskDueLabel,
  formatTaskLatenessLabel,
} from "../../utils/formatTaskDates";
import {
  ResolvedWeekendPlan,
  WeekendPlanHistoryEntry,
} from "../../utils/weekendPlanStorage";
import { useTheme } from "../../context/ThemeContext";
import { HearthSheet } from "../ui/HearthSheet";
import { Button } from "../ui/Button";
import { DesignSystem } from "../../theme/designSystem";

interface WeekendBudgetSheetProps {
  visible: boolean;
  /** Live schedule used to preview a draft plan. */
  tasks: MaintenanceTask[];
  budgetMinutes: number;
  onBudgetChange: (minutes: number) => void;
  /** Locked active plan; null = drafting. */
  activePlan: ResolvedWeekendPlan | null;
  history: WeekendPlanHistoryEntry[];
  onClose: () => void;
  onStartPlan: () => void;
  onEndPlan: () => void;
  onPickTask: (instanceId: string) => void;
}

const BUDGETS = [45, 90, 180];

export function WeekendBudgetSheet({
  visible,
  tasks,
  budgetMinutes,
  onBudgetChange,
  activePlan,
  history,
  onClose,
  onStartPlan,
  onEndPlan,
  onPickTask,
}: WeekendBudgetSheetProps) {
  const { colors } = useTheme();
  const isActive = activePlan != null;

  const draft = useMemo(
    () => (isActive ? null : buildWeekendPlan(tasks, budgetMinutes)),
    [isActive, tasks, budgetMinutes]
  );

  const title = isActive ? "Your weekend plan" : "Plan your weekend";
  const canStart = !!draft && draft.tasks.length > 0;

  return (
    <HearthSheet
      visible={visible}
      onClose={onClose}
      title={title}
      footer={
        <View style={styles.footer}>
          {isActive ? (
            <>
              <Button label="End plan" onPress={onEndPlan} variant="ghost" />
              <Button label="Close" onPress={onClose} />
            </>
          ) : (
            <>
              <Button label="Not now" onPress={onClose} variant="ghost" />
              <Button
                label="Start weekend plan"
                onPress={onStartPlan}
                disabled={!canStart}
              />
            </>
          )}
        </View>
      }
    >
      {!isActive ? (
        <>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Pick a time budget. We’ll lock in overdue and due-by-Sunday jobs that
            fit — then track them until they’re done.
          </Text>

          <View style={styles.row}>
            {BUDGETS.map((mins) => (
              <Pressable
                key={mins}
                onPress={() => onBudgetChange(mins)}
                style={[
                  styles.chip,
                  {
                    borderColor:
                      budgetMinutes === mins ? colors.primary : colors.border,
                    backgroundColor:
                      budgetMinutes === mins
                        ? colors.primary + "18"
                        : "transparent",
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: budgetMinutes === mins }}
                accessibilityLabel={`${mins} minute budget`}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {mins} min
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <View
        style={[
          styles.summary,
          {
            backgroundColor: colors.fieldFill,
            borderColor: colors.border,
          },
        ]}
      >
        {isActive && activePlan ? (
          <>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              {activePlan.completedCount} of {activePlan.totalCount} jobs done
            </Text>
            <Text style={[styles.summaryMeta, { color: colors.textSecondary }]}>
              {activePlan.completedMinutes} of {activePlan.plannedMinutes} min
              finished · {activePlan.budgetMinutes} min budget
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              {draft?.usedMinutes ?? 0} of {budgetMinutes} min preview
            </Text>
            <Text style={[styles.summaryMeta, { color: colors.textSecondary }]}>
              {draft && draft.tasks.length > 0
                ? `${draft.tasks.length} job${draft.tasks.length === 1 ? "" : "s"} · ${draft.windowLabel}`
                : draft?.windowLabel ?? "Pick a budget to preview"}
            </Text>
          </>
        )}
      </View>

      {isActive && activePlan ? (
        activePlan.items.map((item) => (
          <Pressable
            key={item.instanceId}
            onPress={() => {
              if (!item.isComplete) onPickTask(item.instanceId);
            }}
            disabled={item.isComplete}
            style={[styles.task, { borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityState={{ disabled: item.isComplete }}
            accessibilityLabel={
              item.isComplete
                ? `${item.title}, completed`
                : `${item.title}, ${item.durationMinutes} minutes`
            }
          >
            <Ionicons
              name={item.isComplete ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={item.isComplete ? colors.primary : colors.textSecondary}
            />
            <View style={styles.taskMain}>
              <Text
                style={[
                  styles.taskTitle,
                  {
                    color: colors.text,
                    textDecorationLine: item.isComplete
                      ? "line-through"
                      : "none",
                    opacity: item.isComplete ? 0.65 : 1,
                  },
                ]}
              >
                {item.title}
              </Text>
              <Text style={{ color: colors.textSecondary, marginTop: 2 }}>
                {item.isComplete ? "Completed" : `${item.durationMinutes} min`}
              </Text>
            </View>
            {!item.isComplete ? (
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            ) : null}
          </Pressable>
        ))
      ) : draft && draft.tasks.length > 0 ? (
        draft.tasks.map((task) => {
          const minutes = taskDurationMinutes(task);
          const dueLabel = task.is_overdue
            ? formatTaskLatenessLabel(task.due_date)
            : formatTaskDueLabel(task.due_date);
          return (
            <View
              key={task.instance_id}
              style={[styles.task, { borderColor: colors.border }]}
            >
              <Ionicons
                name="ellipse-outline"
                size={22}
                color={colors.textSecondary}
              />
              <View style={styles.taskMain}>
                <Text style={[styles.taskTitle, { color: colors.text }]}>
                  {task.title}
                </Text>
                <Text
                  style={{
                    color: task.is_overdue
                      ? colors.error
                      : colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  {dueLabel} · {minutes} min
                </Text>
              </View>
            </View>
          );
        })
      ) : (
        <Text style={{ color: colors.textSecondary }}>
          {draft?.eligibleCount === 0
            ? "Nothing overdue or due through Sunday right now."
            : "Nothing in that window fits this budget — try a longer one."}
        </Text>
      )}

      {!isActive && history.length > 0 ? (
        <View style={styles.history}>
          <Text style={[styles.historyTitle, { color: colors.text }]}>
            Recent weekends
          </Text>
          {history.slice(0, 3).map((entry) => (
            <View
              key={entry.id}
              style={[styles.historyRow, { borderColor: colors.border }]}
            >
              <Ionicons
                name="trophy-outline"
                size={16}
                color={colors.primary}
              />
              <View style={styles.taskMain}>
                <Text style={[styles.historyLabel, { color: colors.text }]}>
                  {entry.taskCount} job{entry.taskCount === 1 ? "" : "s"} ·{" "}
                  {entry.totalMinutes} min
                </Text>
                <Text style={{ color: colors.textSecondary }}>
                  {format(new Date(entry.completedAtISO), "MMM d")}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </HearthSheet>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...DesignSystem.typography.footnote,
    marginBottom: DesignSystem.spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
  },
  chip: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: 1,
  },
  summary: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: DesignSystem.borders.radius.large,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.lg,
  },
  summaryTitle: {
    ...DesignSystem.typography.bodySemiBold,
  },
  summaryMeta: {
    ...DesignSystem.typography.footnote,
    marginTop: 2,
  },
  task: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: DesignSystem.spacing.sm,
  },
  taskMain: {
    flex: 1,
    minWidth: 0,
  },
  taskTitle: {
    ...DesignSystem.typography.body,
    fontWeight: "600",
  },
  footer: {
    gap: DesignSystem.spacing.sm,
  },
  history: {
    marginTop: DesignSystem.spacing.xl,
  },
  historyTitle: {
    ...DesignSystem.typography.caption,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: DesignSystem.spacing.sm,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyLabel: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
  },
});
