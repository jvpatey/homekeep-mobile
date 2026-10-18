import React from "react";
import { View, Text, ScrollView, Switch, Alert, Linking, StyleSheet } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { useNotifications } from "../../../context/NotificationContext";
import { useHaptics } from "../../../hooks";
import {
  Button,
  HearthSheet,
  HearthSurfaceCard,
  SheetActionRow,
  SettingsSectionLabel,
} from "../../ui";
import { settingsSwitchColors } from "../../ui/settingsSwitchColors";
import { NotificationPreferences } from "../../../types/notifications";
import {
  getNotificationTypeConfig,
  isNotificationTypeEnabled,
  getNotificationTypes,
} from "../../../screens/notification-preferences/utils";
import { DesignSystem } from "../../../theme/designSystem";

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

  const globalSwitch = settingsSwitchColors(
    colors,
    notificationSettings.globalEnabled
  );
  const types = getNotificationTypes();

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
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Choose which reminders HomeKeep can send.
        </Text>

        <HearthSurfaceCard style={styles.groupSurface}>
          <SheetActionRow
            icon="notifications-outline"
            title="All notifications"
            subtitle="Master switch for reminders"
            showDivider={false}
            trailing={
              <Switch
                value={notificationSettings.globalEnabled}
                onValueChange={(value) => void handleGlobalToggle(value)}
                trackColor={globalSwitch.trackColor}
                thumbColor={globalSwitch.thumbColor}
              />
            }
          />
        </HearthSurfaceCard>

        {!permissionStatus.granted ? (
          <HearthSurfaceCard style={styles.permissionCard}>
            <View style={styles.permissionCopy}>
              <Text
                style={[styles.permissionText, { color: colors.textSecondary }]}
              >
                {permissionStatus.canAskAgain
                  ? "Notifications are off on this device. Enable them to get task reminders."
                  : "Notifications are blocked. Turn them on in device settings."}
              </Text>
            </View>
            <View style={styles.permissionButton}>
              <Button
                label={
                  permissionStatus.canAskAgain ? "Enable" : "Open Settings"
                }
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
            <SettingsSectionLabel>Types</SettingsSectionLabel>
            <HearthSurfaceCard style={styles.groupSurface}>
              {types.map((type, index) => {
                const config = getNotificationTypeConfig(type, colors);
                if (!config) return null;
                const isEnabled = isNotificationTypeEnabled(
                  type,
                  notificationSettings
                );
                const typeSwitch = settingsSwitchColors(colors, isEnabled);
                return (
                  <SheetActionRow
                    key={type}
                    icon={config.icon as any}
                    title={config.title}
                    subtitle={config.description}
                    accentColor={config.color}
                    showDivider={index < types.length - 1}
                    trailing={
                      <Switch
                        value={isEnabled}
                        onValueChange={(value) =>
                          void handleNotificationTypeToggle(type, value)
                        }
                        trackColor={typeSwitch.trackColor}
                        thumbColor={typeSwitch.thumbColor}
                      />
                    }
                  />
                );
              })}
            </HearthSurfaceCard>
          </>
        ) : null}
      </ScrollView>
    </HearthSheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: 0,
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.xl,
  },
  intro: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
    marginBottom: DesignSystem.spacing.md,
  },
  groupSurface: {
    overflow: "hidden",
    paddingVertical: DesignSystem.spacing.xs,
  },
  permissionCard: {
    marginTop: DesignSystem.spacing.md,
    overflow: "hidden",
  },
  permissionCopy: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.md,
  },
  permissionText: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
  },
  permissionButton: {
    padding: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.sm,
  },
  tokenError: {
    ...DesignSystem.typography.footnote,
    marginTop: DesignSystem.spacing.md,
  },
});
