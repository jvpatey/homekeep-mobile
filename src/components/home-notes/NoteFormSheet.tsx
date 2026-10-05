import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as Crypto from "expo-crypto";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";
import { Button } from "../ui/Button";
import { HearthSheet } from "../ui/HearthSheet";
import { HomeNote } from "../../types/homeNotes";

export function NoteFormSheet({
  visible,
  note,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  /** Null to add a new note. */
  note: HomeNote | null;
  onClose: () => void;
  onSave: (note: HomeNote) => Promise<boolean>;
  onDelete?: (note: HomeNote) => void;
}) {
  const { colors } = useTheme();
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(note?.title ?? "");
    setBody(note?.body ?? "");
    setSaving(false);
  }, [visible, note]);

  const canSave = Boolean(title.trim() || body.trim());

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const ok = await onSave({
      id: note?.id ?? Crypto.randomUUID(),
      title: title.trim(),
      body: body.trim(),
      updatedAt: new Date().toISOString(),
    });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <HearthSheet
      visible={visible}
      onClose={onClose}
      title={note ? "Edit note" : "New note"}
      maxHeightRatio={0.94}
      footer={
        <View style={styles.footer}>
          <Button
            label={saving ? "Saving…" : note ? "Save changes" : "Save note"}
            onPress={() => void save()}
            disabled={!canSave || saving}
            loading={saving}
          />
          {note && onDelete ? (
            <Pressable
              onPress={() => onDelete(note)}
              style={styles.delete}
              accessibilityRole="button"
            >
              <Text style={[styles.deleteText, { color: colors.error }]}>
                Delete note
              </Text>
            </Pressable>
          ) : null}
        </View>
      }
    >
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="sentences"
        autoFocus={!note}
        returnKeyType="next"
        accessibilityLabel="Title"
        style={[styles.title, { color: colors.text }]}
      />
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="Wi-Fi for guests, where the spare key is, which breaker runs the garage, the sprinkler schedule…"
        placeholderTextColor={colors.textSecondary}
        multiline
        textAlignVertical="top"
        accessibilityLabel="Note"
        style={[
          styles.body,
          {
            color: colors.text,
            backgroundColor: colors.fieldFill,
            borderColor: colors.border,
          },
        ]}
      />
    </HearthSheet>
  );
}

const styles = StyleSheet.create({
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
  title: {
    ...DesignSystem.typography.title2,
    fontSize: 22,
    lineHeight: 28,
    paddingVertical: DesignSystem.spacing.sm,
  },
  body: {
    ...DesignSystem.typography.body,
    lineHeight: 24,
    minHeight: 220,
    marginTop: DesignSystem.spacing.sm,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
