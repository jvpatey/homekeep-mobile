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
import { useProfile } from "../../../context/ProfileContext";
import { HearthSheet } from "../../ui/HearthSheet";
import { Button } from "../../ui/Button";
import { DesignSystem } from "../../../theme/designSystem";
import {
  HomeEmergencyFacts,
  HomeEmergencySpot,
  newlyFilledEmergencySpots,
  findOpenTasksForEmergencySpots,
  isEmergencySpotFilled,
  HOME_EMERGENCY_SPOT_KEYS,
  HomeEmergencySpotKey,
} from "../../../types/homeEmergency";
import { EquipmentManualService } from "../../../services/EquipmentManualService";
import { useTasks } from "../../../context/TasksContext";

interface EmergencyFactsModalProps {
  visible: boolean;
  onClose: () => void;
}

type SpotKey = keyof HomeEmergencyFacts;

const SPOTS: {
  key: SpotKey;
  label: string;
  hint: string;
}[] = [
  {
    key: "waterShutoff",
    label: "Main water shutoff",
    hint: "Basement wall, utility room, crawlspace…",
  },
  {
    key: "breakerPanel",
    label: "Breaker panel",
    hint: "Where the main electrical panel lives",
  },
  {
    key: "gasShutoff",
    label: "Gas shutoff",
    hint: "Meter or appliance valve — skip if you have no gas",
  },
];

function emptyNotes(): Record<SpotKey, string> {
  return {
    waterShutoff: "",
    breakerPanel: "",
    gasShutoff: "",
  };
}

function notesFromFacts(
  facts: HomeEmergencyFacts | null | undefined
): Record<SpotKey, string> {
  return {
    waterShutoff: facts?.waterShutoff?.note ?? "",
    breakerPanel: facts?.breakerPanel?.note ?? "",
    gasShutoff: facts?.gasShutoff?.note ?? "",
  };
}

function photosFromFacts(
  facts: HomeEmergencyFacts | null | undefined
): Record<SpotKey, string | null> {
  return {
    waterShutoff: facts?.waterShutoff?.photo_storage_path ?? null,
    breakerPanel: facts?.breakerPanel?.photo_storage_path ?? null,
    gasShutoff: facts?.gasShutoff?.photo_storage_path ?? null,
  };
}

