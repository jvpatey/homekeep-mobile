import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format, parseISO } from "date-fns";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { useHaptics } from "../../hooks";
import { upsertEquipmentInIndex } from "../../hooks/useEquipmentIndex";
import { EquipmentManualService } from "../../services/EquipmentManualService";
import { MaintenanceService } from "../../services/maintenanceService";
import {
  EQUIPMENT_TYPES,
  EQUIPMENT_TYPE_LABELS,
  EquipmentConsumable,
  EquipmentManual,
  EquipmentType,
  equipmentTypeIcon,
} from "../../types/equipmentManual";
import {
  DEFAULT_CONSUMABLES_BY_TYPE,
  hintsForEquipmentName,
  partitionEquipmentHints,
} from "../../data/equipmentTaskHints";
import {
  buildRoutinePayloadsFromItems,
  MaintenancePlanItemTemplate,
} from "../../data/maintenancePlans";
import { formatRoutineInterval } from "../all-reminders/groupRoutines";
import { DesignSystem } from "../../theme/designSystem";
import { Button } from "../ui/Button";
import { HearthSheet } from "../ui/HearthSheet";
import {
  AttachmentKind,
  attachFile,
  PickedFile,
  promptForAttachment,
} from "./equipmentAttachments";

interface FormState {
  name: string;
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  type: EquipmentType | null;
  purchaseDate: Date | null;
  warrantyDate: Date | null;
  consumables: EquipmentConsumable[];
}

interface HintChoice {
  key: string;
  title: string;
  meta: string;
  create?: MaintenancePlanItemTemplate;
  linkId?: string;
  checked: boolean;
}

