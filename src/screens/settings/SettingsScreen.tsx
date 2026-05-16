import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TasksContext";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import { useHaptics } from "../../hooks";
import { AvatarCustomizationModal } from "../../components/modals/avatar-customization-modal";
import { NotificationSettingsModal } from "../../components/modals/notification-settings-modal";
import { HomeAddressOnboardingModal } from "../../components/modals/home-address-onboarding";
import { GlassCard, TintedGlassAvatar } from "../../components/ui";
import { DesignSystem } from "../../theme/designSystem";
import { SettingsScreenProps } from "./types";

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { colors, isDark } = useTheme();
  const { user, signOut, deleteAccount } = useAuth();
  const { deleteAllTasks, stats } = useTasks();
  const { selectedGradient } = useUserPreferences();
  const { triggerLight, triggerMedium } = useHaptics();
  const [customizationModalVisible, setCustomizationModalVisible] =
    useState(false);
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  const getUserInitial = () => {
    const fullName = user?.user_metadata?.full_name;
    if (fullName) return fullName.split(" ")[0].charAt(0).toUpperCase();
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const getUserName = () => {
    const fullName = user?.user_metadata?.full_name;
    return fullName || "User";
  };

  const getUserEmail = () => user?.email || "";

  const handleCustomizeAvatar = async () => {
    await triggerMedium();
    setCustomizationModalVisible(true);
  };

  const handleNotificationSettings = async () => {
    await triggerLight();
    setNotificationModalVisible(true);
  };

  const handleHomeAddress = async () => {
    await triggerLight();
    setAddressModalVisible(true);
  };

  const handleHomeSummary = async () => {
    await triggerLight();
    navigation.navigate("HomeSummaryPreview");
  };

  const handleDeleteAllTasks = async () => {
    await triggerMedium();
    Alert.alert(
      "Delete All Tasks",
      "This will permanently delete all of your tasks and their history. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            const { success, error } = await deleteAllTasks();
            if (!success) {
              Alert.alert("Error", error || "Failed to delete all tasks");
            } else {
              Alert.alert(
                "Deleted",
                "All tasks and history have been deleted."
              );
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    await triggerMedium();
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error("Sign out error from Settings:", error);
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    await triggerMedium();
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all associated data. This action cannot be undone.\n\nAre you absolutely sure you want to delete your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            Alert.alert(
              "Final Confirmation",
              "This is your last chance to cancel. Your account and all data will be permanently deleted and cannot be recovered.\n\nType 'DELETE' to confirm account deletion.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "I understand, delete my account",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      const result = await deleteAccount();
                      if (result.success) {
                        Alert.alert(
                          "Account Deleted",
                          "All your data has been permanently deleted and you will be signed out. Your account is now effectively deleted.",
                          [{ text: "OK" }]
                        );
                      } else {
                        Alert.alert(
                          "Error",
                          result.error ||
                            "Failed to delete account. Please try again or contact support.",
                          [{ text: "OK" }]
                        );
                      }
                    } catch (error) {
                      Alert.alert(
                        "Error",
                        "An unexpected error occurred. Please try again or contact support.",
                        [{ text: "OK" }]
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // Disable destructive delete-all when there are no tasks/instances
  const hasAnyTasks = (stats?.totalInstances || 0) > 0;

  type SettingsOption = {
    id: string;
    title: string;
    icon: string;
    onPress: () => void;
    type: "navigation" | "destructive";
    disabled?: boolean;
  };

  const settingsOptions: SettingsOption[] = [
    {
      id: "customize-avatar",
      title: "Customize Avatar",
      icon: "color-palette-outline",
      onPress: handleCustomizeAvatar,
      type: "navigation",
    },
    {
      id: "notifications",
      title: "Notification Settings",
      icon: "notifications-outline",
      onPress: handleNotificationSettings,
      type: "navigation",
    },
    {
      id: "home-address",
      title: "Home Address",
      icon: "home-outline",
      onPress: handleHomeAddress,
      type: "navigation",
    },
    {
      id: "home-summary",
      title: "Home Maintenance Summary",
      icon: "document-text-outline",
      onPress: handleHomeSummary,
      type: "navigation",
    },
    {
      id: "maintenance-plans",
      title: "Maintenance Plans",
      icon: "layers-outline",
      onPress: () => {
        void triggerLight();
        navigation.navigate("MaintenancePlans");
      },
      type: "navigation",
    },
    {
      id: "delete-tasks",
      title: "Delete All Tasks",
      icon: "trash-bin-outline",
      onPress: handleDeleteAllTasks,
      type: "destructive",
      disabled: !hasAnyTasks,
    },
    {
      id: "delete-account",
      title: "Delete Account",
      icon: "person-remove-outline",
      onPress: handleDeleteAccount,
      type: "destructive",
    },
    {
      id: "sign-out",
      title: "Sign Out",
      icon: "log-out-outline",
      onPress: handleSignOut,
      type: "destructive",
    },
  ];

  const renderSettingsOption = (
    option: SettingsOption,
    index: number,
    total: number
  ) => {
    const getIconColor = () => {
      if (option.type === "destructive") {
        return option.disabled ? colors.textSecondary : colors.error;
      }
      return option.disabled ? colors.textSecondary : colors.primary;
    };

    const getTextColor = () => {
      if (option.type === "destructive") {
        return option.disabled ? colors.textSecondary : colors.error;
      }
      return option.disabled ? colors.textSecondary : colors.text;
    };

    const getIconBackgroundColor = () => {
      if (option.type === "destructive") {
        return (option.disabled ? colors.border : colors.error) + "15";
      }
      return (option.disabled ? colors.border : colors.primary) + "15";
    };

    const isLast = index === total - 1;

    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.optionButton,
          !isLast && {
            borderBottomColor: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.06)",
            borderBottomWidth: StyleSheet.hairlineWidth,
          },
        ]}
        onPress={option.disabled ? undefined : option.onPress}
        activeOpacity={0.7}
        disabled={Boolean(option.disabled)}
        accessibilityRole="button"
        accessibilityLabel={option.title}
        accessibilityState={{ disabled: Boolean(option.disabled) }}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getIconBackgroundColor() },
          ]}
        >
          <Ionicons
            name={option.icon as any}
            size={20}
            color={getIconColor()}
          />
        </View>
        <Text style={[styles.optionText, { color: getTextColor() }]}>
          {option.title}
        </Text>
        {option.type === "navigation" ? (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textSecondary}
          />
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Settings
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Account card */}
        <GlassCard
          material="regular"
          radius={DesignSystem.borders.radius.glass}
          containerStyle={styles.cardContainer}
          style={styles.cardSurface}
        >
          <TouchableOpacity
            style={styles.accountCard}
            onPress={handleCustomizeAvatar}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Customize avatar"
          >
            <TintedGlassAvatar
              size={64}
              gradient={selectedGradient}
              initial={getUserInitial()}
              pressable={false}
            />
            <View style={styles.accountInfo}>
              <Text
                style={[styles.accountName, { color: colors.text }]}
                numberOfLines={1}
              >
                {getUserName()}
              </Text>
              <Text
                style={[styles.accountEmail, { color: colors.textSecondary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {getUserEmail()}
              </Text>
            </View>
            <View
              style={[
                styles.editIconContainer,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Ionicons
                name="color-palette-outline"
                size={20}
                color={colors.primary}
              />
            </View>
          </TouchableOpacity>
        </GlassCard>

        {/* Options list */}
        <GlassCard
          material="regular"
          radius={DesignSystem.borders.radius.glass}
          containerStyle={styles.cardContainer}
          style={[styles.cardSurface, styles.optionsSurface]}
        >
          {settingsOptions.map((option, index) =>
            renderSettingsOption(option, index, settingsOptions.length)
          )}
        </GlassCard>
      </ScrollView>

      {/* Avatar Customization Modal */}
      <AvatarCustomizationModal
        visible={customizationModalVisible}
        onClose={() => setCustomizationModalVisible(false)}
      />

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
      />

      {/* Home Address Modal — same modal used for first-run onboarding. */}
      <HomeAddressOnboardingModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        hideSkip
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
  },
  backButton: {
    padding: DesignSystem.spacing.sm,
    marginLeft: -DesignSystem.spacing.sm,
    zIndex: 1,
  },
  headerTitle: {
    ...DesignSystem.typography.h3,
    fontSize: 20,
    flex: 1,
    textAlign: "center",
  },
  headerRightSpacer: {
    width: 40,
    zIndex: 1,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.xxxl,
    gap: DesignSystem.spacing.md,
  },
  cardContainer: {
    width: "100%",
  },
  cardSurface: {
    overflow: "hidden",
  },
  optionsSurface: {
    paddingVertical: DesignSystem.spacing.xs,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.md,
  },
  accountInfo: {
    flex: 1,
    minWidth: 0,
  },
  accountName: {
    ...DesignSystem.typography.h4,
    fontSize: 18,
    marginBottom: 2,
  },
  accountEmail: {
    ...DesignSystem.typography.small,
    fontSize: 14,
    opacity: 0.85,
  },
  editIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: DesignSystem.spacing.md,
  },
  optionText: {
    ...DesignSystem.typography.bodyMedium,
    flex: 1,
    fontSize: 16,
  },
});
