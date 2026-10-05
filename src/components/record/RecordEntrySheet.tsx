import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useCurrency } from "../../hooks/useCurrency";
import { useHaptics } from "../../hooks";
import { useSignedPhotoUrls } from "../../hooks/useSignedPhotoUrls";
import { DesignSystem } from "../../theme/designSystem";
import {
  HOME_MAINTENANCE_CATEGORIES,
  MaintenanceTask,
  isRepairRoutine,
} from "../../types/maintenance";
import { completerDisplayName } from "../../utils/completerLabel";
import { HearthSheet } from "../ui/HearthSheet";
import { PhotoViewerModal } from "./PhotoViewerModal";
import { RecordEntryAction } from "./useRecordEntryActions";

function categoryMeta(category: MaintenanceTask["category"]) {
  return HOME_MAINTENANCE_CATEGORIES[
    category as keyof typeof HOME_MAINTENANCE_CATEGORIES
  ];
}

export function laborLabel(laborType: MaintenanceTask["labor_type"]) {
  if (laborType === "diy") return "Did it myself";
  if (laborType === "hired") return "Hired a pro";
  return null;
}

/** Everything recorded about one finished job: photo, cost, who, notes. */
export function RecordEntrySheet({
  task,
  visible,
  onClose,
  onDismissed,
  action,
}: {
  task: MaintenanceTask | null;
  visible: boolean;
  onClose: () => void;
  onDismissed?: () => void;
  action?: RecordEntryAction | null;
}) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { format: formatMoney } = useCurrency();
  const { triggerLight } = useHaptics();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const photoPath = task?.photo_storage_path ?? null;
  const urls = useSignedPhotoUrls([photoPath]);
  const photoUri = photoPath ? (urls[photoPath] ?? null) : null;

  if (!task) return null;

  const meta = categoryMeta(task.category);
  const isRepair = isRepairRoutine(task);
  const completed = new Date(task.completed_at || task.due_date);
  const dateLabel = Number.isNaN(completed.getTime())
    ? "—"
    : format(completed, "EEEE, MMMM d, yyyy");
  const cost =
    typeof task.cost_amount === "number" && task.cost_amount > 0
      ? formatMoney(task.cost_amount)
      : null;
  const labor = laborLabel(task.labor_type);
  const contact = task.contact ?? null;
  const who = completerDisplayName({
    completedBy: task.completed_by,
    completedByName: task.completed_by_name,
    currentUserId: user?.id,
  });
  const notes = task.notes?.trim();

  const runAction = async () => {
    if (!action || running) return;
    setRunning(true);
    const done = await action.run();
    setRunning(false);
    if (done) onClose();
  };

  return (
    <HearthSheet
      visible={visible}
      onClose={onClose}
      onDismissed={onDismissed}
      title={isRepair ? "Repair" : "Completed task"}
      keyboardAvoiding={false}
      maxHeightRatio={0.9}
    >
      {photoPath ? (
        <Pressable
          onPress={() => {
            triggerLight();
            setViewerOpen(true);
          }}
          disabled={!photoUri}
          style={[styles.photo, { backgroundColor: colors.fieldFill }]}
          accessibilityRole="imagebutton"
          accessibilityLabel="Open photo"
        >
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <ActivityIndicator color={colors.textSecondary} />
          )}
          {photoUri ? (
            <View style={styles.expandBadge}>
              <Ionicons name="expand-outline" size={14} color="#FFFFFF" />
            </View>
          ) : null}
        </Pressable>
      ) : null}

      <Text style={[styles.title, { color: colors.text }]}>{task.title}</Text>
      <Text style={[styles.date, { color: colors.textSecondary }]}>
        {dateLabel}
      </Text>

      {cost ? (
        <Text
          style={[styles.amount, { color: colors.text }]}
          accessibilityLabel={`Cost ${cost}`}
        >
          {cost}
        </Text>
      ) : null}

      <View style={[styles.facts, { borderColor: colors.border }]}>
        <Fact
          icon={
            (meta?.icon as keyof typeof Ionicons.glyphMap) ??
            "construct-outline"
          }
          label="Category"
          value={meta?.displayName ?? task.category}
        />
        {labor ? (
          <Fact
            icon={
              task.labor_type === "hired"
                ? "briefcase-outline"
                : "hand-left-outline"
            }
            label="Who did it"
            value={labor}
          />
        ) : null}
        {contact ? (
          <Fact
            icon="person-circle-outline"
            label="Pro"
            value={
              contact.company
                ? `${contact.name} · ${contact.company}`
                : contact.name
            }
            trailing={
              contact.phone ? (
                <Pressable
                  onPress={() => {
                    triggerLight();
                    void Linking.openURL(`tel:${contact.phone}`);
                  }}
                  hitSlop={8}
                  style={[
                    styles.callButton,
                    { backgroundColor: colors.success + "1F" },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${contact.name}`}
                >
                  <Ionicons name="call" size={16} color={colors.success} />
                </Pressable>
              ) : null
            }
          />
        ) : null}
        {who ? (
          <Fact icon="checkmark-done-outline" label="Recorded by" value={who} />
        ) : null}
      </View>

      {notes ? (
        <View style={[styles.notes, { backgroundColor: colors.fieldFill }]}>
          <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>
            Notes
          </Text>
          <Text style={[styles.notesBody, { color: colors.text }]}>
            {notes}
          </Text>
        </View>
      ) : null}

      {action ? (
        <Pressable
          onPress={() => void runAction()}
          disabled={running}
          style={({ pressed }) => [
            styles.action,
            { borderColor: colors.border },
            pressed && { backgroundColor: colors.fieldFill },
          ]}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          {running ? (
            <ActivityIndicator
              color={action.destructive ? colors.error : colors.primary}
            />
          ) : (
            <Ionicons
              name={action.icon}
              size={18}
              color={action.destructive ? colors.error : colors.primary}
            />
          )}
          <Text
            style={[
              styles.actionText,
              { color: action.destructive ? colors.error : colors.primary },
            ]}
          >
            {action.label}
          </Text>
        </Pressable>
      ) : null}

      <PhotoViewerModal
        visible={viewerOpen}
        uri={photoUri}
        title={task.title}
        subtitle={dateLabel}
        onClose={() => setViewerOpen(false)}
      />
    </HearthSheet>
  );
}

function Fact({
  icon,
  label,
  value,
  trailing,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  trailing?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={styles.fact}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <View style={styles.factText}>
        <Text style={[styles.factLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <Text
          style={[styles.factValue, { color: colors.text }]}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    height: 200,
    borderRadius: DesignSystem.borders.radius.large,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  expandBadge: {
    position: "absolute",
    right: DesignSystem.spacing.sm,
    bottom: DesignSystem.spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...DesignSystem.typography.title2,
  },
  date: {
    ...DesignSystem.typography.footnote,
    marginTop: 2,
  },
  amount: {
    fontFamily: DesignSystem.fonts.display,
    fontSize: 30,
    lineHeight: 36,
    marginTop: DesignSystem.spacing.sm,
    fontVariant: ["tabular-nums"],
  },
  facts: {
    marginTop: DesignSystem.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  fact: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 2,
  },
  factText: {
    flex: 1,
    minWidth: 0,
  },
  factLabel: {
    ...DesignSystem.typography.caption,
  },
  factValue: {
    ...DesignSystem.typography.body,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  notes: {
    borderRadius: DesignSystem.borders.radius.medium,
    padding: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.sm,
  },
  notesLabel: {
    ...DesignSystem.typography.captionSemiBold,
    marginBottom: 4,
  },
  notesBody: {
    ...DesignSystem.typography.body,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionText: {
    ...DesignSystem.typography.bodySemiBold,
  },
});
