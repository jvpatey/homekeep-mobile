import React, { useEffect, useState } from "react";
import {
  Alert,
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
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { Button } from "../ui/Button";
import { HearthSheet } from "../ui/HearthSheet";
import {
  isLightHex,
  normalizeHex,
  PAINT_FINISHES,
  PAINT_FINISH_LABELS,
  PAINT_PALETTE,
  PaintColor,
  PaintFinish,
} from "../../types/homeNotes";

const ROOM_SUGGESTIONS = [
  "Living room",
  "Kitchen",
  "Primary bedroom",
  "Bathroom",
  "Hallway",
  "Trim",
  "Ceilings",
  "Exterior",
  "Front door",
];

const BRAND_SUGGESTIONS = [
  "Sherwin-Williams",
  "Benjamin Moore",
  "Behr",
  "Valspar",
  "Farrow & Ball",
];

interface FormState {
  room: string;
  brand: string;
  colorName: string;
  colorCode: string;
  finish: PaintFinish | null;
  hexInput: string;
}

function toForm(paint: PaintColor | null): FormState {
  return {
    room: paint?.room ?? "",
    brand: paint?.brand ?? "",
    colorName: paint?.colorName ?? "",
    colorCode: paint?.colorCode ?? "",
    finish: paint?.finish ?? null,
    hexInput: paint?.hex ?? "",
  };
}

export function PaintFormSheet({
  visible,
  paint,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  /** Null to add a new colour. */
  paint: PaintColor | null;
  onClose: () => void;
  onSave: (paint: PaintColor) => Promise<boolean>;
  onDelete?: (paint: PaintColor) => void;
}) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  const [form, setForm] = useState<FormState>(() => toForm(paint));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setForm(toForm(paint));
    setSaving(false);
  }, [visible, paint]);

  const set = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const hex = normalizeHex(form.hexInput);
  const canSave =
    Boolean(form.room.trim()) &&
    Boolean(form.colorName.trim() || form.colorCode.trim());

  const save = async () => {
    if (!canSave || saving) return;
    if (form.hexInput.trim() && !hex) {
      Alert.alert("Check the hex colour", "Use a value like #E3DCCB.");
      return;
    }
    setSaving(true);
    const ok = await onSave({
      id: paint?.id ?? Crypto.randomUUID(),
      room: form.room.trim(),
      brand: form.brand.trim() || null,
      colorName: form.colorName.trim() || null,
      colorCode: form.colorCode.trim() || null,
      finish: form.finish,
      hex,
    });
    setSaving(false);
    if (ok) onClose();
  };

  const swatchText = hex && !isLightHex(hex) ? "#FFFFFF" : "#1A1612";

  return (
    <HearthSheet
      visible={visible}
      onClose={onClose}
      title={paint ? "Edit colour" : "Add a paint colour"}
      maxHeightRatio={0.94}
      footer={
        <View style={styles.footer}>
          <Button
            label={saving ? "Saving…" : paint ? "Save changes" : "Add colour"}
            onPress={() => void save()}
            disabled={!canSave || saving}
            loading={saving}
          />
          {paint && onDelete ? (
            <Pressable
              onPress={() => onDelete(paint)}
              style={styles.delete}
              accessibilityRole="button"
            >
              <Text style={[styles.deleteText, { color: colors.error }]}>
                Delete colour
              </Text>
            </Pressable>
          ) : null}
        </View>
      }
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View
          style={[
            styles.preview,
            {
              backgroundColor: hex ?? colors.fieldFill,
              borderColor: colors.border,
            },
          ]}
          accessibilityLabel={hex ? `Swatch ${hex}` : "No swatch yet"}
        >
          {!hex ? (
            <Ionicons
              name="color-palette-outline"
              size={28}
              color={colors.textSecondary}
            />
          ) : null}
          <Text
            style={[
              styles.previewName,
              { color: hex ? swatchText : colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {form.colorName.trim() || form.colorCode.trim() || "Your colour"}
          </Text>
          {form.brand.trim() ? (
            <Text
              style={[
                styles.previewMeta,
                { color: hex ? swatchText : colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {form.brand.trim()}
            </Text>
          ) : null}
        </View>

        <Label text="Room or surface" />
        <Input
          value={form.room}
          onChangeText={(room) => set({ room })}
          placeholder="e.g. Living room walls"
          autoCapitalize="sentences"
          autoFocus={!paint}
        />
        <Suggestions
          options={ROOM_SUGGESTIONS}
          selected={form.room}
          onPick={(room) => set({ room })}
        />

        <Label text="Brand" />
        <Input
          value={form.brand}
          onChangeText={(brand) => set({ brand })}
          placeholder="Optional"
          autoCapitalize="words"
        />
        <Suggestions
          options={BRAND_SUGGESTIONS}
          selected={form.brand}
          onPick={(brand) => set({ brand })}
        />

        <View style={styles.pair}>
          <View style={styles.pairItem}>
            <Label text="Colour name" />
            <Input
              value={form.colorName}
              onChangeText={(colorName) => set({ colorName })}
              placeholder="e.g. Alabaster"
              autoCapitalize="words"
            />
          </View>
          <View style={styles.pairItem}>
            <Label text="Code" />
            <Input
              value={form.colorCode}
              onChangeText={(colorCode) => set({ colorCode })}
              placeholder="e.g. SW 7008"
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
        </View>

        <Label text="Finish" />
        <View style={styles.wrap}>
          {PAINT_FINISHES.map((finish) => {
            const active = form.finish === finish;
            return (
              <Pressable
                key={finish}
                onPress={() => {
                  triggerLight();
                  set({ finish: active ? null : finish });
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active
                      ? colors.primary + "18"
                      : colors.fieldFill,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? colors.primary : colors.text },
                  ]}
                >
                  {PAINT_FINISH_LABELS[finish]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Label text="Swatch" />
        <View style={styles.palette}>
          {PAINT_PALETTE.map((swatch) => {
            const active = hex === swatch.hex;
            return (
              <Pressable
                key={swatch.hex}
                onPress={() => {
                  triggerLight();
                  set({ hexInput: active ? "" : swatch.hex });
                }}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: swatch.hex,
                    borderColor: active ? colors.primary : colors.border,
                    borderWidth: active ? 3 : StyleSheet.hairlineWidth,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={swatch.label}
              >
                {active ? (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={isLightHex(swatch.hex) ? "#1A1612" : "#FFFFFF"}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <Input
          value={form.hexInput}
          onChangeText={(hexInput) => set({ hexInput })}
          placeholder="Or enter a hex, e.g. #EDEAE0"
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.hexInput}
        />
        <Text style={[styles.help, { color: colors.textSecondary }]}>
          Paint brands list the hex on each colour's web page. A close match
          from the palette works too.
        </Text>
      </ScrollView>
    </HearthSheet>
  );
}

function Label({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.label, { color: colors.textSecondary }]}>{text}</Text>
  );
}

function Input({ style, ...props }: TextInputProps) {
  const { colors } = useTheme();
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.textSecondary}
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
  );
}

function Suggestions({
  options,
  selected,
  onPick,
}: {
  options: string[];
  selected: string;
  onPick: (value: string) => void;
}) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={styles.suggestScroller}
      contentContainerStyle={styles.suggestRow}
    >
      {options.map((option) => {
        const active = selected.trim() === option;
        return (
          <Pressable
            key={option}
            onPress={() => {
              triggerLight();
              onPick(option);
            }}
            style={[
              styles.suggestion,
              {
                backgroundColor: active ? colors.primary + "18" : "transparent",
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.suggestionText,
                { color: active ? colors.primary : colors.textSecondary },
              ]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: DesignSystem.spacing.md,
  },
  footer: {
    gap: DesignSystem.spacing.xs,
  },
  delete: {
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.sm + 2,
  },
  deleteText: {
    ...DesignSystem.typography.bodySemiBold,
  },
  preview: {
    height: 120,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "flex-end",
    padding: DesignSystem.spacing.md,
  },
  previewName: {
    ...DesignSystem.typography.title2,
    fontSize: 20,
    lineHeight: 26,
  },
  previewMeta: {
    ...DesignSystem.typography.footnote,
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
  suggestScroller: {
    marginHorizontal: -DesignSystem.spacing.lg,
    marginTop: DesignSystem.spacing.sm,
  },
  suggestRow: {
    gap: DesignSystem.spacing.xs + 2,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  suggestion: {
    paddingHorizontal: DesignSystem.spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  suggestionText: {
    ...DesignSystem.typography.small,
  },
  pair: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
  },
  pairItem: {
    flex: 1,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
  },
  chip: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs + 3,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    ...DesignSystem.typography.smallSemiBold,
  },
  palette: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  hexInput: {
    marginTop: DesignSystem.spacing.sm + 2,
    fontVariant: ["tabular-nums"],
  },
  help: {
    ...DesignSystem.typography.caption,
    marginTop: DesignSystem.spacing.xs + 2,
  },
});
