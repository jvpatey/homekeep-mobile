import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useRequirePlus } from "../../../hooks/useRequirePlus";
import { useProfile } from "../../../context/ProfileContext";
import { HearthSheet } from "../../ui/HearthSheet";
import { HearthSurfaceCard } from "../../ui/HearthSurfaceCard";
import { Button } from "../../ui/Button";
import { DesignSystem } from "../../../theme/designSystem";
import {
  HomeEmergencyFacts,
  HomeEmergencySpot,
  HomeEmergencyCustomSpot,
  newlyFilledEmergencySpots,
  findOpenTasksForEmergencySpots,
  isEmergencySpotFilled,
  HOME_EMERGENCY_SPOT_KEYS,
  HomeEmergencySpotKey,
  visibleEmergencySpotKeys,
  createCustomEmergencySpot,
  MAX_CUSTOM_EMERGENCY_SPOTS,
} from "../../../types/homeEmergency";
import { useHaptics } from "../../../hooks";
import { EquipmentManualService } from "../../../services/EquipmentManualService";
import { useTasks } from "../../../context/TasksContext";

interface EmergencyFactsModalProps {
  visible: boolean;
  onClose: () => void;
  embedded?: boolean;
}

type SpotKey = HomeEmergencySpotKey;

const SPOTS: {
  key: SpotKey;
  label: string;
  hint: string;
  howtoHint: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: "secondary" | "warning" | "primary";
}[] = [
  {
    key: "waterShutoff",
    label: "Main water shutoff",
    hint: "Basement wall, utility room, crawlspace…",
    howtoHint: "Clockwise until it stops",
    icon: "water",
    tint: "secondary",
  },
  {
    key: "waterHeater",
    label: "Water heater",
    hint: "Utility closet, basement, garage…",
    howtoHint: "Cold inlet on top, then gas or power",
    icon: "thermometer",
    tint: "secondary",
  },
  {
    key: "breakerPanel",
    label: "Breaker panel",
    hint: "Where the main electrical panel lives",
    howtoHint: "Main breaker is the large switch at the top",
    icon: "flash",
    tint: "warning",
  },
  {
    key: "gasShutoff",
    label: "Gas shutoff",
    hint: "Meter outside or the valve at the appliance",
    howtoHint: "Quarter-turn — handle across the pipe is off",
    icon: "flame",
    tint: "primary",
  },
];

function emptySpotFields(): Record<SpotKey, string> {
  return {
    waterShutoff: "",
    waterHeater: "",
    breakerPanel: "",
    gasShutoff: "",
  };
}

function emptySpotPhotos(): Record<SpotKey, string | null> {
  return {
    waterShutoff: null,
    waterHeater: null,
    breakerPanel: null,
    gasShutoff: null,
  };
}

function notesFromFacts(
  facts: HomeEmergencyFacts | null | undefined
): Record<SpotKey, string> {
  return {
    waterShutoff: facts?.waterShutoff?.note ?? "",
    waterHeater: facts?.waterHeater?.note ?? "",
    breakerPanel: facts?.breakerPanel?.note ?? "",
    gasShutoff: facts?.gasShutoff?.note ?? "",
  };
}

function howtosFromFacts(
  facts: HomeEmergencyFacts | null | undefined
): Record<SpotKey, string> {
  return {
    waterShutoff: facts?.waterShutoff?.howto ?? "",
    waterHeater: facts?.waterHeater?.howto ?? "",
    breakerPanel: facts?.breakerPanel?.howto ?? "",
    gasShutoff: facts?.gasShutoff?.howto ?? "",
  };
}

function photosFromFacts(
  facts: HomeEmergencyFacts | null | undefined
): Record<SpotKey, string | null> {
  return {
    waterShutoff: facts?.waterShutoff?.photo_storage_path ?? null,
    waterHeater: facts?.waterHeater?.photo_storage_path ?? null,
    breakerPanel: facts?.breakerPanel?.photo_storage_path ?? null,
    gasShutoff: facts?.gasShutoff?.photo_storage_path ?? null,
  };
}

type CustomDraft = {
  id: string;
  label: string;
  note: string;
  howto: string;
  photoPath: string | null;
  previewUri: string | null;
};

