import React, { useState } from "react";
import { View, Text, ScrollView, Alert, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TasksContext";
import { useProfile } from "../../context/ProfileContext";
import { useHaptics } from "../../hooks";
import {
  HearthSheet,
  HearthSurfaceCard,
  SheetActionRow,
} from "../../components/ui";
import { NotificationSettingsModal } from "../../components/modals/notification-settings-modal";
import { HomeSetupModal } from "../../components/modals/home-setup";
import { EmergencyFactsModal } from "../../components/modals/emergency-facts/EmergencyFactsModal";
import { EditNameModal } from "../../components/modals/edit-name-modal";
import { DesignSystem } from "../../theme/designSystem";
import { SettingsScreenProps } from "./types";
import { accountDisplayName, hasAccountName } from "../../utils/displayName";
import { useRequirePlus } from "../../hooks/useRequirePlus";
import { useSubscription } from "../../context/SubscriptionContext";
import { PlusLockHint } from "../../components/plus";
import {
  FALLBACK_MONTHLY_PRICE,
  FALLBACK_YEARLY_PRICE,
  HOMEKEEP_PLUS_MONTHLY_ID,
  HOMEKEEP_PLUS_NAME,
  HOMEKEEP_PLUS_YEARLY_ID,
  getPrivacyUrl,
} from "../../lib/purchases";

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { colors } = useTheme();
  const { user, deleteAccount } = useAuth();
  const { deleteAllTasks, stats } = useTasks();
  const { canEditHome, profile } = useProfile();
  const { triggerLight, triggerMedium } = useHaptics();
  const requirePlus = useRequirePlus();
  const {
    isPlus,
    status,
    daysRemaining,
    expirationDate,
    productId,
    includedViaHousehold,
    presentPaywall,
    restore,
    purchasing,
    manageSubscription,
    openLegal,
  } = useSubscription();
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [homeSetupVisible, setHomeSetupVisible] = useState(false);
  const [emergencyVisible, setEmergencyVisible] = useState(false);
  const [nameEditorVisible, setNameEditorVisible] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(true);

  const nameInput = {
    authFullName: user?.user_metadata?.full_name as string | undefined,
    profileFullName: profile?.full_name,
    email: user?.email ?? profile?.email ?? null,
  };
  const displayName = accountDisplayName(nameInput);
  const named = hasAccountName(nameInput);
  const email = user?.email ?? profile?.email ?? "";

  const closeSheet = () => {
    setSheetVisible(false);
    navigation.goBack();
  };

  const handleEditHome = async () => {
    await triggerLight();
    if (!(await requirePlus())) return;
    setHomeSetupVisible(true);
  };

  const plusStatusSubtitle = (() => {
    if (includedViaHousehold) return "Included with this home";
    if (status === "trialing") {
      return daysRemaining != null
        ? `Free trial · ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`
        : "Free trial";
    }
    if (status === "promo") {
      return daysRemaining != null
        ? `Complimentary access · ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`
        : "Complimentary access";
    }
    if (status === "grace") return "Billing issue · access continues";
    if (status === "active") {
      const yearly =
        productId === HOMEKEEP_PLUS_YEARLY_ID ||
        productId?.includes("yearly") ||
        productId?.includes("annual");
      const monthly =
        productId === HOMEKEEP_PLUS_MONTHLY_ID || productId?.includes("monthly");
      const plan = yearly
        ? "Yearly"
        : monthly
          ? "Monthly"
          : HOMEKEEP_PLUS_NAME;
      if (expirationDate) {
        const when = expirationDate.toLocaleDateString();
        return `${plan} · renews ${when}`;
      }
      return plan;
    }
    if (status === "expired") return "Expired";
    return `Not subscribed · ${FALLBACK_YEARLY_PRICE}/year or ${FALLBACK_MONTHLY_PRICE}/month`;
  })();

  const handleRestorePurchases = async () => {
    await triggerLight();
    const result = await restore();
    if (result.restored) {
      Alert.alert("Restored", `${HOMEKEEP_PLUS_NAME} is active on this account.`);
      return;
    }
    if (result.error) {
      Alert.alert("Couldn't restore", result.error);
      return;
    }
    Alert.alert(
      "Nothing to restore",
      "No subscription to restore on this Apple or Google account."
    );
  };

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
        : "The household owner manages this home",
      onPress: handleEditHome,
      disabled: !canEditHome,
    },
    {
      icon: "warning-outline" as const,
      title: "Emergency map",
      onPress: () => {
        void triggerLight();
        setEmergencyVisible(true);
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
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <HearthSheet
        visible={sheetVisible}
        onClose={closeSheet}
        title="Settings"
        embedded
        keyboardAvoiding={false}
        fillMaxHeight
        maxHeightRatio={0.92}
        contentStyle={styles.sheetContent}
      >
        <ScrollView
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
              subtitle={
                named ? displayName : "Add your first and last name"
              }
              onPress={() => {
                void triggerLight();
                setNameEditorVisible(true);
              }}
            />
          </HearthSurfaceCard>

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {HOMEKEEP_PLUS_NAME}
          </Text>
          <HearthSurfaceCard style={styles.groupSurface}>
            <SheetActionRow
              icon="sparkles-outline"
              title={HOMEKEEP_PLUS_NAME}
              subtitle={plusStatusSubtitle}
              onPress={() => {
                void triggerLight();
                if (!isPlus) {
                  void presentPaywall();
                }
              }}
              showChevron={!isPlus}
              showDivider
            />
            <SheetActionRow
              icon="refresh-outline"
              title="Restore purchases"
              onPress={() => void handleRestorePurchases()}
              disabled={purchasing}
              showChevron={false}
              showDivider
            />
            <SheetActionRow
              icon="card-outline"
              title="Manage subscription"
              subtitle="Opens your store account"
              onPress={() => {
                void triggerLight();
                void manageSubscription();
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
                trailing={
                  row.title === "Your home" && canEditHome && !isPlus ? (
                    <PlusLockHint />
                  ) : undefined
                }
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
      </HearthSheet>

      {notificationModalVisible ? (
        <NotificationSettingsModal
          visible
          embedded
          onClose={() => setNotificationModalVisible(false)}
        />
      ) : null}

      <HomeSetupModal
        visible={homeSetupVisible}
        onClose={() => setHomeSetupVisible(false)}
        hideSkip
        embedded
      />

      {emergencyVisible ? (
        <EmergencyFactsModal
          visible
          embedded
          onClose={() => setEmergencyVisible(false)}
        />
      ) : null}

      {nameEditorVisible ? (
        <EditNameModal
          visible
          onClose={() => setNameEditorVisible(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: 0,
    flex: 1,
    minHeight: 0,
  },
  scrollInner: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.lg,
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
