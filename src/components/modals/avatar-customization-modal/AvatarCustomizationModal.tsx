import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useHaptics } from "../../../hooks";
import {
  GradientPreset,
  useUserPreferences,
} from "../../../context/UserPreferencesContext";
import { Button, GradientPicker, HearthSheet, TintedGlassAvatar } from "../../ui";
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
  const { triggerLight } = useHaptics();
  const [preview, setPreview] = useState<GradientPreset>(selectedGradient);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setPreview(selectedGradient);
      setSaving(false);
    }
  }, [visible, selectedGradient]);

  const getUserInitial = () => {
    const fullName = user?.user_metadata?.full_name;
    if (fullName) return fullName.split(" ")[0].charAt(0).toUpperCase();
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

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

  const footer = (
    <View style={styles.footerRow}>
      <View style={styles.footerButton}>
        <Button
          label="Cancel"
          variant="ghost"
          onPress={handleClose}
          disabled={saving}
        />
      </View>
      <View style={styles.footerButton}>
        <Button
          label="Save"
          onPress={() => void handleSave()}
          disabled={!dirty}
          loading={saving}
        />
      </View>
    </View>
  );

  return (
    <HearthSheet
      visible={visible}
      onClose={handleClose}
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
          pressable={false}
          accessibilityLabel={`${preview.name} avatar preview`}
        />
        <Text style={[styles.previewName, { color: colors.text }]}>
          {preview.name}
        </Text>
        <Text style={[styles.previewHint, { color: colors.textSecondary }]}>
          Used for your avatar across the app.
        </Text>
      </View>

      <View style={styles.pickerWrap}>
        <GradientPicker selectedId={preview.id} onSelect={setPreview} />
      </View>
    </HearthSheet>
  );
}
