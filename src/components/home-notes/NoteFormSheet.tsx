import React, { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { Button } from "../ui/Button";
import { HearthSheet } from "../ui/HearthSheet";
import { HomeNote, NoteKind } from "../../types/homeNotes";
import {
  NOTE_TEMPLATE_LIST,
  NOTE_TEMPLATES,
  NoteTemplate,
  noteShareText,
} from "./noteTemplates";
import { shareHomeText } from "./shareHomeText";

type Step = "pick" | "edit";

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
  const { triggerLight } = useHaptics();
  const [step, setStep] = useState<Step>(note ? "edit" : "pick");
  const [kind, setKind] = useState<NoteKind>(note?.kind ?? "general");
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<TextInput>(null);
  const bodyRef = useRef<TextInput>(null);
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;
    setStep(note ? "edit" : "pick");
    setKind(note?.kind ?? "general");
    setTitle(note?.title ?? "");
    setBody(note?.body ?? "");
    setSaving(false);
  }, [visible, note]);

  useEffect(
    () => () => {
      if (focusTimer.current) clearTimeout(focusTimer.current);
    },
    []
  );

  const template = NOTE_TEMPLATES[kind];
  const canSave = Boolean(title.trim() || body.trim());
  const shareText = noteShareText({ kind, title, body });

  const focusSoon = (input: React.RefObject<TextInput | null>) => {
    if (focusTimer.current) clearTimeout(focusTimer.current);
    focusTimer.current = setTimeout(() => input.current?.focus(), 280);
  };

  const pickTemplate = (next: NoteTemplate) => {
    triggerLight();
    setKind(next.kind);
    setTitle(next.title);
    setBody(next.body);
    setStep("edit");
    focusSoon(next.title ? bodyRef : titleRef);
  };

  // Swap the prefilled prompts too, as long as the user hasn't typed over them.
  const changeKind = (next: NoteKind) => {
    triggerLight();
    const untouched =
      !note && title === template.title && body === template.body;
    setKind(next);
    if (untouched) {
      setTitle(NOTE_TEMPLATES[next].title);
      setBody(NOTE_TEMPLATES[next].body);
    }
  };

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const ok = await onSave({
      id: note?.id ?? Crypto.randomUUID(),
      title: title.trim(),
      body: body.trim(),
      updatedAt: new Date().toISOString(),
      kind,
    });
    setSaving(false);
    if (ok) onClose();
  };

  const shareButton =
    step === "edit" && shareText ? (
      <Pressable
        onPress={() => void shareHomeText(shareText, title.trim() || undefined)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Share note"
      >
        <Ionicons name="share-outline" size={22} color={colors.primary} />
      </Pressable>
    ) : undefined;

  return (
    <HearthSheet
      visible={visible}
      onClose={onClose}
      title={note ? "Edit note" : step === "pick" ? "New note" : template.label}
      maxHeightRatio={0.94}
      headerRight={shareButton}
      footer={
        step === "edit" ? (
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
        ) : undefined
      }
    >
      {step === "pick" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.pickScroll}
        >
          <Text style={[styles.pickIntro, { color: colors.textSecondary }]}>
            Start from a template. You can change anything after.
          </Text>
          <View style={styles.grid}>
            {NOTE_TEMPLATE_LIST.map((item) => (
              <TemplateTile
                key={item.kind}
                template={item}
                onPress={() => pickTemplate(item)}
              />
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.editScroll}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.kindScroller}
            contentContainerStyle={styles.kindRow}
          >
            {NOTE_TEMPLATE_LIST.map((item) => {
              const active = item.kind === kind;
              return (
                <Pressable
                  key={item.kind}
                  onPress={() => changeKind(item.kind)}
                  style={[
                    styles.kindChip,
                    {
                      backgroundColor: active
                        ? item.tint + "1F"
                        : colors.fieldFill,
                      borderColor: active ? item.tint : colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={item.label}
                >
                  <Ionicons
                    name={item.icon}
                    size={14}
                    color={active ? item.tint : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.kindText,
                      { color: active ? item.tint : colors.text },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <TextInput
            ref={titleRef}
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="sentences"
            returnKeyType="next"
            onSubmitEditing={() => bodyRef.current?.focus()}
            submitBehavior="submit"
            accessibilityLabel="Title"
            style={[styles.title, { color: colors.text }]}
          />
          <TextInput
            ref={bodyRef}
            value={body}
            onChangeText={setBody}
            placeholder={template.placeholder}
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
          {kind === "access" || kind === "wifi" ? (
            <View style={styles.privacy}>
              <Ionicons
                name="lock-closed-outline"
                size={13}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.privacyText, { color: colors.textSecondary }]}
              >
                Visible to everyone in your HomeShare. Shared copies leave the
                app.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </HearthSheet>
  );
}

function TemplateTile({
  template,
  onPress,
}: {
  template: NoteTemplate;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: colors.surface, borderColor: colors.border },
        DesignSystem.shadows.softAmbient,
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${template.label}. ${template.blurb}`}
    >
      <View
        style={[styles.tileIcon, { backgroundColor: template.tint + "1F" }]}
      >
        <Ionicons name={template.icon} size={20} color={template.tint} />
      </View>
      <Text
        style={[styles.tileLabel, { color: colors.text }]}
        numberOfLines={1}
      >
        {template.label}
      </Text>
      <Text
        style={[styles.tileBlurb, { color: colors.textSecondary }]}
        numberOfLines={2}
      >
        {template.blurb}
      </Text>
    </Pressable>
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
  pickScroll: {
    paddingBottom: DesignSystem.spacing.lg,
  },
  pickIntro: {
    ...DesignSystem.typography.footnote,
    marginBottom: DesignSystem.spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm + 2,
  },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.sm,
  },
  tileLabel: {
    ...DesignSystem.typography.bodySemiBold,
  },
  tileBlurb: {
    ...DesignSystem.typography.caption,
  },
  editScroll: {
    paddingBottom: DesignSystem.spacing.md,
  },
  kindScroller: {
    marginHorizontal: -DesignSystem.spacing.lg,
    flexGrow: 0,
  },
  kindRow: {
    gap: DesignSystem.spacing.xs + 2,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  kindChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: DesignSystem.spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  kindText: {
    ...DesignSystem.typography.smallSemiBold,
  },
  title: {
    ...DesignSystem.typography.title2,
    fontSize: 22,
    lineHeight: 28,
    paddingVertical: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.sm,
  },
  body: {
    ...DesignSystem.typography.body,
    lineHeight: 24,
    minHeight: 200,
    marginTop: DesignSystem.spacing.xs,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  privacy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: DesignSystem.spacing.sm,
  },
  privacyText: {
    ...DesignSystem.typography.caption,
    flex: 1,
  },
});
