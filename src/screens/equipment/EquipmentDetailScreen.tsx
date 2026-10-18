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
import * as WebBrowser from "expo-web-browser";
import { differenceInMonths, format, parseISO } from "date-fns";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { useQuickActions } from "../../context/QuickActionsContext";
import { useHaptics } from "../../hooks";
import { useOverlayInsets } from "../../hooks/useOverlayInsets";
import { useCurrency } from "../../hooks/useCurrency";
import { useRecordData } from "../../hooks/useRecordData";
import {
  removeEquipmentFromIndex,
  upsertEquipmentInIndex,
  useEquipmentIndex,
} from "../../hooks/useEquipmentIndex";
import { EquipmentManualService } from "../../services/EquipmentManualService";
import {
  HeaderIconButton,
  HearthSurfaceCard,
  IconChip,
  Pill,
  QuickAction,
} from "../../components/ui";
import { RecordRow, RecordSection } from "../../components/record/RecordList";
import { RecordEntrySheet } from "../../components/record/RecordEntrySheet";
import { useRecordEntryActions } from "../../components/record/useRecordEntryActions";
import { EquipmentFormSheet } from "../../components/equipment/EquipmentFormSheet";
import { AssistantSheet } from "../../components/assistant/AssistantSheet";
import { DocumentFormSheet } from "../../components/documents/DocumentFormSheet";
import { useHomeDocuments } from "../../hooks/useHomeDocuments";
import {
  dismissEquipmentRecall,
  useEquipmentRecalls,
} from "../../hooks/useEquipmentRecalls";
import {
  EquipmentRecall,
  RECALL_SOURCE_AGENCY,
  RECALL_SOURCE_SITE,
} from "../../types/equipmentRecall";
import {
  DOCUMENT_KIND_ICONS,
  DOCUMENT_KIND_LABELS,
  HomeDocument,
} from "../../types/homeDocument";
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
  const overlay = useOverlayInsets({ translucentHeader: false });
  const { triggerLight, triggerMedium, triggerSuccess } = useHaptics();
  const { format: formatMoney } = useCurrency();
  const { tasks } = useTasks();
  const { openCreateTask, openLogRepair } = useQuickActions();
  const { byId, loaded } = useEquipmentIndex({ refreshOnFocus: false });
  const { completions } = useRecordData();
  const actionFor = useRecordEntryActions();
  const documents = usePlusFeature("documents");
  const assistant = usePlusFeature("assistant");
  const [asking, setAsking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busyKind, setBusyKind] = useState<AttachmentKind | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selected, setSelected] = useState<MaintenanceTask | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const { byEquipmentId: documentsByEquipment } = useHomeDocuments({
    refreshOnFocus: false,
  });
  const [documentForm, setDocumentForm] = useState<{
    document: HomeDocument | null;
  } | null>(null);
  const { byEquipmentId: recallsByEquipment } = useEquipmentRecalls();

  const equipmentId = route.params.equipmentId;
  const item = byId.get(equipmentId) ?? null;
  const linkedDocuments = documentsByEquipment.get(equipmentId) ?? [];
  const recalls = recallsByEquipment.get(equipmentId) ?? [];

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
        (task) => task.equipment_id === equipmentId && !task.is_completed
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
      <View
        style={[
          styles.missing,
          { backgroundColor: colors.background, paddingBottom: overlay.bottom },
        ]}
      >
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

  const openLinkedDocument = async (document: HomeDocument | null) => {
    triggerLight();
    if (!(await documents.unlock())) return;
    if (document?.storage_path) {
      showActionMenu({
        title: document.title,
        options: [
          {
            label: "Open file",
            icon: "open-outline",
            onPress: () =>
              void openStoredFile(document.storage_path, "document"),
          },
          {
            label: "Edit",
            icon: "create-outline",
            onPress: () => setDocumentForm({ document }),
          },
        ],
      });
      return;
    }
    setDocumentForm({ document });
  };

  const openRecall = (recall: EquipmentRecall) => {
    triggerLight();
    if (!recall.url) return;
    void WebBrowser.openBrowserAsync(recall.url);
  };

  const confirmDismissRecall = (recall: EquipmentRecall) => {
    triggerLight();
    Alert.alert(
      "Dismiss this recall?",
      "Do this once you've checked your unit or had it fixed. It won't come back.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Dismiss",
          onPress: async () => {
            if (!(await dismissEquipmentRecall(recall))) {
              Alert.alert("Couldn't dismiss", "Please try again.");
            }
          },
        },
      ]
    );
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
        <HearthSurfaceCard
          emphasis="hero"
          tint={tint}
          style={styles.hero}
          containerStyle={styles.heroContainer}
        >
          <IconChip
            icon={equipmentTypeIcon(item.equipment_type)}
            tint={tint}
            size={64}
            shape="rounded"
          />
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
          {warranty.warrantyStatus !== "none" ? (
            <Pill
              icon={
                warranty.warrantyStatus === "expired"
                  ? "shield-outline"
                  : "shield-checkmark"
              }
              label={
                warranty.warrantyStatus === "expired"
                  ? `Warranty ended ${warranty.warrantyExpiresLabel}`
                  : `Under warranty until ${warranty.warrantyExpiresLabel}`
              }
              tone={
                warranty.warrantyStatus === "ok"
                  ? "success"
                  : warranty.warrantyStatus === "expiring_soon"
                    ? "warning"
                    : "neutral"
              }
              style={styles.warrantyPill}
            />
          ) : null}
        </HearthSurfaceCard>

        {recalls.map((recall) => (
          <RecallBanner
            key={recall.id}
            recall={recall}
            onOpen={() => openRecall(recall)}
            onDismiss={() => confirmDismissRecall(recall)}
          />
        ))}

        <View style={styles.actions}>
          <QuickAction
            icon="hammer"
            label="Log repair"
            onPress={() => void openLogRepair({ equipmentId: item.id })}
          />
          <QuickAction
            icon="alarm"
            label="Reminder"
            onPress={() => void openCreateTask({ equipmentId: item.id })}
          />
          <QuickAction
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
            tint={colors.textSecondary}
            title="Manufacturer"
            value={item.manufacturer || "Add"}
            onPress={item.manufacturer ? undefined : () => setEditing(true)}
          />
          <RecordRow
            icon="barcode-outline"
            tint={colors.textSecondary}
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
            tint={colors.textSecondary}
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
            tint={colors.textSecondary}
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
                tint={colors.textSecondary}
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
          <RecordRow
            icon="sparkles"
            tint={colors.primary}
            title={`Ask Keeper about this ${item.equipment_type && item.equipment_type !== "other" ? EQUIPMENT_TYPE_LABELS[item.equipment_type].toLowerCase() : "equipment"}`}
            subtitle="HomeKeep AI · parts, upkeep, and what's been done"
            locked={assistant.locked}
            onPress={() => {
              triggerLight();
              setAsking(true);
            }}
          />
        </RecordSection>

        <RecordSection title="Documents">
          <RecordRow
            icon="document-text-outline"
            tint={colors.textSecondary}
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
            tint={colors.textSecondary}
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
          {linkedDocuments.map((document) => (
            <RecordRow
              key={document.id}
              icon={DOCUMENT_KIND_ICONS[document.kind]}
              tint={colors.textSecondary}
              title={document.title}
              subtitle={DOCUMENT_KIND_LABELS[document.kind]}
              value={document.storage_path ? "On file" : null}
              locked={documents.locked}
              onPress={() => void openLinkedDocument(document)}
            />
          ))}
          <RecordRow
            icon="add"
            tint={colors.primary}
            title="Add a warranty or other document"
            locked={documents.locked}
            onPress={() => void openLinkedDocument(null)}
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
                  tint={
                    isRepairRoutine(task) ? colors.textSecondary : colors.success
                  }
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
      <AssistantSheet
        visible={asking}
        onClose={() => setAsking(false)}
        equipment={{ id: item.id, name: item.name }}
      />
      <DocumentFormSheet
        visible={documentForm !== null}
        document={documentForm?.document ?? null}
        defaultKind="warranty"
        defaultEquipmentId={item.id}
        onClose={() => setDocumentForm(null)}
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

