import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import { useHaptics } from "../../hooks";
import { HOME_MAINTENANCE_CATEGORIES } from "../../types/maintenance";
import { MaintenanceCategory } from "../../types/maintenance";
import { notificationPreferencesStyles } from "./styles";
import {
  NotificationPreferencesScreenProps,
  getNotificationTypeConfig,
  isNotificationTypeEnabled,
  getNotificationTypes,
} from "./utils";

// NotificationPreferencesScreen for the NotificationPreferencesScreen on the home screen
export function NotificationPreferencesScreen({
  navigation,
}: NotificationPreferencesScreenProps) {
  const { colors, isDark } = useTheme();
  const {
    notificationSettings,
    updateNotificationPreferences,
    updateGlobalNotificationSettings,
    permissionStatus,
  } = useNotifications();
  const { triggerLight } = useHaptics();
  const [expandedType, setExpandedType] = useState<string | null>(null);

  // handleGlobalToggle for the handleGlobalToggle on the home screen
  const handleGlobalToggle = async (enabled: boolean) => {
    await triggerLight();
    await updateGlobalNotificationSettings(enabled);
  };

  // handleNotificationTypeToggle for the handleNotificationTypeToggle on the home screen
  const handleNotificationTypeToggle = async (
    type: string,
    enabled: boolean
  ) => {
    await triggerLight();

    // Update all categories for this notification type
    Object.keys(notificationSettings.categories).forEach((category) => {
      updateNotificationPreferences(category as MaintenanceCategory, {
        [type]: enabled,
      });
    });
  };

  // toggleTypeExpansion for the toggleTypeExpansion on the home screen
  const toggleTypeExpansion = (type: string) => {
    setExpandedType(expandedType === type ? null : type);
  };

  // requestPermissions for the requestPermissions on the home screen
  const requestPermissions = async () => {
    if (!permissionStatus.granted && permissionStatus.canAskAgain) {
      Alert.alert(
        "Enable Notifications",
        "To receive task reminders, please enable notifications in your device settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Settings", onPress: () => navigation.navigate("Settings") },
        ]
      );
    } else if (!permissionStatus.granted) {
      Alert.alert(
        "Notifications Disabled",
        "Notifications are disabled. Please enable them in your device settings to receive task reminders.",
        [{ text: "OK" }]
      );
    }
  };

  // renderNotificationTypeSection for the renderNotificationTypeSection on the home screen
  const renderNotificationTypeSection = (type: string) => {
    const config = getNotificationTypeConfig(type, colors);
    if (!config) return null;

    // Check if this type is enabled for any category
    const isEnabled = isNotificationTypeEnabled(type, notificationSettings);
    const isExpanded = expandedType === type;

    return (
      <View
        key={type}
        style={[
          notificationPreferencesStyles.notificationTypeSection,
          { backgroundColor: colors.surface },
        ]}
      >
        <TouchableOpacity
          style={notificationPreferencesStyles.notificationTypeHeader}
          onPress={() => toggleTypeExpansion(type)}
        >
          <View
            style={notificationPreferencesStyles.notificationTypeHeaderLeft}
          >
            <View
              style={[
                notificationPreferencesStyles.notificationTypeIcon,
                { backgroundColor: config.color + "15" },
              ]}
            >
              <Ionicons
                name={config.icon as any}
                size={20}
                color={config.color}
              />
            </View>
            <View style={notificationPreferencesStyles.notificationTypeInfo}>
              <Text
                style={[
                  notificationPreferencesStyles.notificationTypeName,
                  { color: colors.text },
                ]}
              >
                {config.title}
              </Text>
              <Text
                style={[
                  notificationPreferencesStyles.notificationTypeDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {config.description}
              </Text>
            </View>
          </View>
          <View
            style={notificationPreferencesStyles.notificationTypeHeaderRight}
          >
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
              style={notificationPreferencesStyles.expandIcon}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={notificationPreferencesStyles.categoriesContainer}>
            <Text
              style={[
                notificationPreferencesStyles.categoriesTitle,
                { color: colors.textSecondary },
              ]}
            >
              Categories
            </Text>
            <Text
              style={[
                notificationPreferencesStyles.categoriesDescription,
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
                <View
                  key={category}
                  style={notificationPreferencesStyles.categoryRow}
                >
                  <View style={notificationPreferencesStyles.categoryRowLeft}>
                    <LinearGradient
                      colors={categoryData.gradient}
                      style={notificationPreferencesStyles.categoryRowIcon}
                    >
                      <Ionicons
                        name={categoryData.icon as any}
                        size={16}
                        color="white"
                      />
                    </LinearGradient>
                    <Text
                      style={[
                        notificationPreferencesStyles.categoryRowName,
                        { color: colors.text },
                      ]}
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

  // return the NotificationPreferencesScreen on the home screen
  return (
    <View
      style={[
        notificationPreferencesStyles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <View
        style={[
          notificationPreferencesStyles.header,
          { backgroundColor: colors.surface },
        ]}
      >
        <TouchableOpacity
          style={notificationPreferencesStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[
            notificationPreferencesStyles.headerTitle,
            { color: colors.text },
          ]}
        >
          Notification Settings
        </Text>
        <View style={notificationPreferencesStyles.headerSpacer} />
      </View>

      <ScrollView
        style={notificationPreferencesStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Global Settings */}
        <View
          style={[
            notificationPreferencesStyles.globalSection,
            { backgroundColor: colors.surface },
          ]}
        >
          <View style={notificationPreferencesStyles.globalHeader}>
            <View style={notificationPreferencesStyles.globalHeaderLeft}>
              <View
                style={[
                  notificationPreferencesStyles.globalIcon,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name="notifications"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={notificationPreferencesStyles.globalInfo}>
                <Text
                  style={[
                    notificationPreferencesStyles.globalTitle,
                    { color: colors.text },
                  ]}
                >
                  All Notifications
                </Text>
                <Text
                  style={[
                    notificationPreferencesStyles.globalDescription,
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
              trackColor={{ false: colors.border, true: colors.primary + "40" }}
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
              notificationPreferencesStyles.permissionSection,
              { backgroundColor: colors.error + "15" },
            ]}
          >
            <View style={notificationPreferencesStyles.permissionContent}>
              <Ionicons name="warning" size={20} color={colors.error} />
              <Text
                style={[
                  notificationPreferencesStyles.permissionText,
                  { color: colors.error },
                ]}
              >
                {permissionStatus.canAskAgain
                  ? "Notifications are disabled. Enable them to receive task reminders."
                  : "Notifications are blocked. Please enable them in device settings."}
              </Text>
            </View>
            {permissionStatus.canAskAgain && (
              <TouchableOpacity
                style={[
                  notificationPreferencesStyles.permissionButton,
                  { backgroundColor: colors.error },
                ]}
                onPress={requestPermissions}
              >
                <Text
                  style={notificationPreferencesStyles.permissionButtonText}
                >
                  Enable
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Notification Type Settings - Only show when notifications are enabled */}
        {notificationSettings.globalEnabled && (
          <>
            <Text
              style={[
                notificationPreferencesStyles.sectionTitle,
                { color: colors.textSecondary },
              ]}
            >
              Notification Types
            </Text>
            <Text
              style={[
                notificationPreferencesStyles.sectionDescription,
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

        <View style={notificationPreferencesStyles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}
