import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import { useHaptics } from "../../hooks";

// NotificationPermissionRequest component for the NotificationPermissionRequest on the home screen
export function NotificationPermissionRequest() {
  const { colors } = useTheme();
  const { permissionStatus, requestPermissions } = useNotifications();
  const { triggerMedium } = useHaptics();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Show modal if permissions haven't been requested yet
    if (permissionStatus.status === "undetermined") {
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [permissionStatus.status]);

  // handleRequestPermissions is a function that requests notification permissions from the user
  const handleRequestPermissions = async () => {
    await triggerMedium();
    const result = await requestPermissions();

    if (result.granted) {
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
  };

  // handleSkip is a function that skips the notification permission request
  const handleSkip = async () => {
    await triggerMedium();
    setShowModal(false);
  };

  if (permissionStatus.status !== "undetermined" || !showModal) {
    return null;
  }

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[colors.primary + "15", colors.primary + "25"]}
            style={styles.iconContainer}
          >
            <Ionicons name="notifications" size={48} color={colors.primary} />
          </LinearGradient>

          <Text style={[styles.title, { color: colors.text }]}>
            Stay on Top of Maintenance
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Enable notifications to get reminders when your maintenance tasks
            are due, overdue, or need attention.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.skipButton, { borderColor: colors.border }]}
              onPress={handleSkip}
            >
              <Text
                style={[styles.skipButtonText, { color: colors.textSecondary }]}
              >
                Maybe Later
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.enableButton, { backgroundColor: colors.primary }]}
              onPress={handleRequestPermissions}
            >
              <Text style={styles.enableButtonText}>Enable Notifications</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modal: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    maxWidth: 320,
    width: "100%",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  enableButton: {
    flex: 2,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  enableButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
