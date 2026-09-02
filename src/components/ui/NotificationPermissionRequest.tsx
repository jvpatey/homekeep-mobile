import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import { useHaptics } from "../../hooks";
import { HearthSheet } from "./HearthSheet";
import { Button } from "./Button";
import { DesignSystem } from "../../theme/designSystem";

export function NotificationPermissionRequest() {
  const { colors } = useTheme();
  const { permissionStatus, syncPushToken } = useNotifications();
  const { triggerMedium, triggerLight } = useHaptics();
  const [showModal, setShowModal] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (permissionStatus.status === "undetermined") {
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [permissionStatus.status]);

  const handleRequestPermissions = async () => {
    if (requesting) return;
    await triggerMedium();
    setRequesting(true);
    try {
      const registered = await syncPushToken();

      if (registered) {
        setShowModal(false);
        Alert.alert(
          "Notifications Enabled!",
          "You'll now receive reminders for your maintenance tasks.",
          [{ text: "Great!" }]
        );
      } else {
        setShowModal(false);
        Alert.alert(
          "Notifications Disabled",
          "You can enable notifications later in the app settings.",
          [{ text: "OK" }]
        );
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleSkip = async () => {
    if (requesting) return;
    await triggerLight();
    setShowModal(false);
  };

  if (permissionStatus.status !== "undetermined" || !showModal) {
    return null;
  }

  return (
    <HearthSheet
      visible
      onClose={handleSkip}
      title="Stay on Top of Maintenance"
      keyboardAvoiding={false}
      footer={
        <View style={styles.footer}>
          <Button
            label="Enable notifications"
            onPress={() => void handleRequestPermissions()}
            loading={requesting}
            disabled={requesting}
          />
          <Button
            label="Later"
            variant="ghost"
            onPress={() => void handleSkip()}
            disabled={requesting}
          />
        </View>
      }
    >
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Get reminders when your maintenance tasks are due, overdue, or need
        attention.
      </Text>
    </HearthSheet>
  );
}

const styles = StyleSheet.create({
  description: {
    ...DesignSystem.typography.callout,
    lineHeight: 24,
    paddingBottom: DesignSystem.spacing.md,
  },
  footer: {
    gap: DesignSystem.spacing.xs,
  },
});
