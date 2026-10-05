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
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { useHaptics } from "../../hooks";
import {
  Button,
  HeaderIconButton,
  SegmentedControl,
  SegmentOption,
} from "../../components/ui";
import { PaintFormSheet } from "../../components/home-notes/PaintFormSheet";
import { NoteFormSheet } from "../../components/home-notes/NoteFormSheet";
import {
  HomeNote,
  isLightHex,
  PAINT_FINISH_LABELS,
  PaintColor,
  paintSubtitle,
  paintTitle,
} from "../../types/homeNotes";
import { RecordStackParamList } from "../../navigation/types";
import { DesignSystem } from "../../theme/designSystem";

type Nav = NativeStackNavigationProp<RecordStackParamList, "HomeNotes">;
type Segment = "paint" | "notes";

const SEGMENTS: SegmentOption<Segment>[] = [
  { value: "paint", label: "Paint", icon: "color-palette-outline" },
  { value: "notes", label: "Notes", icon: "document-text-outline" },
];

export function HomeNotesScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RecordStackParamList, "HomeNotes">>();
  const { colors } = useTheme();
  const { triggerLight, triggerMedium, triggerSuccess } = useHaptics();
  const { homeNotes, updateHomeNotes, canEditHome } = useProfile();
  const [segment, setSegment] = useState<Segment>(
    route.params?.segment ?? "paint"
  );
  const [paintSheet, setPaintSheet] = useState<{
    visible: boolean;
    paint: PaintColor | null;
  }>({ visible: false, paint: null });
  const [noteSheet, setNoteSheet] = useState<{
    visible: boolean;
    note: HomeNote | null;
  }>({ visible: false, note: null });
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (route.params?.segment) setSegment(route.params.segment);
  }, [route.params?.segment]);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    []
  );

  const openAdd = () => {
    triggerLight();
    if (segment === "paint") setPaintSheet({ visible: true, paint: null });
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
                segment === "paint" ? "Add a paint colour" : "Add a note"
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

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <SegmentedControl
          options={SEGMENTS}
          value={segment}
          onChange={setSegment}
          accessibilityLabel="Paint or notes"
          style={styles.segmented}
        />

        {segment === "paint" ? (
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
                        ? "Opens the colour to edit"
                        : "Copies the colour"
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
            body="Guest Wi-Fi, the spare key, which breaker runs the garage, the sprinkler schedule. Write it down once and everyone in the home can find it."
            action={canEditHome ? "Write a note" : null}
            onAction={openAdd}
          />
        ) : (
          notes.map((note) => {
            const expanded = expandedNoteId === note.id;
            const updated = parseISO(note.updatedAt);
            return (
              <Pressable
                key={note.id}
                onPress={() => {
                  triggerLight();
                  if (canEditHome) setNoteSheet({ visible: true, note });
                  else setExpandedNoteId(expanded ? null : note.id);
                }}
                onLongPress={() => void copy(note.id, note.body)}
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
                accessibilityHint="Long press to copy"
              >
                {note.title ? (
                  <Text style={[styles.noteTitle, { color: colors.text }]}>
                    {note.title}
                  </Text>
                ) : null}
                {note.body ? (
                  <Text
                    style={[styles.noteBody, { color: colors.text }]}
                    numberOfLines={expanded ? undefined : 4}
                  >
                    {note.body}
                  </Text>
                ) : null}
                <Text
                  style={[styles.noteMeta, { color: colors.textSecondary }]}
                >
                  {copiedId === note.id
                    ? "Copied"
                    : Number.isNaN(updated.getTime()) || updated.getTime() === 0
                      ? ""
                      : `Updated ${format(updated, "MMM d, yyyy")}`}
                </Text>
              </Pressable>
            );
          })
        )}

        {!canEditHome ? (
          <Text style={[styles.memberNote, { color: colors.textSecondary }]}>
            Only the home's owner can edit paint and notes.
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
  segmented: {
    marginBottom: DesignSystem.spacing.lg,
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
