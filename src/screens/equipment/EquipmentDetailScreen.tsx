import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { differenceInMonths, format, parseISO } from "date-fns";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { useQuickActions } from "../../context/QuickActionsContext";
import { useHaptics } from "../../hooks";
import { useCurrency } from "../../hooks/useCurrency";
import { useRecordData } from "../../hooks/useRecordData";
import {
  removeEquipmentFromIndex,
  upsertEquipmentInIndex,
  useEquipmentIndex,
} from "../../hooks/useEquipmentIndex";
import { EquipmentManualService } from "../../services/EquipmentManualService";
import { HeaderIconButton } from "../../components/ui";
import { RecordRow, RecordSection } from "../../components/record/RecordList";
import { RecordEntrySheet } from "../../components/record/RecordEntrySheet";
import { useRecordEntryActions } from "../../components/record/useRecordEntryActions";
import { EquipmentFormSheet } from "../../components/equipment/EquipmentFormSheet";
import {
  AttachmentKind,
  attachFile,
  openStoredFile,
  promptForAttachment,
  removeFile,
} from "../../components/equipment/equipmentAttachments";
import { equipmentTint } from "../../components/equipment/equipmentGroups";
import { formatRoutineInterval } from "../../components/all-reminders/groupRoutines";
import {
  EQUIPMENT_TYPE_LABELS,
  EquipmentConsumable,
  equipmentTypeIcon,
} from "../../types/equipmentManual";
import { isRepairRoutine, MaintenanceTask } from "../../types/maintenance";
import { consumableSummary } from "../../data/equipmentTaskHints";
import { formatTaskDueLabel } from "../../utils/formatTaskDates";
import { showActionMenu } from "../../utils/actionMenu";
import { resolveWarrantyFields } from "../../utils/equipmentWarranty";
import { usePlusFeature } from "../../lib/plusFeatures";
import { RecordStackParamList } from "../../navigation/types";
import { DesignSystem } from "../../theme/designSystem";

type Nav = NativeStackNavigationProp<RecordStackParamList, "EquipmentDetail">;

