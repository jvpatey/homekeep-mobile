import React, { useEffect, useRef, useState } from "react";
import { View, Text, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useProfile } from "../../../context/ProfileContext";
import { useHaptics } from "../../../hooks";
import {
  GradientPreset,
  useUserPreferences,
} from "../../../context/UserPreferencesContext";
import { Button, GradientPicker, HearthSheet, TintedGlassAvatar } from "../../ui";
import { AvatarCropModal } from "../avatar-crop-modal";
import { AvatarStorageService } from "../../../services/AvatarStorageService";
import { AvatarCrop } from "../../../types/avatar";
import { accountInitial } from "../../../utils/displayName";
import { styles } from "./styles";

interface AvatarCustomizationModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AvatarCustomizationModal({
  visible,
  onClose,
}: AvatarCustomizationModalProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { selectedGradient, updateGradient } = useUserPreferences();
  const {
    avatarUrl,
    profile,
    updateAvatarPhoto,
    removeAvatarPhoto,
  } = useProfile();
  const { triggerLight } = useHaptics();
  const [preview, setPreview] = useState<GradientPreset>(selectedGradient);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [removedPhoto, setRemovedPhoto] = useState(false);
  const [cropVisible, setCropVisible] = useState(false);
  const [sheetHiddenForCrop, setSheetHiddenForCrop] = useState(false);
  const [cropUri, setCropUri] = useState<string | null>(null);
  const [cropSize, setCropSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [cropInitial, setCropInitial] = useState<AvatarCrop | null>(null);
  const [replaceOriginal, setReplaceOriginal] = useState(true);
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      setPreview(selectedGradient);
      setSaving(false);
      setPhotoBusy(false);
      setPreviewUri(null);
      setRemovedPhoto(false);
      setCropVisible(false);
      setSheetHiddenForCrop(false);
      setCropUri(null);
      setCropSize(null);
      setCropInitial(null);
    } else if (visible) {
      setPreview(selectedGradient);
    }
    wasVisibleRef.current = visible;
  }, [visible, selectedGradient]);

  const getUserInitial = () =>
    accountInitial({
      authFullName: user?.user_metadata?.full_name as string | undefined,
      profileFullName: profile?.full_name,
      email: user?.email ?? profile?.email ?? null,
    });

  const shownPhotoUri = removedPhoto ? null : previewUri ?? avatarUrl;
  const hasPhoto = Boolean(shownPhotoUri || profile?.avatar_storage_path);
  const dirty = preview.id !== selectedGradient.id;

  const handleClose = () => {
    void triggerLight();
    onClose();
  };

  const handleSave = async () => {
    if (!dirty || saving) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await updateGradient(preview);
      onClose();
    } catch (error) {
      console.error("Failed to save avatar style:", error);
      setSaving(false);
    }
  };

  const openCropper = (
    uri: string,
    initial: AvatarCrop | null,
    nextReplaceOriginal: boolean,
    size?: { width: number; height: number } | null
  ) => {
    setCropUri(uri);
    setCropInitial(initial);
    setCropSize(size ?? null);
    setReplaceOriginal(nextReplaceOriginal);
    setSheetHiddenForCrop(true);
  };

  const prepareAndCrop = async (uri: string) => {
    setPhotoBusy(true);
    try {
      const prepared = await AvatarStorageService.prepareOriginal(uri);
      openCropper(prepared.uri, null, true, {
        width: prepared.width,
        height: prepared.height,
      });
    } catch (error) {
      console.error("Failed to prepare avatar photo:", error);
      Alert.alert("Couldn't open photo", "Try another image.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const pickFromLibrary = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission needed",
          "Allow photo library access to choose a profile photo."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (result.canceled) return;
      await prepareAndCrop(result.assets[0].uri);
    } catch (error) {
      console.error(error);
      Alert.alert("Photos", "Could not open your photo library.");
    }
  };

  const pickFromCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission needed",
          "Allow camera access to take a profile photo."
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (result.canceled) return;
      await prepareAndCrop(result.assets[0].uri);
    } catch (error) {
      console.error(error);
      Alert.alert("Camera", "Could not open the camera.");
    }
  };

  const handleReposition = async () => {
    const originalPath = profile?.avatar_original_path;
    if (!originalPath) {
      Alert.alert(
        "Choose a new photo",
        "This photo can’t be repositioned. Pick a new one to frame it again."
      );
      return;
    }
    setPhotoBusy(true);
    try {
      const signed = await AvatarStorageService.createSignedUrl(originalPath);
      if (!signed.data) {
        Alert.alert(
          "Couldn't load photo",
          signed.error?.message ?? "Try choosing the photo again."
        );
        return;
      }
      openCropper(signed.data, profile?.avatar_crop ?? null, false);
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert("Remove photo", "Your avatar will use your initial instead.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setPhotoBusy(true);
            setRemovedPhoto(true);
            setPreviewUri(null);
            const result = await removeAvatarPhoto();
            setPhotoBusy(false);
            if (!result.success) {
              setRemovedPhoto(false);
              Alert.alert(
                "Couldn't remove photo",
                result.error ?? "Please try again."
              );
            }
          })();
        },
      },
    ]);
  };

  const handlePhotoActions = () => {
    void triggerLight();
    const buttons: {
      text: string;
      style?: "cancel" | "destructive";
      onPress?: () => void;
    }[] = [
      { text: "Choose photo", onPress: () => void pickFromLibrary() },
      { text: "Take photo", onPress: () => void pickFromCamera() },
    ];
    if (hasPhoto) {
      buttons.push({
        text: "Reposition",
        onPress: () => void handleReposition(),
      });
      buttons.push({
        text: "Remove photo",
        style: "destructive",
        onPress: handleRemovePhoto,
      });
    }
    buttons.push({ text: "Cancel", style: "cancel" });
    Alert.alert(
      hasPhoto ? "Change photo" : "Add photo",
      undefined,
      buttons
    );
  };

  const handleCropCancel = () => {
    setCropVisible(false);
    setSheetHiddenForCrop(false);
    setCropUri(null);
    setCropSize(null);
    setCropInitial(null);
  };

  const handleCropConfirm = async (crop: AvatarCrop) => {
    if (!cropUri) {
      handleCropCancel();
      return;
    }
    const sourceUri = cropUri;
    const shouldReplaceOriginal = replaceOriginal;
    setCropVisible(false);
    setSheetHiddenForCrop(false);
    setCropUri(null);
    setPhotoBusy(true);
    try {
      const display = await AvatarStorageService.cropDisplay(sourceUri, crop);
      setRemovedPhoto(false);
      setPreviewUri(display.uri);
      const result = await updateAvatarPhoto({
        displayUri: display.uri,
        originalUri: shouldReplaceOriginal ? sourceUri : undefined,
        crop: display.crop,
      });
      if (!result.success) {
        setPreviewUri(null);
        Alert.alert(
          "Couldn't save photo",
          result.error ?? "Please try again."
        );
      }
    } catch (error) {
      console.error("Failed to crop avatar:", error);
      setPreviewUri(null);
      Alert.alert("Couldn't save photo", "Please try again.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const footer = (
    <View style={styles.footerRow}>
      <View style={styles.footerButton}>
        <Button
          label="Cancel"
          variant="ghost"
          onPress={handleClose}
          disabled={saving || photoBusy}
        />
      </View>
      <View style={styles.footerButton}>
        <Button
          label="Save"
          onPress={() => void handleSave()}
          disabled={!dirty || photoBusy}
          loading={saving}
        />
      </View>
    </View>
  );

  return (
    <>
      <HearthSheet
        visible={visible && !sheetHiddenForCrop}
        onClose={handleClose}
        onDismissed={() => {
          if (sheetHiddenForCrop && cropUri) {
            setCropVisible(true);
          }
        }}
        title="Avatar"
        footer={footer}
        keyboardAvoiding={false}
        maxHeightRatio={0.88}
      >
        <View style={styles.preview}>
          <TintedGlassAvatar
            size={96}
            gradient={preview}
            initial={getUserInitial()}
            imageUri={shownPhotoUri}
            pressable={false}
            accessibilityLabel={`${preview.name} avatar preview`}
          />
          <Text style={[styles.previewName, { color: colors.text }]}>
            {preview.name}
          </Text>
          <Text style={[styles.previewHint, { color: colors.textSecondary }]}>
            {shownPhotoUri
              ? "Photo and color are used across the app, including shared homes."
              : "Used for your avatar across the app."}
          </Text>
          <View style={styles.photoAction}>
            <Button
              label={hasPhoto ? "Change photo" : "Add photo"}
              variant="secondary"
              onPress={handlePhotoActions}
              loading={photoBusy}
              disabled={saving}
              accessibilityLabel={hasPhoto ? "Change photo" : "Add photo"}
            />
          </View>
        </View>

        <View style={styles.pickerWrap}>
          <GradientPicker selectedId={preview.id} onSelect={setPreview} />
        </View>
      </HearthSheet>

      <AvatarCropModal
        visible={cropVisible}
        imageUri={cropUri}
        imageSize={cropSize}
        initialCrop={cropInitial}
        onCancel={handleCropCancel}
        onConfirm={(crop) => void handleCropConfirm(crop)}
      />
    </>
  );
}