function SpotCard({
  label,
  hint,
  note,
  onChangeNote,
  previewUri,
  hasPhoto,
  uploading,
  onPickPhoto,
}: {
  label: string;
  hint: string;
  note: string;
  onChangeNote: (note: string) => void;
  previewUri: string | null;
  hasPhoto: boolean;
  uploading: boolean;
  onPickPhoto: () => void;
}) {
  const { colors, isDark } = useTheme();
  const filled = Boolean(note.trim()) || hasPhoto;
  const status = (() => {
    const hasNote = Boolean(note.trim());
    if (hasNote && hasPhoto) return "Note + photo";
    if (hasPhoto) return "Photo saved";
    if (hasNote) return "Note saved";
    return "Not saved yet";
  })();

  return (
    <View
      style={[
        styles.block,
        {
          borderColor: colors.border,
          backgroundColor: isDark
            ? "rgba(255,255,255,0.04)"
            : "rgba(0,0,0,0.03)",
        },
      ]}
    >
      <View style={styles.blockHeader}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text
          style={[
            styles.status,
            { color: filled ? colors.primary : colors.textSecondary },
          ]}
        >
          {status}
        </Text>
      </View>
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
      />
      <View style={styles.photoRow}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.thumb} />
        ) : (
          <View
            style={[styles.thumbPlaceholder, { borderColor: colors.border }]}
          >
            <Ionicons
              name="image-outline"
              size={18}
              color={colors.textSecondary}
            />
          </View>
        )}
        <Pressable
          onPress={onPickPhoto}
          disabled={uploading}
          style={styles.photoAction}
        >
          <Text style={{ color: colors.primary, fontWeight: "600" }}>
            {uploading
              ? "Uploading…"
              : previewUri
                ? "Replace photo"
                : "Add photo"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function EmergencyFactsModal({
  visible,
  onClose,
}: EmergencyFactsModalProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { profile, updateHomeEmergency } = useProfile();
  const { upcomingTasks, overdueTasks, completeTask } = useTasks();
  const hydratedForOpen = useRef(false);

  const [notes, setNotes] = useState<Record<SpotKey, string>>(emptyNotes);
  const [photoPaths, setPhotoPaths] = useState<Record<SpotKey, string | null>>(
    photosFromFacts(null)
  );
  const [previewUris, setPreviewUris] = useState<
    Record<SpotKey, string | null>
  >(photosFromFacts(null));
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<SpotKey | null>(null);

  useEffect(() => {
    if (!visible) {
      hydratedForOpen.current = false;
      return;
    }
    if (hydratedForOpen.current) return;
    hydratedForOpen.current = true;

    const initial = profile?.home_emergency ?? {};
    setNotes(notesFromFacts(initial));
    setPhotoPaths(photosFromFacts(initial));
    setPreviewUris(photosFromFacts(null));

    let cancelled = false;
    const loadUrls = async () => {
      const next: Record<SpotKey, string | null> = {
        waterShutoff: null,
        breakerPanel: null,
        gasShutoff: null,
      };
      for (const spot of SPOTS) {
        const path = initial[spot.key]?.photo_storage_path;
        if (!path) continue;
        const result = await EquipmentManualService.getManualSignedUrl(path);
        if (result.data) next[spot.key] = result.data;
      }
      if (!cancelled) setPreviewUris(next);
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

  const pickPhoto = async (key: SpotKey) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]?.uri || !user) return;
    setUploadingKey(key);
    try {
      const path = `${user.id}/emergency/${key}.jpg`;
      const uploaded = await EquipmentManualService.uploadFromUriPublic(
        path,
        result.assets[0].uri,
        "image/jpeg"
      );
      if (uploaded.path) {
        setPhotoPaths((prev) => ({ ...prev, [key]: uploaded.path }));
        setPreviewUris((prev) => ({
          ...prev,
          [key]: result.assets[0].uri,
        }));
      } else {
        Alert.alert(
          "Couldn't upload photo",
          uploaded.error?.message ?? "Please try again."
        );
      }
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const previous = profile?.home_emergency ?? {};
      const facts: HomeEmergencyFacts = {};
      for (const spot of SPOTS) {
        const note = notes[spot.key].trim();
        const photo = photoPaths[spot.key];
        if (!note && !photo) {
          facts[spot.key] = null;
          continue;
        }
        const payload: HomeEmergencySpot = {
          note: note || null,
          photo_storage_path: photo,
        };
        facts[spot.key] = payload;
      }
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
          Save a photo and a short note for each spot. When something leaks or
          trips, you will not have time to search.
        </Text>
        {SPOTS.map((spot) => (
          <SpotCard
            key={spot.key}
            label={spot.label}
            hint={spot.hint}
            note={notes[spot.key]}
            onChangeNote={(note) => updateNote(spot.key, note)}
            previewUri={previewUris[spot.key]}
            hasPhoto={Boolean(photoPaths[spot.key])}
            uploading={uploadingKey === spot.key}
            onPickPhoto={() => void pickPhoto(spot.key)}
          />
        ))}
      </ScrollView>
    </HearthSheet>
  );
}

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
  block: {
    marginBottom: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  label: {
    ...DesignSystem.typography.body,
    fontWeight: "600",
    flex: 1,
  },
  status: {
    ...DesignSystem.typography.caption,
    fontSize: 11,
    fontWeight: "600",
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.md,
    minHeight: 44,
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  thumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  photoAction: {
    paddingVertical: 4,
  },
});
