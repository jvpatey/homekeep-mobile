import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Pressable,
  Dimensions,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useNotifications } from "../../../context/NotificationContext";
import { useHaptics } from "../../../hooks";
import { HOME_MAINTENANCE_CATEGORIES } from "../../../types/maintenance";
import { MaintenanceCategory } from "../../../types/maintenance";
import {
  getNotificationTypeConfig,
  isNotificationTypeEnabled,
  getNotificationTypes,
} from "../../../screens/notification-preferences/utils";
import { styles } from "./styles";

const { height: screenHeight } = Dimensions.get("window");

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationSettingsModal({
  visible,
  onClose,
}: NotificationSettingsModalProps) {
  const { colors, isDark } = useTheme();
  const {
    notificationSettings,
    updateNotificationPreferences,
    updateGlobalNotificationSettings,
    permissionStatus,
  } = useNotifications();
  const { triggerLight } = useHaptics();
  const [expandedType, setExpandedType] = useState<string | null>(null);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Animate modal - faster and more responsive
  React.useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 20, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scale.value, [0, 1], [0.9, 1]) }],
    opacity: opacity.value,
  }));

  const handleClose = async () => {
    await triggerLight();
    onClose();
  };

  const handleBackdropPress = () => {
    handleClose();
  };

  const handleGlobalToggle = async (enabled: boolean) => {
    await triggerLight();
    await updateGlobalNotificationSettings(enabled);
  };

  const handleNotificationTypeToggle = async (
    type: string,
    enabled: boolean
  ) => {
    await triggerLight();
    Object.keys(notificationSettings.categories).forEach((category) => {
      updateNotificationPreferences(category as MaintenanceCategory, {
        [type]: enabled,
      });
    });
  };

  const toggleTypeExpansion = (type: string) => {
    setExpandedType(expandedType === type ? null : type);
  };

  const requestPermissions = async () => {
    if (!permissionStatus.granted && permissionStatus.canAskAgain) {
      Alert.alert(
        "Enable Notifications",
        "To receive task reminders, please enable notifications in your device settings.",
        [{ text: "Cancel", style: "cancel" }, { text: "OK" }]
      );
    } else if (!permissionStatus.granted) {
      Alert.alert(
        "Notifications Disabled",
        "Notifications are disabled. Please enable them in your device settings to receive task reminders.",
        [{ text: "OK" }]
      );
    }
  };

  const renderNotificationTypeSection = (type: string) => {
    const config = getNotificationTypeConfig(type, colors);
    if (!config) return null;

    const isEnabled = isNotificationTypeEnabled(type, notificationSettings);
    const isExpanded = expandedType === type;

    return (
      <View
        key={type}
        style={[
          styles.notificationTypeSection,
          {
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.02)",
          },
        ]}
      >
        <TouchableOpacity
          style={styles.notificationTypeHeader}
          onPress={() => toggleTypeExpansion(type)}
        >
          <View style={styles.notificationTypeHeaderLeft}>
            <View
              style={[
                styles.notificationTypeIcon,
                { backgroundColor: config.color + "15" },
              ]}
            >
              <Ionicons
                name={config.icon as any}
                size={20}
                color={config.color}
              />
            </View>
            <View style={styles.notificationTypeInfo}>
              <Text
                style={[styles.notificationTypeName, { color: colors.text }]}
              >
                {config.title}
              </Text>
              <Text
                style={[
                  styles.notificationTypeDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {config.description}
              </Text>
            </View>
          </View>
          <View style={styles.notificationTypeHeaderRight}>
            <Switch
              value={isEnabled}
              onValueChange={(value) =>
                handleNotificationTypeToggle(type, value)
              }
              trackColor={{ false: colors.border, true: colors.primary + "40" }}
              thumbColor={isEnabled ? colors.primary : colors.textSecondary}
            />
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textSecondary}
              style={styles.expandIcon}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.categoriesContainer}>
            <Text
              style={[styles.categoriesTitle, { color: colors.textSecondary }]}
            >
              Categories
            </Text>
            <Text
              style={[
                styles.categoriesDescription,
                { color: colors.textSecondary },
              ]}
            >
              Choose which maintenance categories receive{" "}
              {config.title.toLowerCase()}
            </Text>

            {Object.keys(HOME_MAINTENANCE_CATEGORIES).map((category) => {
              const categoryData =
                HOME_MAINTENANCE_CATEGORIES[category as MaintenanceCategory];
              const preferences =
                notificationSettings.categories[
                  category as MaintenanceCategory
                ];

              if (!preferences) return null;

              return (
                <View key={category} style={styles.categoryRow}>
                  <View style={styles.categoryRowLeft}>
                    <LinearGradient
                      colors={categoryData.gradient}
                      style={styles.categoryRowIcon}
                    >
                      <Ionicons
                        name={categoryData.icon as any}
                        size={16}
                        color="white"
                      />
                    </LinearGradient>
                    <Text
                      style={[styles.categoryRowName, { color: colors.text }]}
                    >
                      {categoryData.displayName}
                    </Text>
                  </View>
                  <Switch
                    value={
                      preferences[type as keyof typeof preferences] as boolean
                    }
                    onValueChange={(value) =>
                      updateNotificationPreferences(
                        category as MaintenanceCategory,
                        { [type]: value }
                      )
                    }
                    trackColor={{
                      false: colors.border,
                      true: colors.primary + "40",
                    }}
                    thumbColor={
                      (preferences[type as keyof typeof preferences] as boolean)
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
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
                  Notification Settings
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
                  onPress={handleClose}
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
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* Global Settings */}
              <View
                style={[
                  styles.globalSection,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.02)",
                  },
                ]}
              >
                <View style={styles.globalHeader}>
                  <View style={styles.globalHeaderLeft}>
                    <View
                      style={[
                        styles.globalIcon,
                        { backgroundColor: colors.primary + "15" },
                      ]}
                    >
                      <Ionicons
                        name="notifications"
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.globalInfo}>
                      <Text
                        style={[styles.globalTitle, { color: colors.text }]}
                      >
                        All Notifications
                      </Text>
                      <Text
                        style={[
                          styles.globalDescription,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Enable or disable all notifications
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={notificationSettings.globalEnabled}
                    onValueChange={handleGlobalToggle}
                    trackColor={{
                      false: colors.border,
                      true: colors.primary + "40",
                    }}
                    thumbColor={
                      notificationSettings.globalEnabled
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                </View>
              </View>

              {/* Permission Status */}
              {!permissionStatus.granted && (
                <View
                  style={[
                    styles.permissionSection,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 107, 107, 0.1)"
                        : "rgba(255, 107, 107, 0.05)",
                      borderColor: isDark
                        ? "rgba(255, 107, 107, 0.2)"
                        : "rgba(235, 87, 87, 0.2)",
                    },
                  ]}
                >
                  <View style={styles.permissionContent}>
                    <Ionicons name="warning" size={20} color={colors.error} />
                    <Text
                      style={[styles.permissionText, { color: colors.error }]}
                    >
                      {permissionStatus.canAskAgain
                        ? "Notifications are disabled. Enable them to receive task reminders."
                        : "Notifications are blocked. Please enable them in device settings."}
                    </Text>
                  </View>
                  {permissionStatus.canAskAgain && (
                    <TouchableOpacity
                      style={[
                        styles.permissionButton,
                        { backgroundColor: colors.error },
                      ]}
                      onPress={requestPermissions}
                    >
                      <Text style={styles.permissionButtonText}>Enable</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Notification Type Settings */}
              {notificationSettings.globalEnabled && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Notification Types
                  </Text>
                  <Text
                    style={[
                      styles.sectionDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Configure which types of notifications you want to receive
                  </Text>

                  {getNotificationTypes().map((type) =>
                    renderNotificationTypeSection(type)
                  )}
                </>
              )}

              <View style={styles.bottomSpacer} />
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}
