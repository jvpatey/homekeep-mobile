import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { format, parseISO } from "date-fns";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { useHaptics } from "../../hooks";
import { Button, HeaderIconButton } from "../../components/ui";
import { PaintFormSheet } from "../../components/home-notes/PaintFormSheet";
import { NoteFormSheet } from "../../components/home-notes/NoteFormSheet";
import { WifiQrSheet } from "../../components/home-notes/WifiQrSheet";
import { shareHomeText } from "../../components/home-notes/shareHomeText";
import {
  noteDisplayBody,
  noteShareText,
  noteTemplate,
  parseWifiNote,
  WifiDetails,
} from "../../components/home-notes/noteTemplates";
import {
  HomeNote,
  isLightHex,
  PAINT_FINISH_LABELS,
  PaintColor,
  paintSubtitle,
  paintTitle,
} from "../../types/homeNotes";
import { showActionMenu } from "../../utils/actionMenu";
import { RecordStackParamList } from "../../navigation/types";
import { DesignSystem } from "../../theme/designSystem";

type Nav = NativeStackNavigationProp<RecordStackParamList>;
type Section = "paint" | "notes";

export function PaintColorsScreen() {
  return <HomeNotesScreen section="paint" />;
}

export function HouseNotesScreen() {
  return <HomeNotesScreen section="notes" />;
}

