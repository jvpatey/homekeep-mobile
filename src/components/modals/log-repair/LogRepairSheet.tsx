import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import * as Crypto from "expo-crypto";
import { format, isSameDay, startOfDay, subDays } from "date-fns";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useHaptics } from "../../../hooks";
import { useEquipmentIndex } from "../../../hooks/useEquipmentIndex";
import { HearthSheet } from "../../ui/HearthSheet";
import { Button } from "../../ui/Button";
import { DesignSystem } from "../../../theme/designSystem";
import {
  CompletionExtras,
  HOME_MAINTENANCE_CATEGORIES,
  MaintenanceCategory,
} from "../../../types/maintenance";
import {
  categoryForEquipmentType,
  equipmentTypeIcon,
} from "../../../types/equipmentManual";
import { RecordDetailsFields } from "../../record/RecordDetailsFields";
import {
  EMPTY_RECORD_DETAILS,
  RecordDetailsValue,
  recordDetailsToExtras,
  uploadRecordPhoto,
} from "../../record/recordDetails";
import { guessRepairCategory } from "../../../utils/guessRepairCategory";

const CATEGORY_KEYS = Object.keys(
  HOME_MAINTENANCE_CATEGORIES
) as MaintenanceCategory[];

export interface LogRepairDraft {
  title: string;
  category: MaintenanceCategory;
  completedOn: Date;
  equipmentId: string | null;
  extras: CompletionExtras;
}

export interface LogRepairSheetProps {
  visible: boolean;
  initialEquipmentId?: string | null;
  /** Renders the pro picker when "Hired a pro" is chosen. */
  renderProSlot?: (
    value: RecordDetailsValue,
    onChange: (next: RecordDetailsValue) => void
  ) => React.ReactNode;
  onClose: () => void;
  onDismissed?: () => void;
  /** Persist the repair; resolve false to keep the sheet open. */
  onSubmit: (draft: LogRepairDraft) => Promise<boolean>;
}

