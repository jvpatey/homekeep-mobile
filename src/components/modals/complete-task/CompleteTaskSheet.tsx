import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { HearthSheet } from "../../ui/HearthSheet";
import { Button } from "../../ui/Button";
import { DesignSystem } from "../../../theme/designSystem";
import { MaintenanceTask } from "../../../types/maintenance";
import { EquipmentManualService } from "../../../services/EquipmentManualService";
import { ChoiceRow } from "../../../screens/maintenance-plans/questionnaireChrome";

interface CompleteTaskSheetProps {
  visible: boolean;
  task: MaintenanceTask | null;
  onClose: () => void;
  onSubmit: (
    instanceId: string,
    extras: {
      notes?: string;
      cost_amount?: number | null;
      labor_type?: "diy" | "hired" | null;
      photo_storage_path?: string | null;
    }
  ) => Promise<boolean>;
}

export function CompleteTaskSheet({
  visible,
  task,
  onClose,
  onSubmit,
}: CompleteTaskSheetProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [notes, setNotes] = useState("");
  const [cost, setCost] = useState("");
  const [labor, setLabor] = useState<"diy" | "hired" | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setNotes("");
    setCost("");
    setLabor(null);
    setPhotoUri(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async (skipExtras: boolean) => {
    if (!task || saving) return;
    setSaving(true);
    try {
      let photo_storage_path: string | null = null;
      if (!skipExtras && photoUri && user) {
        const path = `${user.id}/completions/${task.instance_id}.jpg`;
        const uploaded = await EquipmentManualService.uploadFromUriPublic(
          path,
          photoUri,
          "image/jpeg"
        );
        photo_storage_path = uploaded.path;
      }
      const cost_amount =
        !skipExtras && cost.trim() ? Number(cost) : null;
      const ok = await onSubmit(task.instance_id, skipExtras
        ? {}
        : {
            notes: notes.trim() || undefined,
            cost_amount: Number.isFinite(cost_amount as number)
              ? cost_amount
              : null,
            labor_type: labor,
            photo_storage_path,
          });
      if (ok) {
        reset();
        onClose();
      }
    } catch (error) {
      Alert.alert("Couldn't complete", "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <HearthSheet
      visible={visible}
      onClose={handleClose}
      title={task ? `Complete · ${task.title}` : "Complete"}
      footer={
        <View style={styles.footer}>
          <Button
            label={saving ? "Saving…" : "Save to home record"}
            onPress={() => void handleSave(false)}
            disabled={saving}
          />
          <Button
            label="Just complete"
            variant="ghost"
            onPress={() => void handleSave(true)}
            disabled={saving}
          />
        </View>
      }
    >
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Optional details stay with this house — useful for buyers, insurance,
        and the next time you do this job.
      </Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Who did it?</Text>
      <ChoiceRow
        label="I did it"
        selected={labor === "diy"}
        onPress={() => setLabor("diy")}
        accessibilityLabel="I did it"
      />
      <ChoiceRow
        label="I hired someone"
        selected={labor === "hired"}
        onPress={() => setLabor("hired")}
        accessibilityLabel="I hired someone"
      />
      <Text style={[styles.label, { color: colors.textSecondary }]}>Note</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="What did you do?"
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.fieldFill },
        ]}
        multiline
      />
      <Text style={[styles.label, { color: colors.textSecondary }]}>Cost</Text>
      <TextInput
        value={cost}
        onChangeText={setCost}
        placeholder="0"
        keyboardType="decimal-pad"
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.fieldFill },
        ]}
      />
      <Pressable onPress={() => void pickPhoto()} style={styles.photoBtn}>
        <Text style={{ color: colors.primary, fontWeight: "600" }}>
          {photoUri ? "Photo attached" : "Add a photo"}
        </Text>
      </Pressable>
    </HearthSheet>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...DesignSystem.typography.footnote,
    marginBottom: DesignSystem.spacing.md,
    lineHeight: 20,
  },
  label: {
    ...DesignSystem.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: DesignSystem.spacing.xs,
    marginTop: DesignSystem.spacing.sm,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.md,
    minHeight: 44,
    marginBottom: DesignSystem.spacing.sm,
  },
  photoBtn: {
    minHeight: DesignSystem.components.minTouchTarget,
    justifyContent: "center",
  },
  footer: {
    gap: DesignSystem.spacing.xs,
  },
});
