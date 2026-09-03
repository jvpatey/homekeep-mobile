import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, Keyboard } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useProfile } from "../../../context/ProfileContext";
import { useHaptics } from "../../../hooks";
import { Button, HearthSheet, TextField } from "../../ui";
import { DesignSystem } from "../../../theme/designSystem";
import {
  hasAccountName,
  joinDisplayName,
  splitDisplayName,
} from "../../../utils/displayName";

interface EditNameModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EditNameModal({ visible, onClose }: EditNameModalProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { profile, updateDisplayName } = useProfile();
  const { triggerLight } = useHaptics();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [saving, setSaving] = useState(false);

  const storedName =
    (typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "") ||
    profile?.full_name ||
    "";

  useEffect(() => {
    if (!visible) {
      setSaving(false);
      return;
    }
    const parts = splitDisplayName(
      hasAccountName({
        authFullName: user?.user_metadata?.full_name as string | undefined,
        profileFullName: profile?.full_name,
      })
        ? storedName
        : ""
    );
    setFirst(parts.first);
    setLast(parts.last);
    setSaving(false);
    // Snapshot on open only — profile updates mid-save should not reset the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const nextName = joinDisplayName(first, last);
  const dirty = nextName !== storedName.trim();

  const handleClose = () => {
    Keyboard.dismiss();
    void triggerLight();
    onClose();
  };

  const handleSave = async () => {
    if (!nextName || saving) return;
    setSaving(true);
    Keyboard.dismiss();
    handleClose();
    try {
      const result = await updateDisplayName(nextName);
      if (!result.success) {
        Alert.alert("Couldn't save name", result.error ?? "Please try again.");
      }
    } catch {
      Alert.alert("Couldn't save name", "Please try again.");
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
          disabled={!nextName || !dirty}
          loading={saving}
        />
      </View>
    </View>
  );

  return (
    <HearthSheet
      visible={visible}
      onClose={handleClose}
      title="Your name"
      footer={footer}
      keyboardAvoiding
      maxHeightRatio={0.88}
      embedded
    >
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Used on your account and in a shared home.
      </Text>
      <TextField
        label="First name"
        value={first}
        onChangeText={setFirst}
        autoCapitalize="words"
        autoCorrect={false}
        textContentType="givenName"
        returnKeyType="next"
      />
      <View style={styles.fieldGap} />
      <TextField
        label="Last name"
        value={last}
        onChangeText={setLast}
        autoCapitalize="words"
        autoCorrect={false}
        textContentType="familyName"
        returnKeyType="done"
        onSubmitEditing={() => void handleSave()}
      />
    </HearthSheet>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...DesignSystem.typography.footnote,
    marginBottom: DesignSystem.spacing.md,
  },
  fieldGap: {
    height: DesignSystem.spacing.md,
  },
  footerRow: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
});
