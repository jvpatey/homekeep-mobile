import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import { useHaptics, useScreenInsets } from "../../hooks";
import { HearthScreen } from "../../components/ui";
import { NotificationPreferences } from "../../types/notifications";
import { notificationPreferencesStyles } from "./styles";
import {
  NotificationPreferencesScreenProps,
  getNotificationTypeConfig,
  isNotificationTypeEnabled,
  getNotificationTypes,
} from "./utils";

export function NotificationPreferencesScreen({
  navigation,
}: NotificationPreferencesScreenProps) {
  const { colors } = useTheme();
  const {
    notificationSettings,
    updateNotificationTypeForAllCategories,
    updateGlobalNotificationSettings,
    permissionStatus,
    syncPushToken,
  } = useNotifications();
  const { triggerLight } = useHaptics();
  const { scrollPaddingBottom } = useScreenInsets();

  const handleGlobalToggle = async (enabled: boolean) => {
    await triggerLight();
    await updateGlobalNotificationSettings(enabled);
  };

  const handleNotificationTypeToggle = async (
    type: string,
    enabled: boolean
  ) => {
    await triggerLight();
    await updateNotificationTypeForAllCategories(
      type as keyof NotificationPreferences,
      enabled
    );
  };

  const handleEnablePermissions = async () => {
    await triggerLight();
    if (permissionStatus.canAskAgain) {
      const registered = await syncPushToken();
      if (!registered) {
        Alert.alert(
          "Notifications Not Enabled",
          "Allow notifications when prompted to receive task reminders."
        );
      }
      return;
    }
    await Linking.openSettings();
  };

  const renderNotificationTypeSection = (type: string) => {
    const config = getNotificationTypeConfig(type, colors);
    if (!config) return null;

    const isEnabled = isNotificationTypeEnabled(type, notificationSettings);

    return (
      <View
        key={type}
        style={[
          notificationPreferencesStyles.notificationTypeSection,
          { backgroundColor: colors.surface },
        ]}
      >
        <View style={notificationPreferencesStyles.notificationTypeHeader}>
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
                name={config.icon as keyof typeof Ionicons.glyphMap}
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
          <Switch
            value={isEnabled}
            onValueChange={(value) =>
              handleNotificationTypeToggle(type, value)
            }
            trackColor={{ false: colors.border, true: colors.primary + "40" }}
            thumbColor={isEnabled ? colors.primary : colors.textSecondary}
          />
        </View>
      </View>
    );
  };

  return (
    <HearthScreen style={notificationPreferencesStyles.container}>
      <View
        style={[
          notificationPreferencesStyles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
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
        contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}
        showsVerticalScrollIndicator={false}
      >
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
            <TouchableOpacity
              style={[
                notificationPreferencesStyles.permissionButton,
                { backgroundColor: colors.error },
              ]}
              onPress={() =>
                permissionStatus.canAskAgain
                  ? void handleEnablePermissions()
                  : void Linking.openSettings()
              }
            >
              <Text
                style={notificationPreferencesStyles.permissionButtonText}
              >
                {permissionStatus.canAskAgain ? "Enable" : "Open Settings"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
              Choose which reminders you want
            </Text>

            {getNotificationTypes().map((type) =>
              renderNotificationTypeSection(type)
            )}
          </>
        )}
      </ScrollView>
    </HearthScreen>
  );
}
