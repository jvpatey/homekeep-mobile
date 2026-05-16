import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import { useHaptics, useGradients } from "../../hooks";

// Get screen dimensions for responsive design
const { height: screenHeight } = Dimensions.get("window");

// NotificationPermissionRequest component for the NotificationPermissionRequest on the home screen
export function NotificationPermissionRequest() {
  const { colors, isDark } = useTheme();
  const { permissionStatus, syncPushToken } = useNotifications();
  const { triggerMedium, triggerLight } = useHaptics();
  const { glassBorder } = useGradients();
  const [showModal, setShowModal] = useState(false);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Show modal if permissions haven't been requested yet
    if (permissionStatus.status === "undetermined") {
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [permissionStatus.status]);

  // Animate modal when visibility changes
  useEffect(() => {
    if (showModal) {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withTiming(0, { duration: 250 });
      opacity.value = withTiming(0, { duration: 250 });
    }
  }, [showModal]);

  // handleRequestPermissions is a function that requests notification permissions from the user
  const handleRequestPermissions = async () => {
    await triggerMedium();
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
  };

  // handleSkip is a function that skips the notification permission request
  const handleSkip = async () => {
    await triggerLight();
    setShowModal(false);
  };

  // handleBackdropPress function to handle the press of the backdrop
  const handleBackdropPress = () => {
    handleSkip();
  };

  // animatedBackdropStyle function to animate the backdrop
  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // animatedModalStyle function to animate the modal
  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scale.value, [0, 1], [0.9, 1]) }],
    opacity: opacity.value,
  }));

  if (permissionStatus.status !== "undetermined" || !showModal) {
    return null;
  }

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="slide"
      onRequestClose={handleSkip}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <Pressable
          style={styles.backdropPressable}
          onPress={handleBackdropPress}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor: isDark
                  ? "rgba(35, 37, 38, 0.85)"
                  : "rgba(255, 255, 255, 0.85)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.25)"
                  : "rgba(255, 255, 255, 0.9)",
              },
              animatedModalStyle,
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.08)",
                },
              ]}
            >
              <View style={styles.headerContent}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
            Stay on Top of Maintenance
          </Text>
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.05)",
                    },
                  ]}
                  onPress={handleSkip}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[colors.primary + "15", colors.primary + "25"]}
                  style={styles.iconGradient}
                >
                  <Ionicons
                    name="notifications"
                    size={48}
                    color={colors.primary}
                  />
                </LinearGradient>
              </View>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Enable notifications to get reminders when your maintenance tasks
            are due, overdue, or need attention.
          </Text>
            </View>

            {/* Footer Actions */}
            <View
              style={[
                styles.footerActions,
                {
                  borderTopWidth: 1,
                  borderTopColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.08)",
                },
              ]}
            >
              {/* Cancel Button - Glass style */}
              <View style={styles.buttonWrapper}>
                <LinearGradient
                  colors={glassBorder}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.glassBorderGradient}
                >
            <TouchableOpacity
                    style={[
                      styles.cancelButton,
                      {
                        backgroundColor: colors.glass,
                      },
                    ]}
              onPress={handleSkip}
            >
              <Text
                      style={[
                        styles.cancelButtonText,
                        { color: colors.text },
                      ]}
              >
                Later
              </Text>
            </TouchableOpacity>
                </LinearGradient>
              </View>

              {/* Enable Button - Glass style with gradient */}
              <View style={styles.buttonWrapper}>
                <LinearGradient
                  colors={glassBorder}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.glassBorderGradient}
                >
            <TouchableOpacity
                    style={styles.enableButton}
              onPress={handleRequestPermissions}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.secondary]}
                      style={styles.enableButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
            >
              <Text style={styles.enableButtonText}>Enable</Text>
                    </LinearGradient>
            </TouchableOpacity>
                </LinearGradient>
          </View>
        </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  backdropPressable: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  modalContainer: {
    width: "92%",
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 16,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  footerActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 32,
    gap: 12,
  },
  buttonWrapper: {
    flex: 1,
    height: 52,
    borderRadius: 26, // Pill shape (half of height)
    overflow: "hidden",
  },
  glassBorderGradient: {
    flex: 1,
    borderRadius: 26,
    padding: 1, // Creates the border effect
  },
  cancelButton: {
    flex: 1,
    height: "100%",
    borderRadius: 26, // Pill shape
    alignItems: "center",
    justifyContent: "center",
    // Glass effect with backdrop blur simulation
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  enableButton: {
    flex: 1,
    height: "100%",
    borderRadius: 26, // Pill shape
    overflow: "hidden",
    // Glass effect shadow
    shadowColor: "#2EC4B6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  enableButtonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    borderRadius: 26,
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    letterSpacing: 0.1,
  },
});
