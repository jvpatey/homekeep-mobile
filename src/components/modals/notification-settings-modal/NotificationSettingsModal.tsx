import React from "react";
import { View, Text, ScrollView, Switch, Alert, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useNotifications } from "../../../context/NotificationContext";
import { useHaptics } from "../../../hooks";
import { Button, HearthSheet, HearthSurfaceCard } from "../../ui";
import { NotificationPreferences } from "../../../types/notifications";
import {
  getNotificationTypeConfig,
  isNotificationTypeEnabled,
  getNotificationTypes,
} from "../../../screens/notification-preferences/utils";
import { styles } from "./styles";

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  embedded?: boolean;
}

export function NotificationSettingsModal({
  visible,
  onClose,
  embedded = false,
}: NotificationSettingsModalProps) {
  const { colors } = useTheme();
  const {
    notificationSettings,
    updateNotificationTypeForAllCategories,
    updateGlobalNotificationSettings,
    permissionStatus,
    syncPushToken,
    pushTokenError,
  } = useNotifications();
  const { triggerLight } = useHaptics();

  const handleClose = async () => {
    await triggerLight();
    onClose();
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
      <HearthSurfaceCard key={type} containerStyle={styles.typeCard}>
        <View style={styles.typeHeader}>
          <View style={styles.typeHeaderLeft}>
            <View
              style={[
                styles.iconWell,
                { backgroundColor: config.color + "18" },
              ]}
            >
              <Ionicons
                name={config.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={config.color}
              />
            </View>
            <View style={styles.typeInfo}>
              <Text style={[styles.typeName, { color: colors.text }]}>
                {config.title}
              </Text>
              <Text
                style={[styles.typeDescription, { color: colors.textSecondary }]}
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
      </HearthSurfaceCard>
    );
  };

  return (
    <HearthSheet
      visible={visible}
      onClose={() => void handleClose()}
      title="Notifications"
      fillMaxHeight
      keyboardAvoiding={false}
      contentStyle={styles.sheetContent}
      embedded={embedded}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HearthSurfaceCard containerStyle={styles.globalCard}>
          <View style={styles.globalRow}>
            <View style={styles.globalLeft}>
              <View
                style={[
                  styles.iconWellLarge,
                  { backgroundColor: colors.primary + "14" },
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={styles.globalInfo}>
                <Text style={[styles.globalTitle, { color: colors.text }]}>
                  All notifications
                </Text>
                <Text
                  style={[
                    styles.globalDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Master switch for reminders
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
        </HearthSurfaceCard>

        {!permissionStatus.granted ? (
          <HearthSurfaceCard containerStyle={styles.permissionCard}>
            <View style={styles.permissionCopy}>
              <Ionicons
                name="warning-outline"
                size={20}
                color={colors.error}
              />
              <Text
                style={[styles.permissionText, { color: colors.textSecondary }]}
              >
                {permissionStatus.canAskAgain
                  ? "Notifications are off. Enable them to get task reminders."
                  : "Notifications are blocked. Turn them on in device settings."}
              </Text>
            </View>
            <View style={styles.permissionButton}>
              <Button
                label={permissionStatus.canAskAgain ? "Enable" : "Open Settings"}
                onPress={() =>
                  permissionStatus.canAskAgain
                    ? void handleEnablePermissions()
                    : void Linking.openSettings()
                }
              />
            </View>
          </HearthSurfaceCard>
        ) : null}

        {permissionStatus.granted && pushTokenError ? (
          <Text style={[styles.tokenError, { color: colors.error }]}>
            Token save error: {pushTokenError}
          </Text>
        ) : null}

        {notificationSettings.globalEnabled ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Notification types
            </Text>
            <Text
              style={[styles.sectionDescription, { color: colors.textSecondary }]}
            >
              Choose which reminders you want.
            </Text>
            {getNotificationTypes().map((type) =>
              renderNotificationTypeSection(type)
            )}
          </>
        ) : null}
      </ScrollView>
    </HearthSheet>
  );
}
