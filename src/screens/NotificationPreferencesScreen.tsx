import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import { useHaptics } from "../hooks";
import { HOME_MAINTENANCE_CATEGORIES } from "../types/maintenance";
import { MaintenanceCategory } from "../types/maintenance";

interface NotificationPreferencesScreenProps {
  navigation: any;
}


export function NotificationPreferencesScreen({
  navigation,
}: NotificationPreferencesScreenProps) {
  const { colors } = useTheme();
  const {
    notificationSettings,
    updateNotificationPreferences,
    updateGlobalNotificationSettings,
    permissionStatus,
    testNotification,
  } = useNotifications();
  const { triggerLight } = useHaptics();
  const [expandedType, setExpandedType] = useState<string | null>(null);

  const handleGlobalToggle = async (enabled: boolean) => {
    await triggerLight();
    await updateGlobalNotificationSettings(enabled);
  };

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

  const toggleTypeExpansion = (type: string) => {
    setExpandedType(expandedType === type ? null : type);
  };

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

  const renderNotificationTypeSection = (type: string) => {
    const typeConfig = {
      due_soon_reminder: {
        title: "Due Soon Reminders",
        description: "Get notified 1 day before tasks are due",
        icon: "time-outline",
        color: "#4CAF50",
      },
      overdue_reminder: {
        title: "Overdue Reminders",
        description: "Get notified when tasks are overdue",
        icon: "warning-outline",
        color: "#F44336",
      },
      daily_digest: {
        title: "Daily Digest",
        description: "Receive daily summary of tasks",
        icon: "calendar-outline",
        color: "#2196F3",
      },
      weekly_summary: {
        title: "Weekly Summary",
        description: "Receive weekly summary of tasks",
        icon: "stats-chart-outline",
        color: "#9C27B0",
      },
    };

    const config = typeConfig[type as keyof typeof typeConfig];
    if (!config) return null;

    // Check if this type is enabled for any category
    const isEnabled = Object.values(notificationSettings.categories).some(
      (pref) => pref && pref[type as keyof typeof pref]
    );

    const isExpanded = expandedType === type;

    return (
      <View
        key={type}
        style={[
          styles.notificationTypeSection,
          { backgroundColor: colors.surface },
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Notification Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Global Settings */}
        <View
          style={[styles.globalSection, { backgroundColor: colors.surface }]}
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
                <Text style={[styles.globalTitle, { color: colors.text }]}>
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
              trackColor={{ false: colors.border, true: colors.primary + "40" }}
              thumbColor={
                notificationSettings.globalEnabled
                  ? colors.primary
                  : colors.textSecondary
              }
            />
          </View>
        </View>

        {/* Test Notification Button */}
        {permissionStatus.granted && (
          <View
            style={[styles.testSection, { backgroundColor: colors.surface }]}
          >
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: colors.primary }]}
              onPress={async () => {
                await triggerLight();
                await testNotification();
              }}
            >
              <Ionicons name="send" size={20} color="white" />
              <Text style={styles.testButtonText}>Send Test Notification</Text>
            </TouchableOpacity>
            <Text
              style={[styles.testDescription, { color: colors.textSecondary }]}
            >
              Test your notification setup by sending a sample notification
            </Text>
          </View>
        )}

        {/* Permission Status */}
        {!permissionStatus.granted && (
          <View
            style={[
              styles.permissionSection,
              { backgroundColor: colors.error + "15" },
            ]}
          >
            <View style={styles.permissionContent}>
              <Ionicons name="warning" size={20} color={colors.error} />
              <Text style={[styles.permissionText, { color: colors.error }]}>
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
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Notification Types
        </Text>
        <Text
          style={[styles.sectionDescription, { color: colors.textSecondary }]}
        >
          Configure which types of notifications you want to receive
        </Text>

        {[
          "due_soon_reminder",
          "overdue_reminder",
          "daily_digest",
          "weekly_summary",
        ].map((type) => renderNotificationTypeSection(type))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  globalSection: {
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  globalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  globalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  globalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  globalInfo: {
    flex: 1,
  },
  globalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  globalDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  testSection: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  testButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  testDescription: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  permissionSection: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  permissionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  permissionText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  permissionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 20,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  notificationTypeSection: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  notificationTypeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  notificationTypeHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  notificationTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  notificationTypeInfo: {
    flex: 1,
  },
  notificationTypeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  notificationTypeDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  notificationTypeHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  expandIcon: {
    marginLeft: 12,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categoriesTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  categoriesDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  categoryRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryRowName: {
    fontSize: 14,
    fontWeight: "500",
  },
  bottomSpacer: {
    height: 40,
  },
});
