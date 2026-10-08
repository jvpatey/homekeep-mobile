import React, { useEffect, useState } from "react";
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
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { HearthSheet } from "../ui/HearthSheet";
import { Button } from "../ui/Button";
import { DesignSystem } from "../../theme/designSystem";
import { DocumentService } from "../../services/DocumentService";
import { upsertHomeDocument } from "../../hooks/useHomeDocuments";
import { useEquipmentIndex } from "../../hooks/useEquipmentIndex";
import {
  DOCUMENT_KINDS,
  DOCUMENT_KIND_ICONS,
  DOCUMENT_KIND_LABELS,
  DocumentKind,
  HomeDocument,
} from "../../types/homeDocument";
import {
  PickedFile,
  promptForAttachment,
} from "../equipment/equipmentAttachments";

type DateField = "issuedOn" | "expiresOn";

interface FormState {
  kind: DocumentKind;
  title: string;
  notes: string;
  equipmentId: string | null;
  issuedOn: Date | null;
  expiresOn: Date | null;
}

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = parseISO(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isoDate(date: Date | null) {
  return date ? format(date, "yyyy-MM-dd") : null;
}

function toForm(
  document: HomeDocument | null,
  defaults?: { kind?: DocumentKind; equipmentId?: string | null }
): FormState {
  return {
    kind: document?.kind ?? defaults?.kind ?? "other",
    title: document?.title ?? "",
    notes: document?.notes ?? "",
    equipmentId: document?.equipment_id ?? defaults?.equipmentId ?? null,
    issuedOn: parseDate(document?.issued_on),
    expiresOn: parseDate(document?.expires_on),
  };
}

const DATE_ROWS: readonly [DateField, string, keyof typeof Ionicons.glyphMap][] =
  [
    ["issuedOn", "Issued or signed", "calendar-outline"],
    ["expiresOn", "Expires or renews", "hourglass-outline"],
  ];

/** Add or edit a vault document, with an optional file and equipment link. */
export function DocumentFormSheet({
  visible,
  document,
  defaultKind,
  defaultEquipmentId,
  onClose,
  onSaved,
}: {
  visible: boolean;
  /** Null to add a new document. */
  document: HomeDocument | null;
  defaultKind?: DocumentKind;
  defaultEquipmentId?: string | null;
  onClose: () => void;
  onSaved?: (document: HomeDocument) => void;
}) {
  const { colors, isDark } = useTheme();
  const { triggerLight, triggerSuccess } = useHaptics();
  const equipment = useEquipmentIndex({ refreshOnFocus: false });
  const [form, setForm] = useState<FormState>(() =>
    toForm(document, { kind: defaultKind, equipmentId: defaultEquipmentId })
  );
  const [pendingFile, setPendingFile] = useState<PickedFile | null>(null);
  const [iosPicker, setIosPicker] = useState<DateField | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setForm(
      toForm(document, { kind: defaultKind, equipmentId: defaultEquipmentId })
    );
    setPendingFile(null);
    setIosPicker(null);
    setSaving(false);
  }, [visible, document, defaultKind, defaultEquipmentId]);

  const set = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const setDateField = (field: DateField, date: Date) => {
    const noon = new Date(date);
    noon.setHours(12, 0, 0, 0);
    set({ [field]: noon } as Partial<FormState>);
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

  const attach = async () => {
    const file = await promptForAttachment("document");
    if (!file) return;
    setPendingFile(file);
    if (!form.title.trim()) {
      set({ title: file.fileName.replace(/\.[a-z0-9]+$/i, "") });
    }
  };

  const save = async () => {
    const title = form.title.trim();
    if (!title || saving) return;
    setSaving(true);
    const input = {
      kind: form.kind,
      title,
      notes: form.notes,
      equipment_id: form.equipmentId,
      issued_on: isoDate(form.issuedOn),
      expires_on: isoDate(form.expiresOn),
    };
    try {
      const result = document
        ? await DocumentService.update(document.id, input)
        : await DocumentService.create(input);
      if (result.error || !result.data) {
        throw new Error(result.error?.message ?? "Please try again.");
      }
      let saved = result.data;
      if (pendingFile) {
        const attached = await DocumentService.attachFile(
          saved,
          pendingFile.uri,
          pendingFile.mime,
          pendingFile.fileName
        );
        if (attached.error || !attached.data) {
          upsertHomeDocument(saved);
          throw new Error(
            `Saved without the file. ${attached.error?.message ?? ""}`.trim()
          );
        }
        saved = attached.data;
      }
      upsertHomeDocument(saved);
      await triggerSuccess();
      onSaved?.(saved);
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

  const fileLabel = pendingFile
    ? pendingFile.fileName
    : document?.storage_path
      ? document.storage_path.split("/").pop() ?? "Attached file"
      : "PDF or photo";
  const hasFile = Boolean(pendingFile || document?.storage_path);

  return (
    <HearthSheet
      visible={visible}
      onClose={onClose}
      title={document ? "Edit document" : "Add a document"}
      maxHeightRatio={0.94}
      footer={
        <Button
          label={
            saving ? "Saving…" : document ? "Save changes" : "Add document"
          }
          onPress={() => void save()}
          disabled={!form.title.trim() || saving}
          loading={saving}
        />
      }
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Label text="Type" first />
        <View style={styles.chipGrid}>
          {DOCUMENT_KINDS.map((kind) => {
            const active = form.kind === kind;
            return (
              <Pressable
                key={kind}
                onPress={() => {
                  triggerLight();
                  set({ kind });
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active
                      ? colors.primary + "1F"
                      : colors.fieldFill,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={DOCUMENT_KIND_LABELS[kind]}
              >
                <Ionicons
                  name={DOCUMENT_KIND_ICONS[kind]}
                  size={14}
                  color={active ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? colors.primary : colors.text },
                  ]}
                >
                  {DOCUMENT_KIND_LABELS[kind]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Field
          label="Title"
          value={form.title}
          onChangeText={(title) => set({ title })}
          placeholder="e.g. Home insurance policy 2026"
          autoCapitalize="sentences"
          autoFocus={!document}
        />

        <Label text="File" />
        <Pressable
          onPress={() => void attach()}
          style={({ pressed }) => [
            styles.group,
            styles.row,
            { backgroundColor: colors.fieldFill, borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={hasFile ? "Replace file" : "Attach file"}
        >
          <Ionicons
            name={hasFile ? "document-attach" : "cloud-upload-outline"}
            size={18}
            color={colors.primary}
          />
          <Text
            style={[
              styles.rowLabel,
              { color: hasFile ? colors.text : colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {fileLabel}
          </Text>
          <Text style={[styles.pillText, { color: colors.primary }]}>
            {hasFile ? "Replace" : "Attach"}
          </Text>
        </Pressable>

        <Label text="Dates" />
        <View
          style={[
            styles.group,
            { backgroundColor: colors.fieldFill, borderColor: colors.border },
          ]}
        >
          {DATE_ROWS.map(([field, label, icon], index) => {
            const value = form[field];
            return (
              <View key={field}>
                <View
                  style={[
                    styles.row,
                    index > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons name={icon} size={18} color={colors.primary} />
                  <Text style={[styles.rowLabel, { color: colors.text }]}>
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
                      styles.pill,
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
                        styles.pillText,
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

        {equipment.items.length > 0 ? (
          <>
            <Label text="Linked equipment" />
            <View style={styles.chipGrid}>
              {[{ id: null, name: "None" }, ...equipment.items].map((item) => {
                const active = form.equipmentId === item.id;
                return (
                  <Pressable
                    key={item.id ?? "none"}
                    onPress={() => {
                      triggerLight();
                      set({ equipmentId: item.id });
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active
                          ? colors.primary + "1F"
                          : colors.fieldFill,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Link to ${item.name}`}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? colors.primary : colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        <Field
          label="Notes"
          value={form.notes}
          onChangeText={(notes) => set({ notes })}
          placeholder="Policy number, agent, inspector, what was flagged…"
          multiline
          style={styles.notes}
        />
      </ScrollView>
    </HearthSheet>
  );
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
  notes: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs + 3,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    ...DesignSystem.typography.smallSemiBold,
  },
  group: {
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    minHeight: 52,
    paddingHorizontal: DesignSystem.spacing.md,
  },
  rowLabel: {
    ...DesignSystem.typography.body,
    flex: 1,
  },
  pill: {
    paddingHorizontal: DesignSystem.spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: DesignSystem.borders.radius.small,
  },
  pillText: {
    ...DesignSystem.typography.bodySemiBold,
    fontVariant: ["tabular-nums"],
  },
});
