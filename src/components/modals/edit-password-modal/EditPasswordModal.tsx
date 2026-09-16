import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, Keyboard } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useHaptics } from "../../../hooks";
import { Button, HearthSheet, TextField } from "../../ui";
import { DesignSystem } from "../../../theme/designSystem";

interface EditPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EditPasswordModal({ visible, onClose }: EditPasswordModalProps) {
  const { colors } = useTheme();
  const { changePassword } = useAuth();
  const { triggerLight } = useHaptics();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setSaving(false);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSaving(false);
  }, [visible]);

  const handleClose = () => {
    Keyboard.dismiss();
    void triggerLight();
    onClose();
  };

  const validate = (): string | null => {
    if (!currentPassword) return "Enter your current password.";
    if (newPassword.length < 8) {
      return "New password must be at least 8 characters.";
    }
    if (newPassword !== confirmPassword) {
      return "New passwords don’t match.";
    }
    if (currentPassword === newPassword) {
      return "New password must be different from your current password.";
    }
    return null;
  };

  const handleSave = async () => {
    if (saving) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    Keyboard.dismiss();
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (!result.success) {
        setError(result.error ?? "Please try again.");
        setSaving(false);
        return;
      }
      handleClose();
      Alert.alert("Password updated", "Your password has been changed.");
    } catch {
      setError("Please try again.");
      setSaving(false);
    }
  };

  const canSave =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0;

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
          disabled={!canSave}
          loading={saving}
        />
      </View>
    </View>
  );

  return (
    <HearthSheet
      visible={visible}
      onClose={handleClose}
      title="Change password"
      footer={footer}
      keyboardAvoiding
      maxHeightRatio={0.88}
      embedded
    >
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Use at least 8 characters for your new password.
      </Text>
      <TextField
        label="Current password"
        value={currentPassword}
        onChangeText={(text) => {
          setCurrentPassword(text);
          setError(null);
        }}
        secureToggle
        autoComplete="password"
        textContentType="password"
        returnKeyType="next"
      />
      <TextField
        label="New password"
        value={newPassword}
        onChangeText={(text) => {
          setNewPassword(text);
          setError(null);
        }}
        secureToggle
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
      />
      <TextField
        label="Confirm new password"
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          setError(null);
        }}
        secureToggle
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={() => void handleSave()}
        error={error ?? undefined}
      />
    </HearthSheet>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...DesignSystem.typography.footnote,
    marginBottom: DesignSystem.spacing.md,
  },
  footerRow: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
});