function RecallBanner({
  recall,
  onOpen,
  onDismiss,
}: {
  recall: EquipmentRecall;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const { colors } = useTheme();
  const date = parseDay(recall.recall_date);
  const source = recall.source === "health_canada" ? "health_canada" : "cpsc";
  const agency = RECALL_SOURCE_AGENCY[source];
  const meta = [
    `${agency} recall`,
    date ? format(date, "MMM d, yyyy") : null,
    recall.matched_on === "name" ? "Possible match" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View accessibilityRole="alert" style={styles.recallContainer}>
      <HearthSurfaceCard
        emphasis="tinted"
        tint={colors.error}
        style={styles.recall}
      >
        <View style={styles.recallHeader}>
          <Ionicons name="warning" size={18} color={colors.error} />
          <Text style={[styles.recallMeta, { color: colors.error }]}>{meta}</Text>
        </View>
        <Text style={[styles.recallTitle, { color: colors.text }]}>
          {recall.title}
        </Text>
        {recall.hazard ? (
          <Text style={[styles.recallBody, { color: colors.textSecondary }]}>
            {recall.hazard}
          </Text>
        ) : null}
        {recall.remedy ? (
          <Text style={[styles.recallBody, { color: colors.textSecondary }]}>
            Remedy: {recall.remedy}
          </Text>
        ) : null}
        {recall.matched_on === "name" ? (
          <Text style={[styles.recallBody, { color: colors.textSecondary }]}>
            Matched on the name, not the model number. Check the recall's model
            list against your unit.
          </Text>
        ) : null}
        <View style={styles.recallActions}>
          {recall.url ? (
            <Pressable
              onPress={onOpen}
              style={({ pressed }) => [
                styles.recallButton,
                { backgroundColor: colors.error, opacity: pressed ? 0.8 : 1 },
              ]}
              accessibilityRole="link"
            >
              <Text style={styles.recallButtonText}>View on {RECALL_SOURCE_SITE[source]}</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [
              styles.recallButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.recallDismissText, { color: colors.error }]}>
              Dismiss
            </Text>
          </Pressable>
        </View>
      </HearthSurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.sm,
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
  heroContainer: {
    marginBottom: DesignSystem.spacing.lg,
  },
  hero: {
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.md,
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
    alignSelf: "center",
    maxWidth: "100%",
    marginTop: DesignSystem.spacing.sm + 2,
  },
  recallContainer: {
    marginBottom: DesignSystem.spacing.md,
  },
  recall: {
    padding: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.xs,
  },
  recallHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recallMeta: {
    ...DesignSystem.typography.captionSemiBold,
  },
  recallTitle: {
    ...DesignSystem.typography.bodySemiBold,
  },
  recallBody: {
    ...DesignSystem.typography.footnote,
  },
  recallActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.xs,
  },
  recallButton: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.round,
  },
  recallButtonText: {
    ...DesignSystem.typography.smallSemiBold,
    color: "#FFFFFF",
  },
  recallDismissText: {
    ...DesignSystem.typography.smallSemiBold,
  },
  actions: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.lg,
  },
  spent: {
    ...DesignSystem.typography.caption,
    fontVariant: ["tabular-nums"],
  },
  deleteButton: {
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.xlarge,
    borderWidth: StyleSheet.hairlineWidth,
  },
  deleteText: {
    ...DesignSystem.typography.bodySemiBold,
  },
});
