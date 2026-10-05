import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { HearthSheet } from "../../ui/HearthSheet";
import { Button } from "../../ui/Button";
import { DesignSystem } from "../../../theme/designSystem";
import { CompletionExtras, MaintenanceTask } from "../../../types/maintenance";
import { RecordDetailsFields } from "../../record/RecordDetailsFields";
import { ProPicker } from "../../pros/ProPicker";
import {
  EMPTY_RECORD_DETAILS,
  RecordDetailsValue,
  hasRecordDetails,
  recordDetailsToExtras,
  uploadRecordPhoto,
} from "../../record/recordDetails";

interface CompleteTaskSheetProps {
  visible: boolean;
  task: MaintenanceTask | null;
  onClose: () => void;
  onSubmit: (instanceId: string, extras: CompletionExtras) => Promise<boolean>;
}

export function CompleteTaskSheet({
  visible,
  task,
  onClose,
  onSubmit,
}: CompleteTaskSheetProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [details, setDetails] = useState<RecordDetailsValue>(EMPTY_RECORD_DETAILS);
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setDetails(EMPTY_RECORD_DETAILS);
    onClose();
  };

  const handleSave = async (skipExtras: boolean) => {
    if (!task || saving) return;
    setSaving(true);
    try {
      let photoPath: string | null = null;
      if (!skipExtras && details.photoUri && user) {
        photoPath = await uploadRecordPhoto(user.id, task.instance_id, details.photoUri);
        if (!photoPath) {
          Alert.alert(
            "Photo didn't upload",
            "Your other details will still be saved. You can try the photo again later."
          );
        }
      }
      const ok = await onSubmit(
        task.instance_id,
        skipExtras ? {} : recordDetailsToExtras(details, photoPath)
      );
      if (ok) {
        setDetails(EMPTY_RECORD_DETAILS);
        onClose();
      }
    } catch {
      Alert.alert("Couldn't complete", "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const hasDetails = hasRecordDetails(details);

  return (
    <HearthSheet
      visible={visible}
      onClose={handleClose}
      title={task ? task.title : "Complete"}
      footer={
        <View style={styles.footer}>
          <Button
            label={saving ? "Saving…" : hasDetails ? "Save to home record" : "Mark complete"}
            onPress={() => void handleSave(false)}
            disabled={saving}
          />
          {hasDetails ? (
            <Button
              label="Skip details"
              variant="ghost"
              onPress={() => void handleSave(true)}
              disabled={saving}
            />
          ) : null}
        </View>
      }
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Add details if you like. They stay with the house for buyers,
          insurers, and the next time you do this job.
        </Text>
        <RecordDetailsFields
          value={details}
          onChange={setDetails}
          disabled={saving}
          proSlot={
            <ProPicker
              value={details.contactId}
              onChange={(contactId) =>
                setDetails((prev) => ({ ...prev, contactId }))
              }
            />
          }
        />
      </ScrollView>
    </HearthSheet>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: DesignSystem.spacing.md,
  },
  hint: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
  },
  footer: {
    gap: DesignSystem.spacing.xs,
  },
});