function draftsFromCustom(
  spots: HomeEmergencyCustomSpot[] | null | undefined
): CustomDraft[] {
  return (spots ?? []).map((spot) => ({
    id: spot.id,
    label: spot.label ?? "",
    note: spot.note ?? "",
    howto: spot.howto ?? "",
    photoPath: spot.photo_storage_path ?? null,
    previewUri: null,
  }));
}

function SpotCard({
  label,
  labelEditable,
  onChangeLabel,
  hint,
  howtoLabel,
  howtoHint,
  icon,
  tint,
  note,
  onChangeNote,
  howto,
  onChangeHowto,
  previewUri,
  hasPhoto,
  uploading,
  onPickPhoto,
  onRemove,
}: {
  label: string;
  labelEditable?: boolean;
  onChangeLabel?: (label: string) => void;
  hint: string;
  howtoLabel: string;
  howtoHint: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: "secondary" | "warning" | "primary";
  note: string;
  onChangeNote: (note: string) => void;
  howto: string;
  onChangeHowto: (howto: string) => void;
  previewUri: string | null;
  hasPhoto: boolean;
  uploading: boolean;
  onPickPhoto: () => void;
  onRemove?: () => void;
}) {
  const { colors } = useTheme();
  const accent = colors[tint];
  const filled = Boolean(note.trim()) || Boolean(howto.trim()) || hasPhoto;
  const status = (() => {
    const hasNote = Boolean(note.trim());
    if (hasNote && hasPhoto) return "Saved";
    if (hasPhoto) return "Photo saved";
    if (hasNote) return "Location saved";
    return "Add this spot";
  })();

  return (
    <HearthSurfaceCard containerStyle={styles.cardOuter}>
      <View style={styles.cardRow}>
        <Pressable
          onPress={onPickPhoto}
          disabled={uploading}
          style={[
            styles.photoSlot,
            {
              backgroundColor: accent + "18",
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            uploading
              ? `Uploading photo for ${label}`
              : previewUri
                ? `Replace photo for ${label}`
                : `Add photo for ${label}`
          }
        >
          {previewUri ? (
            <Image
              source={{ uri: previewUri }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <View
                style={[
                  styles.photoPlaceholderIcon,
                  { backgroundColor: accent + "28" },
                ]}
              >
                <Ionicons
                  name={uploading ? "cloud-upload-outline" : "camera-outline"}
                  size={22}
                  color={accent}
                />
              </View>
              <Text style={[styles.photoPlaceholderLabel, { color: accent }]}>
                {uploading ? "Uploading" : "Add photo"}
              </Text>
            </View>
          )}
        </Pressable>

        <View style={styles.cardBody}>
          <View style={styles.blockHeader}>
            <View
              style={[styles.iconBadge, { backgroundColor: accent + "22" }]}
            >
              <Ionicons name={icon} size={16} color={accent} />
            </View>
            <View style={styles.titleBlock}>
              {labelEditable ? (
                <TextInput
                  value={label}
                  onChangeText={onChangeLabel}
                  placeholder="Name this spot"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.labelInput, { color: colors.text }]}
                  accessibilityLabel="Custom spot name"
                />
              ) : (
                <Text
                  style={[styles.label, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              )}
              <Text
                style={[
                  styles.status,
                  { color: filled ? colors.success : colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {status}
              </Text>
            </View>
            {onRemove ? (
              <Pressable
                onPress={onRemove}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${label || "custom spot"}`}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
            ) : null}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Location
          </Text>
          <TextInput
            value={note}
            onChangeText={onChangeNote}
            placeholder={hint}
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.fieldFill,
              },
            ]}
            accessibilityLabel={`Location for ${label}`}
          />
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            {howtoLabel}
          </Text>
          <TextInput
            value={howto}
            onChangeText={onChangeHowto}
            placeholder={howtoHint}
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.fieldFill,
              },
            ]}
            accessibilityLabel={`How to shut off ${label}`}
          />
          {previewUri ? (
            <Pressable
              onPress={onPickPhoto}
              disabled={uploading}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Replace photo for ${label}`}
            >
              <Text style={[styles.photoAction, { color: colors.primary }]}>
                {uploading ? "Uploading…" : "Replace photo"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </HearthSurfaceCard>
  );
}

export function EmergencyFactsModal({
  visible,
  onClose,
  embedded = false,
}: EmergencyFactsModalProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { profile, updateHomeEmergency } = useProfile();
  const { upcomingTasks, overdueTasks, completeTask } = useTasks();
  const { triggerLight } = useHaptics();
  const requirePlus = useRequirePlus();
  const hydratedForOpen = useRef(false);

  const visibleSpots = SPOTS.filter((spot) =>
    visibleEmergencySpotKeys(profile?.home_systems).includes(spot.key)
  );

  const [notes, setNotes] = useState<Record<SpotKey, string>>(emptySpotFields);
  const [howtos, setHowtos] = useState<Record<SpotKey, string>>(emptySpotFields);
  const [photoPaths, setPhotoPaths] = useState<Record<SpotKey, string | null>>(
    emptySpotPhotos
  );
  const [previewUris, setPreviewUris] = useState<
    Record<SpotKey, string | null>
  >(emptySpotPhotos);
  const [customDrafts, setCustomDrafts] = useState<CustomDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      hydratedForOpen.current = false;
      return;
    }
    if (hydratedForOpen.current) return;
    hydratedForOpen.current = true;

    const initial = profile?.home_emergency ?? {};
    setNotes(notesFromFacts(initial));
    setHowtos(howtosFromFacts(initial));
    setPhotoPaths(photosFromFacts(initial));
    setPreviewUris(emptySpotPhotos());
    const drafts = draftsFromCustom(initial.custom);
    setCustomDrafts(drafts);

    let cancelled = false;
    const loadUrls = async () => {
      const next = emptySpotPhotos();
      for (const spot of SPOTS) {
        const path = initial[spot.key]?.photo_storage_path;
        if (!path) continue;
        const result = await EquipmentManualService.getManualSignedUrl(path);
        if (result.data) next[spot.key] = result.data;
      }
      const customPreviews: Record<string, string> = {};
      for (const draft of drafts) {
        if (!draft.photoPath) continue;
        const result = await EquipmentManualService.getManualSignedUrl(
          draft.photoPath
        );
        if (result.data) customPreviews[draft.id] = result.data;
      }
      if (!cancelled) {
        setPreviewUris(next);
        if (Object.keys(customPreviews).length > 0) {
          setCustomDrafts((prev) =>
            prev.map((item) =>
              customPreviews[item.id]
                ? { ...item, previewUri: customPreviews[item.id] }
                : item
            )
          );
        }
      }
    };
    void loadUrls();

    return () => {
      cancelled = true;
    };
    // Intentionally only when visibility flips open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const updateNote = useCallback((key: SpotKey, note: string) => {
    setNotes((prev) => {
      if (prev[key] === note) return prev;
      return { ...prev, [key]: note };
    });
  }, []);

  const updateHowto = useCallback((key: SpotKey, howto: string) => {
    setHowtos((prev) => {
      if (prev[key] === howto) return prev;
      return { ...prev, [key]: howto };
    });
  }, []);

  const updateCustomDraft = useCallback(
    (id: string, patch: Partial<CustomDraft>) => {
      setCustomDrafts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    []
  );

  const addCustomSpot = () => {
    if (customDrafts.length >= MAX_CUSTOM_EMERGENCY_SPOTS) return;
    triggerLight();
    const created = createCustomEmergencySpot();
    setCustomDrafts((prev) => [
      ...prev,
      {
        id: created.id,
        label: "",
        note: "",
        howto: "",
        photoPath: null,
        previewUri: null,
      },
    ]);
  };

  const removeCustomSpot = (id: string) => {
    const draft = customDrafts.find((item) => item.id === id);
    const hasContent = Boolean(
      draft?.label.trim() ||
        draft?.note.trim() ||
        draft?.howto.trim() ||
        draft?.photoPath
    );
    const remove = () => {
      triggerLight();
      setCustomDrafts((prev) => prev.filter((item) => item.id !== id));
    };
    if (!hasContent) {
      remove();
      return;
    }
    Alert.alert("Remove this spot?", "This custom card will be deleted.", [
      { text: "Keep", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: remove },
    ]);
  };

  const pickPhoto = async (storageKey: string, customId?: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]?.uri || !user) return;
    const localUri = result.assets[0].uri;
    if (customId) {
      updateCustomDraft(customId, { previewUri: localUri });
    } else {
      setPreviewUris((prev) => ({ ...prev, [storageKey]: localUri }));
    }
    setUploadingKey(storageKey);
    try {
      const path = `${user.id}/emergency/${storageKey}.jpg`;
      const uploaded = await EquipmentManualService.uploadFromUriPublic(
        path,
        localUri,
        "image/jpeg"
      );
      if (uploaded.path) {
        if (customId) {
          updateCustomDraft(customId, { photoPath: uploaded.path });
        } else {
          setPhotoPaths((prev) => ({ ...prev, [storageKey]: uploaded.path }));
        }
      } else {
        if (customId) {
          updateCustomDraft(customId, { previewUri: null });
        } else {
          setPreviewUris((prev) => ({ ...prev, [storageKey]: null }));
        }
        Alert.alert(
          "Couldn't upload photo",
          uploaded.error?.message ?? "Please try again."
        );
      }
    } catch {
      if (customId) {
        updateCustomDraft(customId, { previewUri: null });
      } else {
        setPreviewUris((prev) => ({ ...prev, [storageKey]: null }));
      }
      Alert.alert("Couldn't upload photo", "Please try again.");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSave = async () => {
    if (!(await requirePlus())) return;
    setSaving(true);
    try {
      const previous = profile?.home_emergency ?? {};
      const facts: HomeEmergencyFacts = { ...previous };
      for (const spot of visibleSpots) {
        const note = notes[spot.key].trim();
        const howto = howtos[spot.key].trim();
        const photo = photoPaths[spot.key];
        if (!note && !howto && !photo) {
          facts[spot.key] = null;
          continue;
        }
        const payload: HomeEmergencySpot = {
          note: note || null,
          howto: howto || null,
          photo_storage_path: photo,
        };
        facts[spot.key] = payload;
      }
      const custom: HomeEmergencyCustomSpot[] = [];
      for (const draft of customDrafts) {
        const label = draft.label.trim();
        const note = draft.note.trim();
        const howto = draft.howto.trim();
        const photo = draft.photoPath;
        if (!label && !note && !howto && !photo) continue;
        custom.push({
          id: draft.id,
          label: label || "Custom spot",
          note: note || null,
          howto: howto || null,
          photo_storage_path: photo,
        });
      }
      facts.custom = custom.length > 0 ? custom : null;
      const result = await updateHomeEmergency(facts);
      if (!result.success) {
        Alert.alert("Couldn't save", result.error ?? "Please try again.");
        return;
      }

      // Prefer newly filled spots; if none, still check all filled spots so a
      // prior save that never cleared the starter task can be resolved.
      let spotKeys: HomeEmergencySpotKey[] = newlyFilledEmergencySpots(
        previous,
        facts
      );
      if (spotKeys.length === 0) {
        spotKeys = HOME_EMERGENCY_SPOT_KEYS.filter((key) =>
          isEmergencySpotFilled(facts[key])
        );
      }

      const openTasks = [...overdueTasks, ...upcomingTasks];
      const related = findOpenTasksForEmergencySpots(openTasks, spotKeys);

      if (related.length === 0) {
        onClose();
        return;
      }

      const list = related.map((t) => `• ${t.title}`).join("\n");
      Alert.alert(
        "Mark related tasks done?",
        `You saved this on your emergency map:\n\n${list}\n\nMark ${
          related.length === 1 ? "it" : "them"
        } complete on your schedule?`,
        [
          {
            text: "Not now",
            style: "cancel",
            onPress: onClose,
          },
          {
            text: related.length === 1 ? "Mark done" : "Mark all done",
            onPress: () => {
              void (async () => {
                for (const task of related) {
                  await completeTask(task.instance_id, {
                    notes: "Recorded on emergency shutoffs map",
                    labor_type: "diy",
                  });
                }
                onClose();
              })();
            },
          },
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <HearthSheet
      visible={visible}
      onClose={onClose}
      title="Emergency shutoffs"
      fillMaxHeight
      maxHeightRatio={0.92}
      keyboardAvoiding={Platform.OS === "ios"}
      contentStyle={{ paddingHorizontal: 0 }}
      embedded={embedded}
      footer={
        <Button
          label={saving ? "Saving…" : "Save"}
          onPress={() => void handleSave()}
          disabled={saving}
        />
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Photo, location, and how to shut it off. When something leaks or
          trips, you will not have time to search.
        </Text>
        {visibleSpots.map((spot) => (
          <SpotCard
            key={spot.key}
            label={spot.label}
            hint={spot.hint}
            howtoLabel="How to shut it off"
            howtoHint={spot.howtoHint}
            icon={spot.icon}
            tint={spot.tint}
            note={notes[spot.key]}
            onChangeNote={(note) => updateNote(spot.key, note)}
            howto={howtos[spot.key]}
            onChangeHowto={(howto) => updateHowto(spot.key, howto)}
            previewUri={previewUris[spot.key]}
            hasPhoto={Boolean(photoPaths[spot.key])}
            uploading={uploadingKey === spot.key}
            onPickPhoto={() => void pickPhoto(spot.key)}
          />
        ))}
        {customDrafts.map((draft) => (
          <SpotCard
            key={draft.id}
            label={draft.label}
            labelEditable
            onChangeLabel={(label) => updateCustomDraft(draft.id, { label })}
            hint="Where to find it"
            howtoLabel="What to do"
            howtoHint="Any steps you will need in a hurry"
            icon="bookmark"
            tint="primary"
            note={draft.note}
            onChangeNote={(note) => updateCustomDraft(draft.id, { note })}
            howto={draft.howto}
            onChangeHowto={(howto) => updateCustomDraft(draft.id, { howto })}
            previewUri={draft.previewUri}
            hasPhoto={Boolean(draft.photoPath)}
            uploading={uploadingKey === `custom_${draft.id}`}
            onPickPhoto={() => void pickPhoto(`custom_${draft.id}`, draft.id)}
            onRemove={() => removeCustomSpot(draft.id)}
          />
        ))}
        {customDrafts.length < MAX_CUSTOM_EMERGENCY_SPOTS ? (
          <Pressable
            onPress={addCustomSpot}
            style={[styles.addCustom, { borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Add a custom emergency spot"
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.addCustomLabel, { color: colors.primary }]}>
              Add a custom spot
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </HearthSheet>
  );
}

const PHOTO_SLOT_WIDTH = 112;
const PHOTO_SLOT_HEIGHT = 136;

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.xl,
  },
  hint: {
    ...DesignSystem.typography.footnote,
    marginBottom: DesignSystem.spacing.lg,
    lineHeight: 20,
  },
  cardOuter: {
    marginBottom: DesignSystem.spacing.md,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: PHOTO_SLOT_HEIGHT,
  },
  photoSlot: {
    width: PHOTO_SLOT_WIDTH,
    minHeight: PHOTO_SLOT_HEIGHT,
    alignSelf: "stretch",
    overflow: "hidden",
  },
  photo: {
    width: PHOTO_SLOT_WIDTH,
    flex: 1,
    minHeight: PHOTO_SLOT_HEIGHT,
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: DesignSystem.spacing.sm,
  },
  photoPlaceholderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderLabel: {
    ...DesignSystem.typography.caption,
    fontWeight: "700",
    textAlign: "center",
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md,
    gap: 6,
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  label: {
    ...DesignSystem.typography.body,
    fontWeight: "700",
  },
  labelInput: {
    ...DesignSystem.typography.body,
    fontWeight: "700",
    padding: 0,
    minHeight: 24,
  },
  addCustom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: "dashed",
  },
  addCustomLabel: {
    ...DesignSystem.typography.callout,
    fontWeight: "600",
  },
  status: {
    ...DesignSystem.typography.caption,
    fontSize: 11,
    fontWeight: "600",
  },
  fieldLabel: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    marginTop: 4,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: DesignSystem.borders.radius.medium,
    paddingHorizontal: DesignSystem.spacing.sm + 4,
    paddingVertical: DesignSystem.spacing.sm,
    minHeight: 44,
  },
  photoAction: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    paddingTop: 2,
  },
});
