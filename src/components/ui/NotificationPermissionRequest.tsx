import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import { useHaptics } from "../../hooks";

// Get screen dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const isSmallScreen = screenWidth < 375 || screenHeight < 667;

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
                Later
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.enableButton, { backgroundColor: colors.primary }]}
              onPress={handleRequestPermissions}
            >
              <Text style={styles.enableButtonText}>Enable</Text>
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
    paddingHorizontal: isSmallScreen ? 16 : 20,
  },
  modal: {
    borderRadius: isSmallScreen ? 20 : 24,
    padding: isSmallScreen ? 24 : 32,
    alignItems: "center",
    maxWidth: isSmallScreen ? screenWidth - 32 : 320,
    width: "100%",
    maxHeight: screenHeight * 0.8,
  },
  iconContainer: {
    width: isSmallScreen ? 64 : 80,
    height: isSmallScreen ? 64 : 80,
    borderRadius: isSmallScreen ? 32 : 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: isSmallScreen ? 20 : 24,
  },
  title: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: isSmallScreen ? 12 : 16,
    lineHeight: isSmallScreen ? 28 : 32,
  },
  description: {
    fontSize: isSmallScreen ? 14 : 16,
    textAlign: "center",
    lineHeight: isSmallScreen ? 20 : 24,
    marginBottom: isSmallScreen ? 24 : 32,
    paddingHorizontal: isSmallScreen ? 8 : 0,
  },
  buttonContainer: {
    flexDirection: isSmallScreen ? "column" : "row",
    gap: isSmallScreen ? 8 : 12,
    width: "100%",
  },
  skipButton: {
    flex: isSmallScreen ? 0 : 1,
    paddingVertical: isSmallScreen ? 14 : 16,
    paddingHorizontal: isSmallScreen ? 20 : 24,
    borderRadius: isSmallScreen ? 10 : 12,
    borderWidth: 1,
    alignItems: "center",
    width: isSmallScreen ? "100%" : undefined,
  },
  skipButtonText: {
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: "600",
    textAlign: "center",
    numberOfLines: 1,
  },
  enableButton: {
    flex: isSmallScreen ? 0 : 2,
    paddingVertical: isSmallScreen ? 14 : 16,
    paddingHorizontal: isSmallScreen ? 20 : 24,
    borderRadius: isSmallScreen ? 10 : 12,
    alignItems: "center",
    width: isSmallScreen ? "100%" : undefined,
  },
  enableButtonText: {
    color: "white",
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: "600",
    textAlign: "center",
    numberOfLines: 1,
  },
});
