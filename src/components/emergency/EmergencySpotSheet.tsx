import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { Button } from "../ui/Button";
import { HearthSheet } from "../ui/HearthSheet";
import { showActionMenu } from "../../utils/actionMenu";
import { EmergencySpotView } from "./emergencySpots";
import {
  deleteEmergencyPhoto,
  pickEmergencyPhoto,
  PhotoSource,
  uploadEmergencyPhoto,
} from "./emergencyPhoto";

export interface EmergencySpotDraft {
  label: string;
  note: string;
  howto: string;
  photoPath: string | null;
}

export function EmergencySpotSheet({
  visible,
  spot,
  photoUri,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  spot: EmergencySpotView | null;
  /** Signed URL for the spot's current photo. */
  photoUri: string | null;
  onClose: () => void;
  onSave: (draft: EmergencySpotDraft) => Promise<boolean>;
  onDelete?: () => void;
}) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { triggerLight } = useHaptics();
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [howto, setHowto] = useState("");
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const howtoRef = useRef<TextInput>(null);
  const uploadedRef = useRef<string[]>([]);

  useEffect(() => {
    if (!visible || !spot) return;
    uploadedRef.current = [];
    setLabel(spot.builtInKey ? spot.label : spot.filled ? spot.label : "");
    setNote(spot.note);
    setHowto(spot.howto);
    setPhotoPath(spot.photoPath);
    setPreview(spot.photoPath ? photoUri : null);
    setUploading(false);
    setSaving(false);
    // Reset only when a sheet opens for a spot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, spot?.id]);

  if (!spot) return null;
  const isCustom = spot.builtInKey == null;
  const hasContent = Boolean(
    note.trim() || howto.trim() || photoPath || (isCustom && label.trim())
  );

  const addPhoto = async (source: PhotoSource) => {
    if (!user) return;
    const localUri = await pickEmergencyPhoto(source);
    if (!localUri) return;
    const previousPreview = preview;
    setPreview(localUri);
    setUploading(true);
    const result = await uploadEmergencyPhoto(
      user.id,
      spot.storageKey,
      localUri
    );
    setUploading(false);
    if (result.path) {
      uploadedRef.current.push(result.path);
      setPhotoPath(result.path);
    } else {
      setPreview(previousPreview);
      Alert.alert("Couldn't upload photo", result.error ?? "Please try again.");
    }
  };

  const openPhotoMenu = () => {
    triggerLight();
    showActionMenu({
      title: preview ? "Replace photo" : "Add a photo",
      options: [
        {
          label: "Take photo",
          icon: "camera-outline",
          onPress: () => void addPhoto("camera"),
        },
        {
          label: "Choose from library",
          icon: "images-outline",
          onPress: () => void addPhoto("library"),
        },
        ...(preview
          ? [
              {
                label: "Remove photo",
                icon: "trash-outline" as const,
                destructive: true,
                onPress: () => {
                  setPhotoPath(null);
                  setPreview(null);
                },
              },
            ]
          : []),
      ],
    });
  };

  /** Drops photos uploaded in this session that didn't end up saved. */
  const discardUploads = (keep: string | null) => {
    if (user) {
      uploadedRef.current
        .filter((path) => path !== keep)
        .forEach((path) => deleteEmergencyPhoto(user.id, path));
    }
    uploadedRef.current = [];
  };

  const close = () => {
    if (uploading) return;
    discardUploads(null);
    onClose();
  };

  const save = async () => {
    if (saving || uploading) return;
    setSaving(true);
    const ok = await onSave({
      label: isCustom ? label.trim() : spot.label,
      note: note.trim(),
      howto: howto.trim(),
      photoPath,
    });
    setSaving(false);
    if (ok) {
      discardUploads(photoPath);
      onClose();
    }
  };

  return (
    <HearthSheet
      visible={visible}
      onClose={close}
      title={isCustom ? (spot.filled ? "Edit spot" : "New spot") : spot.label}
      maxHeightRatio={0.94}
      footer={
        <View style={styles.footer}>
          <Button
            label={uploading ? "Uploading photo…" : saving ? "Saving…" : "Save"}
            onPress={() => void save()}
            disabled={saving || uploading || (isCustom && !hasContent)}
            loading={saving}
          />
          {onDelete ? (
            <Pressable
              onPress={onDelete}
              style={styles.delete}
              accessibilityRole="button"
            >
              <Text style={[styles.deleteText, { color: colors.error }]}>
                {isCustom ? "Delete spot" : "Clear this spot"}
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
        <Pressable
          onPress={openPhotoMenu}
          disabled={uploading}
          style={[
            styles.photo,
            {
              backgroundColor: spot.tint + "14",
              borderColor: spot.tint + "40",
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={preview ? "Replace photo" : "Add a photo"}
        >
          {preview ? (
            <Image source={{ uri: preview }} style={styles.photoImage} />
          ) : (
            <View style={styles.photoEmpty}>
              <View
                style={[
                  styles.photoIcon,
                  { backgroundColor: spot.tint + "26" },
                ]}
              >
                <Ionicons name="camera" size={24} color={spot.tint} />
              </View>
              <Text style={[styles.photoTitle, { color: colors.text }]}>
                Add a photo
              </Text>
              <Text style={[styles.photoHint, { color: colors.textSecondary }]}>
                A clear shot of the valve or switch helps anyone find it fast.
              </Text>
            </View>
          )}
          {uploading ? (
            <View style={styles.uploading}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : preview ? (
            <View style={styles.photoBadge}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
              <Text style={styles.photoBadgeText}>Change</Text>
            </View>
          ) : null}
        </Pressable>

        {isCustom ? (
          <>
            <Label text="Name" />
            <Input
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. Sump pump, outdoor spigot"
              autoCapitalize="sentences"
            />
          </>
        ) : null}

        <Label text="Where it is" />
        <Input
          value={note}
          onChangeText={setNote}
          placeholder={spot.hint}
          autoCapitalize="sentences"
          returnKeyType="next"
          onSubmitEditing={() => howtoRef.current?.focus()}
          submitBehavior="submit"
        />

        <Label text={isCustom ? "What to do" : "How to shut it off"} />
        <Input
          ref={howtoRef}
          value={howto}
          onChangeText={setHowto}
          placeholder={spot.howtoHint}
          autoCapitalize="sentences"
          multiline
          style={styles.multiline}
        />

        {spot.safety ? (
          <View
            style={[
              styles.safety,
              {
                backgroundColor: colors.error + "12",
                borderColor: colors.error + "33",
              },
            ]}
          >
            <Ionicons name="warning" size={16} color={colors.error} />
            <Text style={[styles.safetyText, { color: colors.text }]}>
              {spot.safety}
            </Text>
          </View>
        ) : null}
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

const Input = React.forwardRef<
  TextInput,
  React.ComponentProps<typeof TextInput>
>(function Input({ style, ...props }, ref) {
  const { colors } = useTheme();
  return (
    <TextInput
      ref={ref}
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
});

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
  scroll: {
    paddingBottom: DesignSystem.spacing.md,
  },
  photo: {
    aspectRatio: 16 / 10,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoEmpty: {
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.xl,
    gap: DesignSystem.spacing.xs,
  },
  photoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.xs,
  },
  photoTitle: {
    ...DesignSystem.typography.bodySemiBold,
  },
  photoHint: {
    ...DesignSystem.typography.caption,
    textAlign: "center",
  },
  uploading: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoBadge: {
    position: "absolute",
    right: DesignSystem.spacing.sm,
    bottom: DesignSystem.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 4,
    borderRadius: DesignSystem.borders.radius.round,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  photoBadgeText: {
    ...DesignSystem.typography.captionSemiBold,
    color: "#FFFFFF",
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
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
    paddingTop: DesignSystem.spacing.sm + 4,
  },
  safety: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.sm + 4,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  safetyText: {
    ...DesignSystem.typography.footnote,
    flex: 1,
  },
});