type DateField = "purchaseDate" | "warrantyDate";

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = parseISO(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toForm(item: EquipmentManual | null): FormState {
  return {
    name: item?.name ?? "",
    manufacturer: item?.manufacturer ?? "",
    modelNumber: item?.model_number ?? "",
    serialNumber: item?.serial_number ?? "",
    type: item?.equipment_type ?? null,
    purchaseDate: parseDate(item?.purchase_date),
    warrantyDate: parseDate(item?.warranty_expires_on),
    consumables: item?.consumables ?? [],
  };
}

function isoDate(date: Date | null) {
  return date ? format(date, "yyyy-MM-dd") : null;
}

/**
 * Add or edit equipment. New equipment can attach a manual and receipt up
 * front, then offers matching reminders.
 */
export function EquipmentFormSheet({
  visible,
  equipment,
  onClose,
  onSaved,
}: {
  visible: boolean;
  /** Null to add new equipment. */
  equipment: EquipmentManual | null;
  onClose: () => void;
  onSaved?: (item: EquipmentManual, created: boolean) => void;
}) {
  const { colors, isDark } = useTheme();
  const { triggerLight, triggerSuccess } = useHaptics();
  const { createTask, updateTask } = useTasks();
  const [form, setForm] = useState<FormState>(() => toForm(equipment));
  const [pendingFiles, setPendingFiles] = useState<
    Partial<Record<AttachmentKind, PickedFile>>
  >({});
  const [iosPicker, setIosPicker] = useState<DateField | null>(null);
  const [saving, setSaving] = useState(false);
  const [hints, setHints] = useState<HintChoice[] | null>(null);
  const [saved, setSaved] = useState<EquipmentManual | null>(null);

  useEffect(() => {
    if (!visible) return;
    setForm(toForm(equipment));
    setPendingFiles({});
    setIosPicker(null);
    setSaving(false);
    setHints(null);
    setSaved(null);
  }, [visible, equipment]);

  const set = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const suggestions = useMemo(() => {
    const taken = new Set(
      form.consumables.map((item) => item.label.trim().toLowerCase())
    );
    return (DEFAULT_CONSUMABLES_BY_TYPE[form.type ?? "other"] ?? []).filter(
      (item) => !taken.has(item.label.toLowerCase())
    );
  }, [form.consumables, form.type]);

  const selectType = (type: EquipmentType) => {
    triggerLight();
    setForm((prev) => {
      const next = prev.type === type ? null : type;
      const prevLabel = prev.type ? EQUIPMENT_TYPE_LABELS[prev.type] : "";
      const nameIsDefault = !prev.name.trim() || prev.name === prevLabel;
      return {
        ...prev,
        type: next,
        name:
          nameIsDefault && next && next !== "other"
            ? EQUIPMENT_TYPE_LABELS[next]
            : nameIsDefault && !next
              ? ""
              : prev.name,
      };
    });
  };

  const addConsumable = (seed?: Omit<EquipmentConsumable, "id">) => {
    triggerLight();
    setForm((prev) => ({
      ...prev,
      consumables: [
        ...prev.consumables,
        { id: Crypto.randomUUID(), label: "", ...seed },
      ],
    }));
  };

  const updateConsumable = (id: string, patch: Partial<EquipmentConsumable>) =>
    setForm((prev) => ({
      ...prev,
      consumables: prev.consumables.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));

  const removeConsumable = (id: string) => {
    triggerLight();
    setForm((prev) => ({
      ...prev,
      consumables: prev.consumables.filter((item) => item.id !== id),
    }));
  };

  const editDate = (field: DateField) => {
    triggerLight();
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: form[field] ?? new Date(),
        mode: "date",
        onChange: (event, date) => {
          if (event.type === "set" && date) setDateField(field, date);
        },
      });
      return;
    }
    setIosPicker((current) => (current === field ? null : field));
  };

  const setDateField = (field: DateField, date: Date) => {
    const noon = new Date(date);
    noon.setHours(12, 0, 0, 0);
    set({ [field]: noon } as Partial<FormState>);
  };

  const attach = async (kind: AttachmentKind) => {
    const file = await promptForAttachment(kind);
    if (file) setPendingFiles((prev) => ({ ...prev, [kind]: file }));
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name || saving) return;
    setSaving(true);
    const consumables = form.consumables
      .map((item) => ({
        ...item,
        label: item.label.trim(),
        size: item.size?.trim() || null,
        partNumber: item.partNumber?.trim() || null,
      }))
      .filter((item) => item.label);
    const payload = {
      name,
      manufacturer: form.manufacturer,
      model_number: form.modelNumber,
      serial_number: form.serialNumber,
      equipment_type: form.type,
      purchase_date: isoDate(form.purchaseDate),
      warranty_expires_on: isoDate(form.warrantyDate),
      consumables,
    };

    try {
      const result = equipment
        ? await EquipmentManualService.updateEquipmentManual(
            equipment.id,
            payload
          )
        : await EquipmentManualService.createEquipmentManual(payload);
      if (result.error || !result.data) {
        throw new Error(result.error?.message ?? "Please try again.");
      }
      let item = result.data;
      for (const kind of ["manual", "receipt"] as const) {
        const file = pendingFiles[kind];
        if (file) item = await attachFile(item, kind, file);
      }
      upsertEquipmentInIndex(item);
      await triggerSuccess();

      if (!equipment) {
        const choices = await reminderChoices(item);
        if (choices.length > 0) {
          setSaved(item);
          setHints(choices);
          setSaving(false);
          return;
        }
      }
      onSaved?.(item, !equipment);
      onClose();
    } catch (error) {
      Alert.alert(
        "Couldn't save",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const applyHints = async () => {
    if (!saved || !hints) return;
    setSaving(true);
    try {
      for (const choice of hints) {
        if (!choice.checked) continue;
        if (choice.create) {
          const [payload] = buildRoutinePayloadsFromItems([choice.create]);
          const result = await createTask({
            ...payload,
            equipment_id: saved.id,
          });
          if (!result.success) throw new Error(result.error ?? "");
        } else if (choice.linkId) {
          const result = await updateTask(choice.linkId, {
            equipment_id: saved.id,
          });
          if (!result.success) throw new Error(result.error ?? "");
        }
      }
      await triggerSuccess();
      onSaved?.(saved, true);
      onClose();
    } catch (error) {
      Alert.alert(
        "Couldn't add reminders",
        error instanceof Error && error.message
          ? error.message
          : "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const skipHints = () => {
    if (saved) onSaved?.(saved, true);
    onClose();
  };

  if (hints && saved) {
    const count = hints.filter((choice) => choice.checked).length;
    return (
      <HearthSheet
        visible={visible}
        onClose={skipHints}
        title="Add reminders?"
        footer={
          <View style={styles.footerStack}>
            <Button
              label={
                count === 0
                  ? "Choose at least one"
                  : `Add ${count} reminder${count === 1 ? "" : "s"}`
              }
              onPress={() => void applyHints()}
              disabled={count === 0 || saving}
              loading={saving}
            />
            <Button label="Not now" variant="ghost" onPress={skipHints} />
          </View>
        }
      >
        <Text style={[styles.lede, { color: colors.textSecondary }]}>
          These usually go with {saved.name}. We'll link them so its parts and
          history show up on each task.
        </Text>
        {hints.map((choice) => (
          <Pressable
            key={choice.key}
            onPress={() => {
              triggerLight();
              setHints((prev) =>
                (prev ?? []).map((item) =>
                  item.key === choice.key
                    ? { ...item, checked: !item.checked }
                    : item
                )
              );
            }}
            style={[
              styles.hintRow,
              {
                borderColor: choice.checked ? colors.primary : colors.border,
                backgroundColor: choice.checked
                  ? colors.primary + "12"
                  : colors.fieldFill,
              },
            ]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: choice.checked }}
            accessibilityLabel={choice.title}
          >
            <Ionicons
              name={choice.checked ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={choice.checked ? colors.primary : colors.textSecondary}
            />
            <View style={styles.hintText}>
              <Text style={[styles.hintTitle, { color: colors.text }]}>
                {choice.title}
              </Text>
              <Text style={[styles.hintMeta, { color: colors.textSecondary }]}>
                {choice.meta}
              </Text>
            </View>
          </Pressable>
        ))}
      </HearthSheet>
    );
  }

  return (
    <HearthSheet
      visible={visible}
      onClose={onClose}
      title={equipment ? "Edit equipment" : "Add equipment"}
      maxHeightRatio={0.94}
      footer={
        <Button
          label={
            saving ? "Saving…" : equipment ? "Save changes" : "Add equipment"
          }
          onPress={() => void save()}
          disabled={!form.name.trim() || saving}
          loading={saving}
        />
      }
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Label text="What is it?" first />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeRow}
          style={styles.typeScroller}
        >
          {EQUIPMENT_TYPES.map((type) => {
            const active = form.type === type;
            return (
              <Pressable
                key={type}
                onPress={() => selectType(type)}
                style={[
                  styles.typeTile,
                  {
                    backgroundColor: active
                      ? colors.primary + "18"
                      : colors.fieldFill,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={EQUIPMENT_TYPE_LABELS[type]}
              >
                <Ionicons
                  name={equipmentTypeIcon(type)}
                  size={22}
                  color={active ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.typeText,
                    { color: active ? colors.primary : colors.text },
                  ]}
                  numberOfLines={2}
                >
                  {EQUIPMENT_TYPE_LABELS[type]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Field
          label="Name"
          value={form.name}
          onChangeText={(name) => set({ name })}
          placeholder="e.g. Basement furnace"
          autoCapitalize="sentences"
        />
        <Field
          label="Manufacturer"
          value={form.manufacturer}
          onChangeText={(manufacturer) => set({ manufacturer })}
          placeholder="e.g. Carrier"
          autoCapitalize="words"
        />
        <View style={styles.pair}>
          <View style={styles.pairItem}>
            <Field
              label="Model"
              value={form.modelNumber}
              onChangeText={(modelNumber) => set({ modelNumber })}
              placeholder="Optional"
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
          <View style={styles.pairItem}>
            <Field
              label="Serial"
              value={form.serialNumber}
              onChangeText={(serialNumber) => set({ serialNumber })}
              placeholder="Optional"
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
        </View>
        <Text style={[styles.help, { color: colors.textSecondary }]}>
          Usually on a sticker inside the door or on the back panel.
        </Text>

        <Label text="Dates" />
        <View
          style={[
            styles.group,
            { backgroundColor: colors.fieldFill, borderColor: colors.border },
          ]}
        >
          {(
            [
              ["purchaseDate", "Purchased", "bag-check-outline"],
              ["warrantyDate", "Warranty until", "shield-checkmark-outline"],
            ] as const
          ).map(([field, label, icon], index) => {
            const value = form[field];
            return (
              <View key={field}>
                <View
                  style={[
                    styles.dateRow,
                    index > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons name={icon} size={18} color={colors.primary} />
                  <Text style={[styles.dateLabel, { color: colors.text }]}>
                    {label}
                  </Text>
                  {value ? (
                    <Pressable
                      onPress={() =>
                        set({ [field]: null } as Partial<FormState>)
                      }
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Clear ${label.toLowerCase()} date`}
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => editDate(field)}
                    style={[
                      styles.datePill,
                      {
                        backgroundColor:
                          iosPicker === field
                            ? colors.primary + "18"
                            : colors.surface,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${label}: ${
                      value ? format(value, "MMMM d, yyyy") : "not set"
                    }`}
                  >
                    <Text
                      style={[
                        styles.datePillText,
                        { color: value ? colors.text : colors.primary },
                      ]}
                    >
                      {value ? format(value, "MMM d, yyyy") : "Add"}
                    </Text>
                  </Pressable>
                </View>
                {Platform.OS === "ios" && iosPicker === field ? (
                  <DateTimePicker
                    value={value ?? new Date()}
                    mode="date"
                    display="inline"
                    accentColor={colors.primary}
                    themeVariant={isDark ? "dark" : "light"}
                    onChange={(_event: DateTimePickerEvent, date?: Date) => {
                      if (date) setDateField(field, date);
                    }}
                  />
                ) : null}
              </View>
            );
          })}
        </View>

        <Label text="Parts and consumables" />
        <Text
          style={[styles.help, styles.helpTop, { color: colors.textSecondary }]}
        >
          Filter sizes and part numbers show up on the tasks that need them.
        </Text>
        {form.consumables.map((item) => (
          <View
            key={item.id}
            style={[
              styles.partCard,
              { backgroundColor: colors.fieldFill, borderColor: colors.border },
            ]}
          >
            <View style={styles.partHeader}>
              <TextInput
                value={item.label}
                onChangeText={(label) => updateConsumable(item.id, { label })}
                placeholder="Part name, e.g. Air filter"
                placeholderTextColor={colors.textSecondary}
                style={[styles.partLabel, { color: colors.text }]}
                accessibilityLabel="Part name"
                autoFocus={!item.label}
              />
              <Pressable
                onPress={() => removeConsumable(item.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.label || "part"}`}
              >
                <Ionicons name="remove-circle" size={22} color={colors.error} />
              </Pressable>
            </View>
            <View style={styles.partFields}>
              <TextInput
                value={item.size ?? ""}
                onChangeText={(size) => updateConsumable(item.id, { size })}
                placeholder="Size"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.partInput,
                  { color: colors.text, backgroundColor: colors.surface },
                ]}
                accessibilityLabel="Size"
                autoCorrect={false}
              />
              <TextInput
                value={item.partNumber ?? ""}
                onChangeText={(partNumber) =>
                  updateConsumable(item.id, { partNumber })
                }
                placeholder="Part number"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.partInput,
                  { color: colors.text, backgroundColor: colors.surface },
                ]}
                accessibilityLabel="Part number"
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
          </View>
        ))}
        <View style={styles.suggestionRow}>
          {suggestions.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => addConsumable(item)}
              style={[
                styles.suggestion,
                { borderColor: colors.primary + "55" },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Add ${item.label}`}
            >
              <Ionicons name="add" size={14} color={colors.primary} />
              <Text style={[styles.suggestionText, { color: colors.primary }]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => addConsumable()}
            style={[styles.suggestion, { borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Add a part"
          >
            <Ionicons name="add" size={14} color={colors.text} />
            <Text style={[styles.suggestionText, { color: colors.text }]}>
              {suggestions.length > 0 ? "Other" : "Add a part"}
            </Text>
          </Pressable>
        </View>

        {!equipment ? (
          <>
            <Label text="Documents" />
            <View
              style={[
                styles.group,
                {
                  backgroundColor: colors.fieldFill,
                  borderColor: colors.border,
                },
              ]}
            >
              {(
                [
                  ["manual", "Manual", "document-text-outline"],
                  ["receipt", "Receipt", "receipt-outline"],
                ] as const
              ).map(([kind, label, icon], index) => {
                const file = pendingFiles[kind];
                return (
                  <Pressable
                    key={kind}
                    onPress={() => void attach(kind)}
                    style={({ pressed }) => [
                      styles.dateRow,
                      index > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: colors.border,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={
                      file
                        ? `Replace ${label.toLowerCase()}`
                        : `Attach ${label.toLowerCase()}`
                    }
                  >
                    <Ionicons name={icon} size={18} color={colors.primary} />
                    <Text
                      style={[styles.dateLabel, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {file ? file.fileName : label}
                    </Text>
                    <Text
                      style={[styles.datePillText, { color: colors.primary }]}
                    >
                      {file ? "Replace" : "Attach"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}
      </ScrollView>
    </HearthSheet>
  );
}

async function reminderChoices(item: EquipmentManual): Promise<HintChoice[]> {
  const hints = hintsForEquipmentName(item.name, item.equipment_type);
  if (hints.length === 0) return [];
  const { data: routines } = await MaintenanceService.getMaintenanceRoutines({
    is_active: true,
  });
  const { toLink, toCreate } = partitionEquipmentHints(hints, routines ?? []);
  return [
    ...toCreate.map((template) => ({
      key: `create-${template.title}`,
      title: template.title,
      meta: `New reminder · ${formatRoutineInterval(template.interval_days)}`,
      create: template,
      checked: true,
    })),
    ...toLink.map((routine) => ({
      key: `link-${routine.id}`,
      title: routine.title,
      meta: "Already on your schedule · link it",
      linkId: routine.id,
      checked: true,
    })),
  ];
}

function Label({ text, first }: { text: string; first?: boolean }) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        styles.label,
        { color: colors.textSecondary },
        first && { marginTop: 0 },
      ]}
    >
      {text}
    </Text>
  );
}

function Field({ label, style, ...input }: TextInputProps & { label: string }) {
  const { colors } = useTheme();
  return (
    <>
      <Label text={label} />
      <TextInput
        {...input}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={label}
        style={[
          styles.input,
          {
            backgroundColor: colors.fieldFill,
            borderColor: colors.border,
            color: colors.text,
          },
          style,
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: DesignSystem.spacing.md,
  },
  label: {
    ...DesignSystem.typography.captionSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: DesignSystem.borders.radius.medium,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 4,
    ...DesignSystem.typography.body,
  },
  help: {
    ...DesignSystem.typography.caption,
    marginTop: DesignSystem.spacing.xs + 2,
  },
  helpTop: {
    marginTop: -DesignSystem.spacing.xs,
    marginBottom: DesignSystem.spacing.sm,
  },
  typeScroller: {
    marginHorizontal: -DesignSystem.spacing.lg,
  },
  typeRow: {
    gap: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  typeTile: {
    width: 84,
    minHeight: 76,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: DesignSystem.spacing.xs,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  typeText: {
    ...DesignSystem.typography.captionSemiBold,
    textAlign: "center",
  },
  pair: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
  },
  pairItem: {
    flex: 1,
  },
  group: {
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    minHeight: 52,
    paddingHorizontal: DesignSystem.spacing.md,
  },
  dateLabel: {
    ...DesignSystem.typography.body,
    flex: 1,
  },
  datePill: {
    paddingHorizontal: DesignSystem.spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: DesignSystem.borders.radius.small,
  },
  datePillText: {
    ...DesignSystem.typography.bodySemiBold,
    fontVariant: ["tabular-nums"],
  },
  partCard: {
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    padding: DesignSystem.spacing.sm + 2,
    marginBottom: DesignSystem.spacing.sm,
    gap: DesignSystem.spacing.sm,
  },
  partHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  partLabel: {
    ...DesignSystem.typography.bodySemiBold,
    flex: 1,
    paddingVertical: 4,
  },
  partFields: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
  },
  partInput: {
    ...DesignSystem.typography.footnote,
    flex: 1,
    borderRadius: DesignSystem.borders.radius.small,
    paddingHorizontal: DesignSystem.spacing.sm + 2,
    paddingVertical: DesignSystem.spacing.sm,
  },
  suggestionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: DesignSystem.spacing.sm + 4,
    paddingVertical: DesignSystem.spacing.xs + 3,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  suggestionText: {
    ...DesignSystem.typography.smallSemiBold,
  },
  footerStack: {
    gap: DesignSystem.spacing.xs,
  },
  lede: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
    marginBottom: DesignSystem.spacing.md,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm + 2,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 1,
    marginBottom: DesignSystem.spacing.sm,
  },
  hintText: {
    flex: 1,
  },
  hintTitle: {
    ...DesignSystem.typography.bodySemiBold,
  },
  hintMeta: {
    ...DesignSystem.typography.caption,
    marginTop: 2,
  },
});
