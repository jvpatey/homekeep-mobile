import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Alert, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TasksContext";
import { useProfile } from "../../context/ProfileContext";
import { useHaptics } from "../../hooks";
import { HearthSurfaceCard, SheetActionRow } from "../../components/ui";
import { NotificationSettingsModal } from "../../components/modals/notification-settings-modal";
import { HomeSetupModal } from "../../components/modals/home-setup";
import { HouseholdSharingModal } from "../../components/modals/household-sharing/HouseholdSharingModal";
import { CalendarFeedSheet } from "../../components/modals/calendar-feed/CalendarFeedSheet";
import { useAppNavigation } from "../../navigation/useAppNavigation";
import { EditNameModal } from "../../components/modals/edit-name-modal";
import { EditPasswordModal } from "../../components/modals/edit-password-modal";
import { DesignSystem } from "../../theme/designSystem";
import { SettingsScreenProps } from "./types";
import { accountDisplayName, hasAccountName } from "../../utils/displayName";
import { userHasEmailPassword } from "../../utils/isEmailVerified";
import { useSubscription } from "../../context/SubscriptionContext";
import {
  HOMEKEEP_PLUS_NAME,
  getPrivacyUrl,
  plusStatusSubtitle,
} from "../../lib/purchases";
import {
  getBiometricLabel,
  hasBiometricLoginEnabled,
  isBiometricAvailable,
} from "../../services/biometricAuth";

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { colors } = useTheme();
  const {
    user,
    deleteAccount,
    enableBiometricSignIn,
    disableBiometricSignIn,
  } = useAuth();
  const { deleteAllTasks, stats } = useTasks();
  const { canEditHome, profile } = useProfile();
  const { triggerLight, triggerMedium } = useHaptics();
  const {
    status,
    daysRemaining,
    expirationDate,
    productId,
    includedViaHousehold,
    presentPaywall,
    openLegal,
  } = useSubscription();
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [homeSetupVisible, setHomeSetupVisible] = useState(false);
  const [householdVisible, setHouseholdVisible] = useState(false);
  const [calendarFeedVisible, setCalendarFeedVisible] = useState(false);
  const { openRecord } = useAppNavigation();
  const [nameEditorVisible, setNameEditorVisible] = useState(false);
  const [passwordEditorVisible, setPasswordEditorVisible] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Face ID");

  const refreshBiometricSettings = useCallback(async () => {
    try {
      const [available, enabled, label] = await Promise.all([
        isBiometricAvailable(),
        hasBiometricLoginEnabled(),
        getBiometricLabel(),
      ]);
      setBiometricAvailable(available);
      setBiometricEnabled(enabled);
      setBiometricLabel(label);
    } catch {
      setBiometricAvailable(false);
      setBiometricEnabled(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshBiometricSettings();
    }, [refreshBiometricSettings])
  );

  const nameInput = {
    authFullName: user?.user_metadata?.full_name as string | undefined,
    profileFullName: profile?.full_name,
    email: user?.email ?? profile?.email ?? null,
  };
  const displayName = accountDisplayName(nameInput);
  const named = hasAccountName(nameInput);
  const email = user?.email ?? profile?.email ?? "";
  const canChangePassword = userHasEmailPassword(user);

  const handleBiometricToggle = async () => {
    await triggerLight();
    if (biometricEnabled) {
      Alert.alert(
        `Turn off ${biometricLabel}?`,
        `You will need your password, Apple, or Google to sign in next time.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Turn off",
            style: "destructive",
            onPress: () => {
              void (async () => {
                await disableBiometricSignIn();
                await refreshBiometricSettings();
              })();
            },
          },
        ]
      );
      return;
    }

    const result = await enableBiometricSignIn();
    if (!result.success) {
      if (result.error && !/canceled/i.test(result.error)) {
        Alert.alert(`Could not enable ${biometricLabel}`, result.error);
      }
    }
    await refreshBiometricSettings();
  };

  const handleEditHome = async () => {
    await triggerLight();
    setHomeSetupVisible(true);
  };

  const plusSubtitle = plusStatusSubtitle({
    status,
    daysRemaining,
    expirationDate,
    productId,
    includedViaHousehold,
  });

  const handleDeleteAllTasks = async () => {
    await triggerMedium();
    Alert.alert(
      "Reset this home's schedule",
      "This permanently deletes every reminder and its history for this home. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset schedule",
          style: "destructive",
          onPress: async () => {
            const { success, error } = await deleteAllTasks();
            if (!success) {
              Alert.alert("Error", error || "Failed to delete all tasks");
            } else {
              Alert.alert(
                "Schedule reset",
                "This home's reminders and history have been deleted."
              );
            }
          },
        },
      ]
    );
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
              "This is your last chance to cancel. Your account and all data will be permanently deleted and cannot be recovered.",
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
                          "All your data has been permanently deleted and you will be signed out.",
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
                    } catch {
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

  const hasAnyTasks = (stats?.totalInstances || 0) > 0;

  const homeRows = [
    {
      icon: "home-outline" as const,
      title: "Your home",
      subtitle: canEditHome
        ? undefined
        : "The HomeShare owner manages this home",
      onPress: handleEditHome,
      disabled: !canEditHome,
    },
    {
      icon: "people-outline" as const,
      title: "HomeShare",
      subtitle: profile?.household_id
        ? "Invite code and people"
        : "Share this home or join with a code",
      onPress: () => {
        void triggerLight();
        setHouseholdVisible(true);
      },
    },
    {
      icon: "warning-outline" as const,
      title: "Emergency info",
      subtitle: "Shutoffs, photos, and who to call",
      onPress: () => {
        void triggerLight();
        openRecord("EmergencyInfo");
      },
    },
    {
      icon: "layers-outline" as const,
      title: "Task library",
      subtitle: "Seasonal and specialty bundles",
      onPress: () => {
        void triggerLight();
        navigation.navigate("MaintenancePlans");
      },
    },
  ];

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollInner}
      >
        <View style={styles.identity}>
          <Text style={[styles.identityName, { color: colors.text }]}>
            {displayName}
          </Text>
          {email ? (
            <Text
              style={[styles.identityEmail, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {email}
            </Text>
          ) : null}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Account
        </Text>
        <HearthSurfaceCard style={styles.groupSurface}>
          <SheetActionRow
            icon="person-outline"
            title="Name"
            subtitle={named ? displayName : "Add your first and last name"}
            onPress={() => {
              void triggerLight();
              setNameEditorVisible(true);
            }}
            showDivider={canChangePassword || biometricAvailable}
          />
          {canChangePassword ? (
            <SheetActionRow
              icon="lock-closed-outline"
              title="Change password"
              subtitle="Update the password for this email"
              onPress={() => {
                void triggerLight();
                setPasswordEditorVisible(true);
              }}
              showDivider={biometricAvailable}
            />
          ) : null}
          {biometricAvailable ? (
            <SheetActionRow
              icon="scan-outline"
              title={`${biometricLabel} sign-in`}
              subtitle={
                biometricEnabled
                  ? `On — use ${biometricLabel} on the login screen`
                  : `Off — sign in with password, Apple, or Google`
              }
              onPress={() => void handleBiometricToggle()}
              showChevron={false}
              showDivider={false}
            />
          ) : null}
        </HearthSurfaceCard>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {HOMEKEEP_PLUS_NAME}
        </Text>
        <HearthSurfaceCard style={styles.groupSurface}>
          <SheetActionRow
            icon="sparkles-outline"
            title="Plan"
            subtitle={plusSubtitle}
            onPress={() => {
              void triggerLight();
              void presentPaywall({ force: true });
            }}
            showDivider
          />
          {getPrivacyUrl() ? (
            <SheetActionRow
              icon="document-text-outline"
              title="Privacy Policy"
              onPress={() => {
                void triggerLight();
                void openLegal("privacy");
              }}
              showDivider
            />
          ) : null}
          <SheetActionRow
            icon="reader-outline"
            title="Terms of Use"
            onPress={() => {
              void triggerLight();
              void openLegal("terms");
            }}
            showChevron
            showDivider={false}
          />
        </HearthSurfaceCard>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Home
        </Text>
        <HearthSurfaceCard style={styles.groupSurface}>
          {homeRows.map((row, index) => (
            <SheetActionRow
              key={row.title}
              {...row}
              showDivider={index < homeRows.length - 1}
            />
          ))}
        </HearthSurfaceCard>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Notifications
        </Text>
        <HearthSurfaceCard style={styles.groupSurface}>
          <SheetActionRow
            icon="notifications-outline"
            title="Notification settings"
            onPress={() => {
              void triggerLight();
              setNotificationModalVisible(true);
            }}
            showDivider
          />
          <SheetActionRow
            icon="calendar-outline"
            title="Calendar subscription"
            subtitle="See upcoming tasks in your calendar app"
            onPress={() => {
              void triggerLight();
              setCalendarFeedVisible(true);
            }}
          />
        </HearthSurfaceCard>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Data
        </Text>
        <HearthSurfaceCard style={styles.groupSurface}>
          <SheetActionRow
            icon="trash-bin-outline"
            title="Reset this home's schedule"
            onPress={() => void handleDeleteAllTasks()}
            destructive
            disabled={!hasAnyTasks}
            showChevron={false}
            showDivider
          />
          <SheetActionRow
            icon="person-remove-outline"
            title="Delete account"
            onPress={() => void handleDeleteAccount()}
            destructive
            showChevron={false}
          />
        </HearthSurfaceCard>
      </ScrollView>

      {notificationModalVisible ? (
        <NotificationSettingsModal
          visible
          onClose={() => setNotificationModalVisible(false)}
        />
      ) : null}

      <HomeSetupModal
        visible={homeSetupVisible}
        onClose={() => setHomeSetupVisible(false)}
        hideSkip
      />

      <HouseholdSharingModal
        visible={householdVisible}
        onClose={() => setHouseholdVisible(false)}
      />

      <CalendarFeedSheet
        visible={calendarFeedVisible}
        onClose={() => setCalendarFeedVisible(false)}
      />

      {nameEditorVisible ? (
        <EditNameModal visible onClose={() => setNameEditorVisible(false)} />
      ) : null}

      {passwordEditorVisible ? (
        <EditPasswordModal
          visible
          onClose={() => setPasswordEditorVisible(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  scrollInner: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.xxl,
  },
  identity: {
    paddingBottom: DesignSystem.spacing.md,
  },
  identityName: {
    ...DesignSystem.typography.h4,
    fontSize: 18,
  },
  identityEmail: {
    ...DesignSystem.typography.small,
    fontSize: 14,
    marginTop: 2,
    opacity: 0.85,
  },
  sectionLabel: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  groupSurface: {
    overflow: "hidden",
    paddingVertical: DesignSystem.spacing.xs,
  },
});
