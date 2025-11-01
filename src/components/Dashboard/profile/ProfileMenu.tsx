import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useTasks } from "../../../context/TasksContext";
import { useGradients, useHaptics, useDevice } from "../../../hooks";
import { useUserPreferences } from "../../../context/UserPreferencesContext";
import { styles } from "./styles";
import { ProfileMenuNavigationProps } from "../../../types/navigation";
import { AvatarCustomizationModal } from "../../modals/avatar-customization-modal";
import { NotificationSettingsModal } from "../../modals/notification-settings-modal";
import { AllTasksModal } from "../../modals/all-tasks-modal";

// ProfileMenuProps
interface ProfileMenuProps {
  onRefresh?: () => void;
  navigation: ProfileMenuNavigationProps["navigation"];
}

// ProfileMenu component for the Dashboard
export function ProfileMenu({ onRefresh, navigation }: ProfileMenuProps) {
  const { colors, isDark } = useTheme();
  const { user, signOut, deleteAccount } = useAuth();
  const { stats, deleteAllTasks } = useTasks();
  const { primaryGradient } = useGradients();
  const { selectedGradient, loading: preferencesLoading } =
    useUserPreferences();
  const { triggerLight, triggerMedium } = useHaptics();
  const { isTablet, getResponsiveValue } = useDevice();
  const [menuVisible, setMenuVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customizationModalVisible, setCustomizationModalVisible] =
    useState(false);
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [allTasksModalVisible, setAllTasksModalVisible] = useState(false);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  // getUserInitial function to get the user's initial from Supabase
  const getUserInitial = () => {
    const fullName = user?.user_metadata?.full_name;
    if (fullName) {
      return fullName.split(" ")[0].charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  // getUserName function to get the user's name from Supabase
  const getUserName = () => {
    const fullName = user?.user_metadata?.full_name;
    if (fullName) {
      return fullName;
    }
    return "User";
  };

  // getUserEmail function to get the user's email from Supabase
  const getUserEmail = () => {
    return user?.email || "";
  };

  // animatedStyle function to animate the menu
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // showMenu function to show the menu
  const showMenu = async () => {
    await triggerLight();
    setMenuVisible(true);
    scale.value = withTiming(1, { duration: 200 });
    opacity.value = withTiming(1, { duration: 200 });
  };

  // hideMenu function to hide the menu
  const hideMenu = () => {
    scale.value = withTiming(0, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setMenuVisible)(false);
      runOnJS(setShowSettings)(false);
    });
  };

  // handleSignOut function to sign out the user
  const handleSignOut = async () => {
    hideMenu();

    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  // handleSettings functiont to toggle settings view
  const handleSettings = async () => {
    await triggerLight();
    setShowSettings(true);
  };

  // handleBackFromSettings function to go back from settings
  const handleBackFromSettings = async () => {
    await triggerLight();
    setShowSettings(false);
  };

  // handleCustomizeAvatar function to show avatar customization
  const handleCustomizeAvatar = async () => {
    await triggerMedium();
    hideMenu();
    setTimeout(() => {
      setCustomizationModalVisible(true);
    }, 300);
  };

  // handleNotificationSettings function to show notification settings modal
  const handleNotificationSettings = async () => {
    await triggerLight();
    hideMenu();
    setTimeout(() => {
      setNotificationModalVisible(true);
    }, 300);
  };

  // handleDeleteAllTasks function to delete all tasks
  const handleDeleteAllTasks = async () => {
    await triggerMedium();
    hideMenu();
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

  // handleDeleteAccount function to handle account deletion
  const handleDeleteAccount = async () => {
    await triggerMedium();
    hideMenu();
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

  // handleAllTasks function to show all tasks modal
  const handleAllTasks = async () => {
    await triggerLight();
    hideMenu();
    setTimeout(() => {
      setAllTasksModalVisible(true);
    }, 300);
  };

  // Use custom gradient if available and not loading, otherwise fall back to primary gradient
  const avatarGradient =
    !preferencesLoading && selectedGradient
      ? selectedGradient.colors
      : primaryGradient;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.profileButton,
          { backgroundColor: colors.surface },
          isTablet && {
            width: getResponsiveValue(40, 48, 52),
            height: getResponsiveValue(40, 48, 52),
            borderRadius: getResponsiveValue(20, 24, 26),
          },
        ]}
        onPress={showMenu}
      >
        <LinearGradient
          colors={avatarGradient}
          style={[
            styles.profileAvatar,
            isTablet && {
              width: getResponsiveValue(40, 48, 52),
              height: getResponsiveValue(40, 48, 52),
              borderRadius: getResponsiveValue(20, 24, 26),
            },
          ]}
          start={
            (!preferencesLoading && selectedGradient?.start) || { x: 0, y: 0 }
          }
          end={(!preferencesLoading && selectedGradient?.end) || { x: 1, y: 1 }}
        >
          <Text
            style={[
              styles.profileInitial,
              isTablet && {
                fontSize: getResponsiveValue(16, 20, 22),
              },
            ]}
          >
            {getUserInitial()}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={hideMenu}
      >
        <Pressable style={styles.menuOverlay} onPress={hideMenu}>
          <Animated.View
            style={[
              styles.menuContainer,
              {
                backgroundColor: isDark
                  ? "rgba(35, 37, 38, 0.85)"
                  : "rgba(255, 255, 255, 0.85)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.25)"
                  : "rgba(255, 255, 255, 0.9)",
              },
              animatedStyle,
            ]}
          >
            {/* User Profile Section */}
            <View style={styles.profileSection}>
              <LinearGradient
                colors={avatarGradient}
                style={styles.menuAvatar}
                start={
                  (!preferencesLoading && selectedGradient?.start) || {
                    x: 0,
                    y: 0,
                  }
                }
                end={
                  (!preferencesLoading && selectedGradient?.end) || {
                    x: 1,
                    y: 1,
                  }
                }
              >
                <Text style={styles.menuAvatarInitial}>{getUserInitial()}</Text>
              </LinearGradient>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {getUserName()}
                </Text>
                <Text
                  style={[styles.profileEmail, { color: colors.textSecondary }]}
                >
                  {getUserEmail()}
                </Text>
              </View>
            </View>

            {/* Divider */}
            {!showSettings && (
              <View
                style={[styles.menuDivider, { backgroundColor: colors.border }]}
              />
            )}

            {showSettings ? (
              // Settings View
              <>
                <View style={styles.profileSection}>
                  <TouchableOpacity
                    style={styles.menuActionButton}
                    onPress={handleBackFromSettings}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.menuActionText,
                        { color: colors.text, marginLeft: 8 },
                      ]}
                    >
                      Settings
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.menuDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                {/* Customize Avatar */}
                <TouchableOpacity
                  style={styles.menuActionButton}
                  onPress={handleCustomizeAvatar}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.menuActionIconContainer,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Ionicons
                      name="color-palette-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.menuActionText, { color: colors.text }]}>
                    Customize Avatar
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                <View
                  style={[
                    styles.menuDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                {/* Notification Settings */}
                <TouchableOpacity
                  style={styles.menuActionButton}
                  onPress={handleNotificationSettings}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.menuActionIconContainer,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Ionicons
                      name="notifications-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.menuActionText, { color: colors.text }]}>
                    Notifications
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                <View
                  style={[
                    styles.menuDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                {/* Delete All Tasks */}
                <TouchableOpacity
                  style={[
                    styles.menuActionButton,
                    (stats?.totalInstances || 0) === 0 && {
                      opacity: 0.5,
                    },
                  ]}
                  onPress={
                    (stats?.totalInstances || 0) > 0
                      ? handleDeleteAllTasks
                      : undefined
                  }
                  activeOpacity={0.7}
                  disabled={(stats?.totalInstances || 0) === 0}
                >
                  <View
                    style={[
                      styles.signOutIconContainer,
                      {
                        backgroundColor:
                          (stats?.totalInstances || 0) === 0
                            ? colors.border + "15"
                            : colors.error + "15",
                      },
                    ]}
                  >
                    <Ionicons
                      name="trash-bin-outline"
                      size={20}
                      color={
                        (stats?.totalInstances || 0) === 0
                          ? colors.textSecondary
                          : colors.error
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuActionText,
                      {
                        color:
                          (stats?.totalInstances || 0) === 0
                            ? colors.textSecondary
                            : colors.error,
                      },
                    ]}
                  >
                    Delete All Tasks
                  </Text>
                </TouchableOpacity>

                <View
                  style={[
                    styles.menuDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                {/* Delete Account */}
                <TouchableOpacity
                  style={styles.menuActionButton}
                  onPress={handleDeleteAccount}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.signOutIconContainer,
                      { backgroundColor: colors.error + "15" },
                    ]}
                  >
                    <Ionicons
                      name="person-remove-outline"
                      size={20}
                      color={colors.error}
                    />
                  </View>
                  <Text
                    style={[styles.menuActionText, { color: colors.error }]}
                  >
                    Delete Account
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              // Main Menu View
              <>
                {/* Totals Summary */}
                <TouchableOpacity
                  style={styles.menuActionButton}
                  onPress={handleAllTasks}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.menuActionIconContainer,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Ionicons
                      name="stats-chart-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.menuActionText, { color: colors.text }]}>
                    Total Tasks
                  </Text>
                  <View style={styles.menuActionRight}>
                    <View
                      style={[
                        styles.counterBadge,
                        { backgroundColor: colors.primary + "20" },
                      ]}
                    >
                      <Text
                        style={[styles.counterText, { color: colors.primary }]}
                      >
                        {stats.total}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>

                {/* Divider */}
                <View
                  style={[
                    styles.menuDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                {/* Settings Button */}
                <TouchableOpacity
                  style={styles.menuActionButton}
                  onPress={handleSettings}
                >
                  <View
                    style={[
                      styles.menuActionIconContainer,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Ionicons
                      name="settings-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.menuActionText, { color: colors.text }]}>
                    Settings
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {/* Divider */}
                <View
                  style={[
                    styles.menuDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                {/* Sign Out Button */}
                <TouchableOpacity
                  style={styles.signOutButton}
                  onPress={handleSignOut}
                >
                  <View
                    style={[
                      styles.signOutIconContainer,
                      { backgroundColor: colors.error + "15" },
                    ]}
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={20}
                      color={colors.error}
                    />
                  </View>
                  <Text style={[styles.signOutText, { color: colors.error }]}>
                    Sign Out
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </Pressable>
      </Modal>

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

      {/* All Tasks Modal */}
      <AllTasksModal
        visible={allTasksModalVisible}
        onClose={() => setAllTasksModalVisible(false)}
      />
    </>
  );
}