function parseDay(iso: string | null | undefined) {
  if (!iso) return null;
  const date = parseISO(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function ageLabel(purchased: Date) {
  const months = differenceInMonths(new Date(), purchased);
  if (months < 1) return "New";
  if (months < 12) return `${months} mo old`;
  const years = Math.floor(months / 12);
  return `${years} yr${years === 1 ? "" : "s"} old`;
}

export function EquipmentDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RecordStackParamList, "EquipmentDetail">>();
  const { colors } = useTheme();
  const { triggerLight, triggerMedium, triggerSuccess } = useHaptics();
  const { format: formatMoney } = useCurrency();
  const { tasks } = useTasks();
  const { openCreateTask, openLogRepair } = useQuickActions();
  const { byId, loaded } = useEquipmentIndex({ refreshOnFocus: false });
  const { completions } = useRecordData();
  const actionFor = useRecordEntryActions();
  const documents = usePlusFeature("documents");
  const [editing, setEditing] = useState(false);
  const [busyKind, setBusyKind] = useState<AttachmentKind | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selected, setSelected] = useState<MaintenanceTask | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const equipmentId = route.params.equipmentId;
  const item = byId.get(equipmentId) ?? null;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: item?.name ?? "Equipment",
      headerLargeTitleEnabled: false,
      headerRight: item
        ? () => (
            <HeaderIconButton
              icon="create-outline"
              onPress={() => setEditing(true)}
              accessibilityLabel="Edit equipment"
            />
          )
        : undefined,
    });
  }, [item, navigation]);

  const reminders = useMemo(() => {
    const seen = new Set<string>();
    return tasks
      .filter(
        (task) =>
          task.equipment_id === equipmentId &&
          !task.is_completed &&
          !isRepairRoutine(task)
      )
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .filter((task) => {
        if (seen.has(task.id)) return false;
        seen.add(task.id);
        return true;
      });
  }, [equipmentId, tasks]);

  const history = useMemo(
    () => completions.filter((task) => task.equipment_id === equipmentId),
    [completions, equipmentId]
  );
  const spent = history.reduce(
    (sum, task) =>
      sum + (typeof task.cost_amount === "number" ? task.cost_amount : 0),
    0
  );

  if (!item) {
    return (
      <View style={[styles.missing, { backgroundColor: colors.background }]}>
        {loaded ? (
          <Text style={[styles.missingText, { color: colors.textSecondary }]}>
            This equipment was removed.
          </Text>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </View>
    );
  }

  const tint = equipmentTint(item.equipment_type);
  const typeLabel = item.equipment_type
    ? EQUIPMENT_TYPE_LABELS[item.equipment_type]
    : null;
  const subtitle = [item.manufacturer, typeLabel].filter(Boolean).join(" · ");
  const purchased = parseDay(item.purchase_date);
  const warranty = resolveWarrantyFields(item.warranty_expires_on);
  const consumables = item.consumables ?? [];

  const copy = async (key: string, value: string) => {
    await Clipboard.setStringAsync(value);
    triggerSuccess();
    setCopiedKey(key);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopiedKey(null), 1600);
  };

  const copyConsumable = (part: EquipmentConsumable) => {
    const value = [part.partNumber, part.size].filter(Boolean).join(" ");
    void copy(part.id, value || part.label);
  };

  const viewFile = async (kind: AttachmentKind) => {
    if (!(await documents.unlock())) return;
    await openStoredFile(
      kind === "manual" ? item.manual_storage_path : item.receipt_storage_path,
      kind
    );
  };

  const attach = async (kind: AttachmentKind) => {
    if (!(await documents.unlock())) return;
    const file = await promptForAttachment(kind);
    if (!file) return;
    setBusyKind(kind);
    try {
      upsertEquipmentInIndex(await attachFile(item, kind, file));
      triggerSuccess();
    } catch (error) {
      Alert.alert(
        "Upload failed",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setBusyKind(null);
    }
  };

  const confirmRemove = (kind: AttachmentKind) => {
    const label = kind === "manual" ? "manual" : "receipt";
    Alert.alert(`Remove the ${label}?`, "The file is deleted from HomeKeep.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setBusyKind(kind);
          try {
            upsertEquipmentInIndex(await removeFile(item, kind));
          } catch (error) {
            Alert.alert(
              "Couldn't remove",
              error instanceof Error ? error.message : "Please try again."
            );
          } finally {
            setBusyKind(null);
          }
        },
      },
    ]);
  };

  const documentMenu = (kind: AttachmentKind) => {
    triggerLight();
    if (documents.locked) {
      void documents.unlock();
      return;
    }
    const path =
      kind === "manual" ? item.manual_storage_path : item.receipt_storage_path;
    if (!path) {
      void attach(kind);
      return;
    }
    showActionMenu({
      title: kind === "manual" ? "Manual" : "Receipt",
      options: [
        {
          label: "View",
          icon: "eye-outline",
          onPress: () => void viewFile(kind),
        },
        {
          label: "Replace",
          icon: "swap-horizontal-outline",
          onPress: () => void attach(kind),
        },
        {
          label: "Remove",
          icon: "trash-outline",
          destructive: true,
          onPress: () => confirmRemove(kind),
        },
      ],
    });
  };

  const confirmDelete = () => {
    void triggerMedium();
    Alert.alert(
      `Delete ${item.name}?`,
      "Its manual and receipt are deleted. Linked reminders stay on your schedule.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } =
              await EquipmentManualService.deleteEquipmentManual(item.id);
            if (error) {
              Alert.alert("Couldn't delete", error.message);
              return;
            }
            removeEquipmentFromIndex(item.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const copyTrailing = (key: string) => (
    <Ionicons
      name={copiedKey === key ? "checkmark-circle" : "copy-outline"}
      size={16}
      color={copiedKey === key ? colors.success : colors.textSecondary}
    />
  );

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={[styles.heroIcon, { backgroundColor: tint }]}>
            <Ionicons
              name={equipmentTypeIcon(item.equipment_type)}
              size={34}
              color="#FFFFFF"
            />
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
          {warranty.warrantyStatus !== "none" ? (
            <View
              style={[
                styles.warrantyPill,
                {
                  backgroundColor:
                    warranty.warrantyStatus === "ok"
                      ? colors.success + "1F"
                      : warranty.warrantyStatus === "expiring_soon"
                        ? colors.warning + "22"
                        : colors.fieldFill,
                },
              ]}
            >
              <Ionicons
                name={
                  warranty.warrantyStatus === "expired"
                    ? "shield-outline"
                    : "shield-checkmark"
                }
                size={13}
                color={
                  warranty.warrantyStatus === "ok"
                    ? colors.success
                    : warranty.warrantyStatus === "expiring_soon"
                      ? colors.warning
                      : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.warrantyText,
                  {
                    color:
                      warranty.warrantyStatus === "ok"
                        ? colors.success
                        : warranty.warrantyStatus === "expiring_soon"
                          ? colors.warning
                          : colors.textSecondary,
                  },
                ]}
              >
                {warranty.warrantyStatus === "expired"
                  ? `Warranty ended ${warranty.warrantyExpiresLabel}`
                  : `Under warranty until ${warranty.warrantyExpiresLabel}`}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <ActionButton
            icon="hammer"
            label="Log repair"
            onPress={() => void openLogRepair({ equipmentId: item.id })}
          />
          <ActionButton
            icon="alarm"
            label="Reminder"
            onPress={() => void openCreateTask({ equipmentId: item.id })}
          />
          <ActionButton
            icon="document-text"
            label="Manual"
            busy={busyKind === "manual"}
            onPress={() =>
              item.manual_storage_path
                ? void viewFile("manual")
                : void attach("manual")
            }
          />
        </View>

        <RecordSection title="Details">
          <RecordRow
            icon="business-outline"
            tint={tint}
            title="Manufacturer"
            value={item.manufacturer || "Add"}
            onPress={item.manufacturer ? undefined : () => setEditing(true)}
          />
          <RecordRow
            icon="barcode-outline"
            tint={tint}
            title="Model"
            value={item.model_number || "Add"}
            showChevron={false}
            trailing={item.model_number ? copyTrailing("model") : undefined}
            onPress={() =>
              item.model_number
                ? void copy("model", item.model_number)
                : setEditing(true)
            }
          />
          <RecordRow
            icon="finger-print-outline"
            tint={tint}
            title="Serial"
            value={item.serial_number || "Add"}
            showChevron={false}
            trailing={item.serial_number ? copyTrailing("serial") : undefined}
            onPress={() =>
              item.serial_number
                ? void copy("serial", item.serial_number)
                : setEditing(true)
            }
          />
          <RecordRow
            icon="bag-check-outline"
            tint={tint}
            title="Purchased"
            subtitle={purchased ? ageLabel(purchased) : null}
            value={purchased ? format(purchased, "MMM d, yyyy") : "Add"}
            onPress={purchased ? undefined : () => setEditing(true)}
          />
        </RecordSection>

        <RecordSection
          title="Parts and consumables"
          footer={
            consumables.length > 0
              ? "Tap a part to copy its number for reordering."
              : undefined
          }
        >
          {consumables.length === 0 ? (
            <RecordRow
              icon="add"
              tint={colors.primary}
              title="Add filter sizes and part numbers"
              subtitle="They show up on the tasks that need them."
              onPress={() => setEditing(true)}
            />
          ) : (
            consumables.map((part) => (
              <RecordRow
                key={part.id}
                icon="cube-outline"
                tint={tint}
                title={part.label}
                subtitle={
                  [
                    part.size,
                    part.partNumber ? `Part ${part.partNumber}` : null,
                    part.notes,
                  ]
                    .filter(Boolean)
                    .join(" · ") || null
                }
                showChevron={false}
                trailing={copyTrailing(part.id)}
                onPress={() => copyConsumable(part)}
                accessibilityLabel={`${consumableSummary(part)}. Copy`}
              />
            ))
          )}
        </RecordSection>

        <RecordSection title="Reminders">
          {reminders.map((task) => (
            <RecordRow
              key={task.id}
              icon="alarm-outline"
              tint={task.is_overdue ? colors.error : colors.primary}
              title={task.title}
              subtitle={`${formatRoutineInterval(task.interval_days)} · ${formatTaskDueLabel(task.due_date)}`}
            />
          ))}
          <RecordRow
            icon="add"
            tint={colors.primary}
            title="Add a reminder"
            onPress={() => void openCreateTask({ equipmentId: item.id })}
          />
        </RecordSection>

        <RecordSection title="Documents">
          <RecordRow
            icon="document-text-outline"
            tint={tint}
            title="Manual"
            value={item.manual_storage_path ? "On file" : "Attach"}
            locked={documents.locked}
            trailing={
              busyKind === "manual" ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : undefined
            }
            onPress={() => documentMenu("manual")}
          />
          <RecordRow
            icon="receipt-outline"
            tint={tint}
            title="Receipt"
            value={item.receipt_storage_path ? "On file" : "Attach"}
            locked={documents.locked}
            trailing={
              busyKind === "receipt" ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : undefined
            }
            onPress={() => documentMenu("receipt")}
          />
        </RecordSection>

        <RecordSection
          title="History"
          trailing={
            spent > 0 ? (
              <Text style={[styles.spent, { color: colors.textSecondary }]}>
                {formatMoney(spent, { whole: spent >= 1000 })} spent
              </Text>
            ) : undefined
          }
        >
          {history.length === 0 ? (
            <RecordRow
              icon="hammer-outline"
              tint={colors.primary}
              title="Log a repair or service"
              subtitle="Completed reminders for this equipment show up here too."
              onPress={() => void openLogRepair({ equipmentId: item.id })}
            />
          ) : (
            history.slice(0, 12).map((task) => {
              const date = new Date(task.completed_at || task.due_date);
              return (
                <RecordRow
                  key={task.instance_id}
                  icon={isRepairRoutine(task) ? "hammer-outline" : "checkmark"}
                  tint={isRepairRoutine(task) ? tint : colors.success}
                  title={task.title}
                  subtitle={
                    Number.isNaN(date.getTime())
                      ? null
                      : format(date, "MMM d, yyyy")
                  }
                  value={
                    typeof task.cost_amount === "number" && task.cost_amount > 0
                      ? formatMoney(task.cost_amount)
                      : null
                  }
                  onPress={() => {
                    triggerLight();
                    setSelected(task);
                    setSheetVisible(true);
                  }}
                />
              );
            })
          )}
        </RecordSection>

        <Pressable
          onPress={confirmDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { backgroundColor: colors.fieldFill },
          ]}
          accessibilityRole="button"
        >
          <Text style={[styles.deleteText, { color: colors.error }]}>
            Delete equipment
          </Text>
        </Pressable>
      </ScrollView>

      <EquipmentFormSheet
        visible={editing}
        equipment={item}
        onClose={() => setEditing(false)}
      />
      <RecordEntrySheet
        task={selected}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onDismissed={() => setSelected(null)}
        action={selected ? actionFor(selected) : null}
      />
    </>
  );
}

function ActionButton({
  icon,
  label,
  busy,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  busy?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  return (
    <Pressable
      onPress={() => {
        triggerLight();
        onPress();
      }}
      disabled={busy}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Ionicons name={icon} size={20} color={colors.primary} />
      )}
      <Text style={[styles.actionLabel, { color: colors.primary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.xxl,
  },
  missing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  missingText: {
    ...DesignSystem.typography.body,
  },
  header: {
    alignItems: "center",
    paddingTop: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    ...DesignSystem.typography.title2,
    marginTop: DesignSystem.spacing.md,
    textAlign: "center",
  },
  subtitle: {
    ...DesignSystem.typography.footnote,
    marginTop: 2,
    textAlign: "center",
  },
  warrantyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: DesignSystem.spacing.sm + 2,
    paddingHorizontal: DesignSystem.spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: DesignSystem.borders.radius.round,
  },
  warrantyText: {
    ...DesignSystem.typography.captionSemiBold,
  },
  actions: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.lg,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    minHeight: 58,
    justifyContent: "center",
    paddingVertical: DesignSystem.spacing.sm + 2,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionLabel: {
    ...DesignSystem.typography.captionSemiBold,
  },
  spent: {
    ...DesignSystem.typography.caption,
    fontVariant: ["tabular-nums"],
  },
  deleteButton: {
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  deleteText: {
    ...DesignSystem.typography.bodySemiBold,
  },
});
