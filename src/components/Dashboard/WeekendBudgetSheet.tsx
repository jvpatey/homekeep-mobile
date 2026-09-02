import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaintenanceTask } from "../../types/maintenance";
import { pickWeekendTasks } from "../../utils/seasonalTasks";
import { useTheme } from "../../context/ThemeContext";
import { HearthSheet } from "../ui/HearthSheet";
import { Button } from "../ui/Button";
import { DesignSystem } from "../../theme/designSystem";

interface WeekendBudgetSheetProps {
  visible: boolean;
  tasks: MaintenanceTask[];
  onClose: () => void;
  onPickTask: (task: MaintenanceTask) => void;
}

const BUDGETS = [45, 90, 180];

export function WeekendBudgetSheet({
  visible,
  tasks,
  onClose,
  onPickTask,
}: WeekendBudgetSheetProps) {
  const { colors } = useTheme();
  const [budget, setBudget] = useState(90);
  const picked = useMemo(
    () => pickWeekendTasks(tasks, budget),
    [tasks, budget]
  );

  return (
    <HearthSheet
      visible={visible}
      onClose={onClose}
      title="Weekend time"
      footer={<Button label="Done" onPress={onClose} variant="ghost" />}
    >
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        How much time do you have? We'll pick jobs that fit.
      </Text>
      <View style={styles.row}>
        {BUDGETS.map((mins) => (
          <Pressable
            key={mins}
            onPress={() => setBudget(mins)}
            style={[
              styles.chip,
              {
                borderColor: budget === mins ? colors.primary : colors.border,
                backgroundColor:
                  budget === mins ? colors.primary + "18" : "transparent",
              },
            ]}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              {mins} min
            </Text>
          </Pressable>
        ))}
      </View>
      {picked.length === 0 ? (
        <Text style={{ color: colors.textSecondary }}>
          Nothing on the schedule fits that window.
        </Text>
      ) : (
        picked.map((task) => (
          <Pressable
            key={task.instance_id}
            onPress={() => {
              onPickTask(task);
              onClose();
            }}
            style={[styles.task, { borderColor: colors.border }]}
          >
            <Text style={[styles.taskTitle, { color: colors.text }]}>
              {task.title}
            </Text>
            <Text style={{ color: colors.textSecondary }}>
              {task.estimated_duration_minutes} min
            </Text>
          </Pressable>
        ))
      )}
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
    marginBottom: DesignSystem.spacing.lg,
  },
  chip: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: 1,
  },
  task: {
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  taskTitle: {
    ...DesignSystem.typography.body,
    fontWeight: "600",
  },
});