/** Paint colours and house notes share storage (profiles.home_notes) and editing rules. */
function HomeNotesScreen({ section }: { section: Section }) {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { triggerLight, triggerMedium, triggerSuccess } = useHaptics();
  const { homeNotes, updateHomeNotes, canEditHome } = useProfile();
  const [paintSheet, setPaintSheet] = useState<{
    visible: boolean;
    paint: PaintColor | null;
  }>({ visible: false, paint: null });
  const [noteSheet, setNoteSheet] = useState<{
    visible: boolean;
    note: HomeNote | null;
  }>({ visible: false, note: null });
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [wifiQr, setWifiQr] = useState<WifiDetails | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    []
  );

  const openAdd = () => {
    triggerLight();
    if (section === "paint") setPaintSheet({ visible: true, paint: null });
    else setNoteSheet({ visible: true, note: null });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: canEditHome
        ? () => (
            <HeaderIconButton
              icon="add"
              onPress={openAdd}
              accessibilityLabel={
                section === "paint" ? "Add a paint colour" : "Add a note"
              }
            />
          )
        : undefined,
    });
  });

  const paints = useMemo(
    () =>
      [...homeNotes.paints].sort((a, b) =>
        (a.room || "").localeCompare(b.room || "")
      ),
    [homeNotes.paints]
  );
  const notes = useMemo(
    () =>
      [...homeNotes.notes].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt)
      ),
    [homeNotes.notes]
  );

  const persist = async (next: typeof homeNotes) => {
    const result = await updateHomeNotes(next);
    if (!result.success) {
      Alert.alert("Couldn't save", result.error ?? "Please try again.");
      return false;
    }
    triggerSuccess();
    return true;
  };

  const savePaint = (paint: PaintColor) => {
    const exists = homeNotes.paints.some((item) => item.id === paint.id);
    return persist({
      ...homeNotes,
      paints: exists
        ? homeNotes.paints.map((item) => (item.id === paint.id ? paint : item))
        : [...homeNotes.paints, paint],
    });
  };

  const saveNote = (note: HomeNote) => {
    const exists = homeNotes.notes.some((item) => item.id === note.id);
    return persist({
      ...homeNotes,
      notes: exists
        ? homeNotes.notes.map((item) => (item.id === note.id ? note : item))
        : [note, ...homeNotes.notes],
    });
  };

  const confirmDelete = (label: string, onConfirm: () => void) => {
    triggerMedium();
    Alert.alert(`Delete ${label}?`, undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onConfirm },
    ]);
  };

  const deletePaint = (paint: PaintColor) =>
    confirmDelete(paintTitle(paint), async () => {
      const ok = await persist({
        ...homeNotes,
        paints: homeNotes.paints.filter((item) => item.id !== paint.id),
      });
      if (ok) setPaintSheet((prev) => ({ ...prev, visible: false }));
    });

  const deleteNote = (note: HomeNote) =>
    confirmDelete(note.title ? `“${note.title}”` : "this note", async () => {
      const ok = await persist({
        ...homeNotes,
        notes: homeNotes.notes.filter((item) => item.id !== note.id),
      });
      if (ok) setNoteSheet((prev) => ({ ...prev, visible: false }));
    });

  const copy = async (id: string, value: string) => {
    await Clipboard.setStringAsync(value);
    triggerSuccess();
    setCopiedId(id);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopiedId(null), 1600);
  };

  const paintCopyValue = (paint: PaintColor) =>
    [paint.brand, paint.colorName, paint.colorCode].filter(Boolean).join(" ");

  const paintShareText = (paint: PaintColor) =>
    [
      paint.room,
      paintCopyValue(paint),
      paint.finish ? `Finish: ${PAINT_FINISH_LABELS[paint.finish]}` : null,
      paint.hex ? `Hex: ${paint.hex}` : null,
    ]
      .filter(Boolean)
      .join("\n");

  const openPaintMenu = (paint: PaintColor) => {
    triggerMedium();
    showActionMenu({
      title: [paint.room, paintTitle(paint)].filter(Boolean).join(" · "),
      options: [
        {
          label: "Copy colour",
          icon: "copy-outline",
          onPress: () => void copy(paint.id, paintCopyValue(paint)),
        },
        {
          label: "Share…",
          icon: "share-outline",
          onPress: () =>
            void shareHomeText(paintShareText(paint), paintTitle(paint)),
        },
        ...(canEditHome
          ? [
              {
                label: "Edit",
                icon: "create-outline" as const,
                onPress: () => setPaintSheet({ visible: true, paint }),
              },
              {
                label: "Delete",
                icon: "trash-outline" as const,
                destructive: true,
                onPress: () => deletePaint(paint),
              },
            ]
          : []),
      ],
    });
  };

  const openNoteMenu = (note: HomeNote) => {
    triggerMedium();
    const text = noteShareText(note);
    const wifi = parseWifiNote(note);
    showActionMenu({
      title: note.title || noteTemplate(note).label,
      options: [
        {
          label: "Copy",
          icon: "copy-outline",
          onPress: () => void copy(note.id, text),
        },
        {
          label: "Share…",
          icon: "share-outline",
          onPress: () => void shareHomeText(text, note.title || undefined),
        },
        ...(wifi
          ? [
              {
                label: "Show Wi‑Fi QR code",
                icon: "qr-code-outline" as const,
                onPress: () => setWifiQr(wifi),
              },
            ]
          : []),
        ...(canEditHome
          ? [
              {
                label: "Edit",
                icon: "create-outline" as const,
                onPress: () => setNoteSheet({ visible: true, note }),
              },
              {
                label: "Delete",
                icon: "trash-outline" as const,
                destructive: true,
                onPress: () => deleteNote(note),
              },
            ]
          : []),
      ],
    });
  };

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        {section === "paint" ? (
          paints.length === 0 ? (
            <EmptyState
              icon="color-palette-outline"
              title="Never guess the paint again"
              body="Save each room's brand, colour, and finish so touch-ups match and the next owner knows what's on the walls."
              action={canEditHome ? "Add a paint colour" : null}
              onAction={openAdd}
            />
          ) : (
            <View style={styles.grid}>
              {paints.map((paint) => {
                const light = paint.hex ? isLightHex(paint.hex) : true;
                const subtitle = paintSubtitle(paint);
                const copied = copiedId === paint.id;
                return (
                  <Pressable
                    key={paint.id}
                    onPress={() => {
                      if (canEditHome) {
                        triggerLight();
                        setPaintSheet({ visible: true, paint });
                      } else {
                        void copy(paint.id, paintCopyValue(paint));
                      }
                    }}
                    onLongPress={() => openPaintMenu(paint)}
                    style={({ pressed }) => [
                      styles.paintCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                      DesignSystem.shadows.softAmbient,
                      pressed && { opacity: 0.85 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={[
                      paint.room,
                      paintTitle(paint),
                      subtitle,
                      paint.finish ? PAINT_FINISH_LABELS[paint.finish] : null,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    accessibilityHint={
                      canEditHome
                        ? "Opens the colour to edit. Long press for more options"
                        : "Copies the colour. Long press for more options"
                    }
                  >
                    <View
                      style={[
                        styles.swatch,
                        {
                          backgroundColor: paint.hex ?? colors.fieldFill,
                          borderBottomColor: colors.border,
                        },
                      ]}
                    >
                      {!paint.hex ? (
                        <Ionicons
                          name="color-palette-outline"
                          size={22}
                          color={colors.textSecondary}
                        />
                      ) : null}
                      {paint.finish ? (
                        <View
                          style={[
                            styles.finishPill,
                            {
                              backgroundColor: light
                                ? "rgba(0,0,0,0.08)"
                                : "rgba(255,255,255,0.2)",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.finishText,
                              { color: light ? "#1A1612" : "#FFFFFF" },
                            ]}
                          >
                            {PAINT_FINISH_LABELS[paint.finish]}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.paintBody}>
                      <Text
                        style={[styles.room, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {paint.room}
                      </Text>
                      <Text
                        style={[styles.paintName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {paintTitle(paint)}
                      </Text>
                      {subtitle ? (
                        <Pressable
                          onPress={() =>
                            void copy(paint.id, paintCopyValue(paint))
                          }
                          hitSlop={6}
                          style={styles.codeRow}
                          accessibilityRole="button"
                          accessibilityLabel={`Copy ${subtitle}`}
                        >
                          <Text
                            style={[
                              styles.paintMeta,
                              { color: colors.textSecondary },
                            ]}
                            numberOfLines={1}
                          >
                            {copied ? "Copied" : subtitle}
                          </Text>
                          <Ionicons
                            name={copied ? "checkmark" : "copy-outline"}
                            size={12}
                            color={
                              copied ? colors.success : colors.textSecondary
                            }
                          />
                        </Pressable>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )
        ) : notes.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="The things only you know"
            body="Guest Wi‑Fi, the spare key, trash day, the sprinkler schedule. Start from a template, write it once, and share it with anyone who needs it."
            action={canEditHome ? "Start a note" : null}
            onAction={openAdd}
          />
        ) : (
          notes.map((note) => {
            const expanded = expandedNoteId === note.id;
            const updated = parseISO(note.updatedAt);
            const template = noteTemplate(note);
            const body = noteDisplayBody(note);
            const wifi = parseWifiNote(note);
            const updatedLabel =
              Number.isNaN(updated.getTime()) || updated.getTime() === 0
                ? null
                : `Updated ${format(updated, "MMM d, yyyy")}`;
            return (
              <Pressable
                key={note.id}
                onPress={() => {
                  triggerLight();
                  if (canEditHome) setNoteSheet({ visible: true, note });
                  else setExpandedNoteId(expanded ? null : note.id);
                }}
                onLongPress={() => openNoteMenu(note)}
                style={({ pressed }) => [
                  styles.noteCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  DesignSystem.shadows.softAmbient,
                  pressed && { opacity: 0.85 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={[note.title || template.label, body]
                  .filter(Boolean)
                  .join(". ")}
                accessibilityHint="Long press for copy, share, and more"
              >
                <View style={styles.noteHeader}>
                  <View
                    style={[
                      styles.noteIcon,
                      { backgroundColor: template.tint + "1F" },
                    ]}
                  >
                    <Ionicons
                      name={template.icon}
                      size={16}
                      color={template.tint}
                    />
                  </View>
                  <View style={styles.noteHeaderText}>
                    <Text
                      style={[styles.noteTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {note.title || template.label}
                    </Text>
                    <Text
                      style={[
                        styles.noteMeta,
                        {
                          color:
                            copiedId === note.id
                              ? colors.success
                              : colors.textSecondary,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {copiedId === note.id
                        ? "Copied"
                        : [
                            note.kind && note.kind !== "general"
                              ? template.label
                              : null,
                            updatedLabel,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => openNoteMenu(note)}
                    hitSlop={10}
                    style={styles.moreHit}
                    accessibilityRole="button"
                    accessibilityLabel="More options"
                  >
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>
                {body ? (
                  <Text
                    style={[styles.noteBody, { color: colors.text }]}
                    numberOfLines={expanded ? undefined : 4}
                  >
                    {body}
                  </Text>
                ) : null}
                {wifi ? (
                  <Pressable
                    onPress={() => {
                      triggerLight();
                      setWifiQr(wifi);
                    }}
                    style={({ pressed }) => [
                      styles.wifiChip,
                      {
                        backgroundColor: template.tint + "14",
                        borderColor: template.tint + "40",
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Show Wi‑Fi QR code"
                  >
                    <Ionicons
                      name="qr-code-outline"
                      size={14}
                      color={template.tint}
                    />
                    <Text style={[styles.wifiChipText, { color: template.tint }]}>
                      Show QR code to join
                    </Text>
                  </Pressable>
                ) : null}
              </Pressable>
            );
          })
        )}

        {!canEditHome ? (
          <Text style={[styles.memberNote, { color: colors.textSecondary }]}>
            {section === "paint"
              ? "Only the home's owner can edit paint colours."
              : "Only the home's owner can edit house notes."}
          </Text>
        ) : null}
      </ScrollView>

      <PaintFormSheet
        visible={paintSheet.visible}
        paint={paintSheet.paint}
        onClose={() => setPaintSheet((prev) => ({ ...prev, visible: false }))}
        onSave={savePaint}
        onDelete={deletePaint}
      />
      <NoteFormSheet
        visible={noteSheet.visible}
        note={noteSheet.note}
        onClose={() => setNoteSheet((prev) => ({ ...prev, visible: false }))}
        onSave={saveNote}
        onDelete={deleteNote}
      />
      <WifiQrSheet wifi={wifiQr} onClose={() => setWifiQr(null)} />
    </>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  action: string | null;
  onAction: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View
        style={[styles.emptyIcon, { backgroundColor: colors.primary + "14" }]}
      >
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
        {body}
      </Text>
      {action ? (
        <View style={styles.emptyAction}>
          <Button label={action} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.xxl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm + 4,
  },
  paintCard: {
    flexBasis: "47%",
    flexGrow: 1,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  swatch: {
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  finishPill: {
    position: "absolute",
    top: DesignSystem.spacing.sm,
    right: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 2,
    borderRadius: DesignSystem.borders.radius.round,
  },
  finishText: {
    ...DesignSystem.typography.captionSemiBold,
  },
  paintBody: {
    padding: DesignSystem.spacing.sm + 4,
    gap: 1,
  },
  room: {
    ...DesignSystem.typography.captionSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  paintName: {
    ...DesignSystem.typography.bodySemiBold,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  paintMeta: {
    ...DesignSystem.typography.footnote,
    flexShrink: 1,
  },
  noteCard: {
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm + 4,
    gap: DesignSystem.spacing.xs + 2,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm + 2,
  },
  noteIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  noteHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  moreHit: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -DesignSystem.spacing.xs,
  },
  wifiChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: DesignSystem.spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  wifiChipText: {
    ...DesignSystem.typography.smallSemiBold,
  },
  noteTitle: {
    ...DesignSystem.typography.bodySemiBold,
  },
  noteBody: {
    ...DesignSystem.typography.body,
    lineHeight: 22,
  },
  noteMeta: {
    ...DesignSystem.typography.caption,
  },
  memberNote: {
    ...DesignSystem.typography.footnote,
    textAlign: "center",
    marginTop: DesignSystem.spacing.lg,
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  emptyTitle: {
    ...DesignSystem.typography.title2,
    fontSize: 20,
    lineHeight: 26,
    textAlign: "center",
  },
  emptyBody: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
    textAlign: "center",
    marginTop: DesignSystem.spacing.sm,
  },
  emptyAction: {
    alignSelf: "stretch",
    marginTop: DesignSystem.spacing.lg,
  },
});
