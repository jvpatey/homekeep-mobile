import React, { useState } from "react";
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
import { useTheme } from "../../../context/ThemeContext";
import { useNotifications } from "../../../context/NotificationContext";
import { useHaptics } from "../../../hooks";
import { Button, HearthSheet, HearthSurfaceCard } from "../../ui";
import { HOME_MAINTENANCE_CATEGORIES } from "../../../types/maintenance";
import { MaintenanceCategory } from "../../../types/maintenance";
import {
  getNotificationTypeConfig,
  isNotificationTypeEnabled,
  getNotificationTypes,
} from "../../../screens/notification-preferences/utils";
import { styles } from "./styles";

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationSettingsModal({
  visible,
  onClose,
}: NotificationSettingsModalProps) {
  const { colors } = useTheme();
  const {
    notificationSettings,
    updateNotificationPreferences,
    updateGlobalNotificationSettings,
    permissionStatus,
    syncPushToken,
    pushTokenError,
  } = useNotifications();
  const { triggerLight } = useHaptics();
  const [expandedType, setExpandedType] = useState<string | null>(null);

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
    Object.keys(notificationSettings.categories).forEach((category) => {
      updateNotificationPreferences(category as MaintenanceCategory, {
        [type]: enabled,
      });
    });
  };

  const toggleTypeExpansion = (type: string) => {
    setExpandedType(expandedType === type ? null : type);
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
    const isExpanded = expandedType === type;

    return (
      <HearthSurfaceCard
        key={type}
        containerStyle={styles.typeCard}
      >
        <TouchableOpacity
          style={styles.typeHeader}
          onPress={() => toggleTypeExpansion(type)}
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
          accessibilityLabel={`${config.title}, ${
            isExpanded ? "expanded" : "collapsed"
          }`}
        >
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
          <View style={styles.typeHeaderRight}>
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
            />
          </View>
        </TouchableOpacity>

        {isExpanded ? (
          <View
            style={[styles.categories, { borderTopColor: colors.border }]}
          >
            <Text style={[styles.categoriesTitle, { color: colors.text }]}>
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

              const categoryOn = preferences[
                type as keyof typeof preferences
              ] as boolean;

              return (
                <View
                  key={category}
                  style={[
                    styles.categoryRow,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <View style={styles.categoryRowLeft}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: colors.primary + "14" },
                      ]}
                    >
                      <Ionicons
                        name={
                          categoryData.icon as keyof typeof Ionicons.glyphMap
                        }
                        size={16}
                        color={colors.primary}
                      />
                    </View>
                    <Text
                      style={[styles.categoryName, { color: colors.text }]}
                    >
                      {categoryData.displayName}
                    </Text>
                  </View>
                  <Switch
                    value={categoryOn}
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
                      categoryOn ? colors.primary : colors.textSecondary
                    }
                  />
                </View>
              );
            })}
          </View>
        ) : null}
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
              Choose which reminders you want, and for which systems.
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