export function LogRepairSheet({
  visible,
  initialEquipmentId = null,
  renderProSlot,
  onClose,
  onDismissed,
  onSubmit,
}: LogRepairSheetProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { triggerLight } = useHaptics();
  const equipment = useEquipmentIndex();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<MaintenanceCategory>("GENERAL");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [date, setDate] = useState(() => new Date());
  const [showIosPicker, setShowIosPicker] = useState(false);
  const [equipmentId, setEquipmentId] = useState<string | null>(
    initialEquipmentId
  );
  const [details, setDetails] =
    useState<RecordDetailsValue>(EMPTY_RECORD_DETAILS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle("");
    setCategory("GENERAL");
    setCategoryTouched(false);
    setDate(new Date());
    setShowIosPicker(false);
    setEquipmentId(initialEquipmentId);
    setDetails(EMPTY_RECORD_DETAILS);
    setSaving(false);
  }, [visible, initialEquipmentId]);

  const selectedEquipment = useMemo(
    () => equipment.items.find((item) => item.id === equipmentId) ?? null,
    [equipment.items, equipmentId]
  );

  useEffect(() => {
    if (categoryTouched) return;
    const guess = guessRepairCategory(title);
    if (guess) {
      setCategory(guess);
    } else if (selectedEquipment) {
      setCategory(categoryForEquipmentType(selectedEquipment.equipment_type));
    }
  }, [title, selectedEquipment, categoryTouched]);

  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);
  const dateMode: "today" | "yesterday" | "custom" = isSameDay(date, today)
    ? "today"
    : isSameDay(date, yesterday)
      ? "yesterday"
      : "custom";

  const pickCustomDate = () => {
    triggerLight();
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: date,
        mode: "date",
        maximumDate: new Date(),
        onChange: (event, next) => {
          if (event.type === "set" && next) setDate(next);
        },
      });
      return;
    }
    setShowIosPicker((open) => !open);
  };

  const canSave = title.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      let photoPath: string | null = null;
      if (details.photoUri && user) {
        photoPath = await uploadRecordPhoto(
          user.id,
          Crypto.randomUUID(),
          details.photoUri
        );
        if (!photoPath) {
          Alert.alert(
            "Photo didn't upload",
            "The repair will still be saved without it."
          );
        }
      }
      const completedOn = new Date(date);
      if (!isSameDay(completedOn, new Date()))
        completedOn.setHours(12, 0, 0, 0);
      const ok = await onSubmit({
        title: title.trim(),
        category,
        completedOn,
        equipmentId,
        extras: recordDetailsToExtras(details, photoPath),
      });
      if (!ok) setSaving(false);
    } catch {
      setSaving(false);
      Alert.alert("Couldn't save the repair", "Please try again.");
    }
  };

  const fieldStyle = {
    backgroundColor: colors.fieldFill,
    borderColor: colors.border,
    color: colors.text,
  };

  return (
    <HearthSheet
      visible={visible}
      onClose={onClose}
      onDismissed={onDismissed}
      title="Log a repair"
      maxHeightRatio={0.94}
      footer={
        <Button
          label={saving ? "Saving…" : "Save repair"}
          onPress={() => void handleSave()}
          disabled={!canSave}
          loading={saving}
        />
      }
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          What was fixed?
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Replaced kitchen faucet cartridge"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, fieldStyle]}
          autoCapitalize="sentences"
          autoFocus
          returnKeyType="done"
          maxLength={120}
          editable={!saving}
          accessibilityLabel="What was fixed"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Category
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.chipScroller}
          contentContainerStyle={styles.chipRow}
        >
          {CATEGORY_KEYS.map((key) => {
            const meta =
              HOME_MAINTENANCE_CATEGORIES[
                key as keyof typeof HOME_MAINTENANCE_CATEGORIES
              ];
            const active = key === category;
            return (
              <Chip
                key={key}
                label={meta.displayName}
                icon={meta.icon as keyof typeof Ionicons.glyphMap}
                active={active}
                onPress={() => {
                  triggerLight();
                  setCategory(key);
                  setCategoryTouched(true);
                }}
              />
            );
          })}
        </ScrollView>

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          When
        </Text>
        <View style={styles.dateRow}>
          <Chip
            label="Today"
            active={dateMode === "today"}
            onPress={() => {
              triggerLight();
              setDate(new Date());
              setShowIosPicker(false);
            }}
          />
          <Chip
            label="Yesterday"
            active={dateMode === "yesterday"}
            onPress={() => {
              triggerLight();
              setDate(yesterday);
              setShowIosPicker(false);
            }}
          />
          <Chip
            label={
              dateMode === "custom" ? format(date, "MMM d, yyyy") : "Earlier…"
            }
            icon="calendar-outline"
            active={dateMode === "custom"}
            onPress={pickCustomDate}
          />
        </View>
        {showIosPicker && Platform.OS === "ios" ? (
          <DateTimePicker
            value={date}
            mode="date"
            display="inline"
            maximumDate={new Date()}
            accentColor={colors.primary}
            onChange={(_event, next) => {
              if (next) setDate(next);
            }}
          />
        ) : null}

        {equipment.items.length > 0 ? (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Equipment (optional)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.chipScroller}
              contentContainerStyle={styles.chipRow}
            >
              {equipment.items.map((item) => (
                <Chip
                  key={item.id}
                  label={item.name}
                  icon={equipmentTypeIcon(item.equipment_type)}
                  active={item.id === equipmentId}
                  onPress={() => {
                    triggerLight();
                    setEquipmentId((prev) =>
                      prev === item.id ? null : item.id
                    );
                  }}
                />
              ))}
            </ScrollView>
          </>
        ) : null}

        <RecordDetailsFields
          value={details}
          onChange={setDetails}
          disabled={saving}
          notePlaceholder="Parts used, what went wrong, warranty on the work…"
          proSlot={renderProSlot?.(details, setDetails)}
        />
      </ScrollView>
    </HearthSheet>
  );
}

function Chip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary + "18" : colors.fieldFill,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={15}
          color={active ? colors.primary : colors.textSecondary}
        />
      ) : null}
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.primary : colors.text },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
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
  chipScroller: {
    marginHorizontal: -DesignSystem.spacing.lg,
    flexGrow: 0,
  },
  chipRow: {
    paddingHorizontal: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.sm,
  },
  dateRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 220,
  },
  chipText: {
    ...DesignSystem.typography.smallSemiBold,
  },
});
