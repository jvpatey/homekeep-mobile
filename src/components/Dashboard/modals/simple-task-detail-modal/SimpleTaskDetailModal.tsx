import React, { useState } from "react";
import { View, Text, StyleSheet, useWindowDimensions, Pressable } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { MaintenanceTask } from "../../../../types/maintenance";
import { useTheme } from "../../../../context/ThemeContext";
import { useDevice } from "../../../../hooks";
import { DesignSystem } from "../../../../theme/designSystem";
import { HearthSheet } from "../../../ui/HearthSheet";
import { Button } from "../../../ui/Button";
import { PriorityMark } from "../../../ui/PriorityMark";
import { categories } from "../create-task-modal/data";
import { formatTaskSectionHeading } from "../../../../utils/formatTaskDates";

interface SimpleTaskDetailModalProps {
  task: MaintenanceTask | null;
  visible: boolean;
  onClose: () => void;
  onComplete: (instanceId: string) => void | Promise<boolean>;
  onEdit?: (task: MaintenanceTask) => void;
  onSkipOccurrence?: (task: MaintenanceTask) => Promise<boolean>;
  onModified?: () => void;
}

function getCategoryInfo(category: string) {
  const match = categories.find((c) => c.id === category);
  return (
    match ?? {
      id: "GENERAL" as const,
      name: category,
      icon: "construct-outline",
      color: "#6B645C",
    }
  );
}

export function SimpleTaskDetailModal({
  task,
  visible,
  onClose,
  onComplete,
  onEdit,
  onSkipOccurrence,
}: SimpleTaskDetailModalProps) {
  const { colors } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const { isTablet } = useDevice();
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const sheetMaxHeight = windowHeight * 0.9;
  const scrollViewportMaxHeight = sheetMaxHeight * 0.55;

  const formatTime = (minutes?: number) => {
    if (!minutes) return "No time estimate";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatInterval = (intervalDays: number) => {
    if (intervalDays === 7) return "Weekly";
    if (intervalDays === 30) return "Monthly";
    if (intervalDays === 90) return "Quarterly";
    if (intervalDays === 365) return "Yearly";
    if (intervalDays === 1) return "Daily";
    if (intervalDays < 7) return `Every ${intervalDays} days`;
    if (intervalDays < 30) return `Every ${Math.round(intervalDays / 7)} weeks`;
    if (intervalDays < 365)
      return `Every ${Math.round(intervalDays / 30)} months`;
    return `Every ${Math.round(intervalDays / 365)} years`;
  };

  const handleComplete = async () => {
    if (!task || isCompleting || isSkipping) return;
    setIsCompleting(true);
    try {
      const ok = await onComplete(task.instance_id);
      if (ok === false) {
        setIsCompleting(false);
        return;
      }
      onClose();
    } catch (error) {
      console.error("Error completing task:", error);
      setIsCompleting(false);
    }
  };

  const handleSkipOccurrence = async () => {
    if (!task || !onSkipOccurrence || isCompleting || isSkipping) return;
    setIsSkipping(true);
    try {
      const skipped = await onSkipOccurrence(task);
      if (skipped) {
        onClose();
      }
    } catch (error) {
      console.error("Error skipping task occurrence:", error);
    } finally {
      setIsSkipping(false);
    }
  };

  if (!task) return null;

  const category = getCategoryInfo(task.category);
  const showSkipOccurrence =
    !!onSkipOccurrence &&
    !task.is_completed &&
    (task.interval_days ?? 0) > 0;

  const footer = (
    <View style={styles.footerInner}>
      <View style={styles.actionsRow}>
        {onEdit ? (
          <View style={styles.actionSlot}>
            <Button
              label="Edit"
              variant="secondary"
              onPress={() => onEdit(task)}
              accessibilityLabel="Edit task"
            />
          </View>
        ) : null}
        <View style={styles.actionSlot}>
          <Button
            label={isCompleting ? "Completing…" : "Complete"}
            onPress={() => void handleComplete()}
            loading={isCompleting}
            disabled={isSkipping}
            accessibilityLabel="Mark task complete"
          />
        </View>
      </View>
      {showSkipOccurrence ? (
        <Pressable
          onPress={() => void handleSkipOccurrence()}
          disabled={isCompleting || isSkipping}
          style={styles.skipButton}
          accessibilityRole="button"
          accessibilityLabel="Skip this occurrence"
        >
          <Text
            style={[
              styles.skipLabel,
              {
                color: colors.error,
                opacity: isCompleting || isSkipping ? 0.6 : 1,
              },
            ]}
          >
            {isSkipping ? "Skipping…" : "Skip this occurrence"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <HearthSheet
      visible={visible}
      onClose={onClose}
      title="Task details"
      maxHeightRatio={0.9}
      footer={footer}
      contentStyle={{ paddingHorizontal: 0 }}
    >
      <ScrollView
        style={{ maxHeight: scrollViewportMaxHeight }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.taskTitle, { color: colors.text }]}>
          {task.title}
        </Text>

        <View style={styles.metaRow}>
          <View
            style={[
              styles.metaChip,
              {
                backgroundColor: colors.fieldFill,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: category.color + "22" },
              ]}
            >
              <Ionicons
                name={category.icon as keyof typeof Ionicons.glyphMap}
                size={isTablet ? 18 : 16}
                color={category.color}
              />
            </View>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
              {category.name}
            </Text>
          </View>
          <View
            style={[
              styles.metaChip,
              {
                backgroundColor: colors.fieldFill,
                borderColor: colors.border,
              },
            ]}
          >
            <PriorityMark priority={task.priority} size={8} />
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
              {task.priority} priority
            </Text>
          </View>
        </View>

        {task.description ? (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Notes
            </Text>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              {task.description}
            </Text>
          </View>
        ) : null}

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Schedule
        </Text>

        <DetailRow
          icon="time-outline"
          label="Estimated time"
          value={formatTime(task.estimated_duration_minutes)}
        />
        <DetailRow
          icon="calendar-outline"
          label="Due"
          value={formatTaskSectionHeading(new Date(task.due_date))}
        />
        <DetailRow
          icon="repeat-outline"
          label="Recurrence"
          value={formatInterval(task.interval_days)}
        />
      </ScrollView>
    </HearthSheet>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.detailRow,
        {
          backgroundColor: colors.fieldFill,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.detailIcon,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.detailText}>
        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
  },
  taskTitle: {
    ...DesignSystem.typography.title2,
    marginBottom: DesignSystem.spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.lg,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  metaLabel: {
    ...DesignSystem.typography.footnote,
    textTransform: "capitalize",
  },
  section: {
    marginBottom: DesignSystem.spacing.lg,
  },
  sectionLabel: {
    ...DesignSystem.typography.footnote,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: DesignSystem.spacing.sm,
  },
  bodyText: {
    ...DesignSystem.typography.body,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    marginBottom: DesignSystem.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: DesignSystem.borders.radius.medium,
    alignItems: "center",
    justifyContent: "center",
    marginRight: DesignSystem.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    ...DesignSystem.typography.footnote,
    marginBottom: 2,
  },
  detailValue: {
    ...DesignSystem.typography.bodySemiBold,
  },
  footerInner: {
    gap: DesignSystem.spacing.sm,
  },
  actionsRow: {
    flexDirection: "row",
    gap: DesignSystem.spacing.md,
  },
  actionSlot: {
    flex: 1,
  },
  skipButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: DesignSystem.components.minTouchTarget,
    paddingVertical: DesignSystem.spacing.sm,
  },
  skipLabel: {
    ...DesignSystem.typography.body,
  },
});
