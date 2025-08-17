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
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TasksContext";
import { useGradients, useHaptics } from "../../hooks";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import { AvatarCustomizationModal } from "../AvatarCustomizationModal";
import { styles } from "./styles";

export function ProfileMenu() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const { deleteAllTasks, stats } = useTasks();
  const { primaryGradient } = useGradients();
  const { selectedGradient } = useUserPreferences();

  const { triggerLight, triggerMedium } = useHaptics();
  const [menuVisible, setMenuVisible] = useState(false);
  const [customizationModalVisible, setCustomizationModalVisible] =
    useState(false);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const getUserInitial = () => {
    const fullName = user?.user_metadata?.full_name;
    if (fullName) {
      return fullName.split(" ")[0].charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const getUserName = () => {
    const fullName = user?.user_metadata?.full_name;
    if (fullName) {
      return fullName;
    }
    return "User";
  };

  const getUserEmail = () => {
    return user?.email || "";
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const showMenu = async () => {
    await triggerLight();
    setMenuVisible(true);
    scale.value = withTiming(1, { duration: 200 });
    opacity.value = withTiming(1, { duration: 200 });
  };

  const hideMenu = () => {
    scale.value = withTiming(0, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setMenuVisible)(false);
    });
  };

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

  const handleCustomizeAvatar = async () => {
    await triggerMedium();
    hideMenu();
    // Add a small delay to ensure menu closes before modal opens
    setTimeout(() => {
      setCustomizationModalVisible(true);
    }, 300);
  };

  const handleDeleteAllTasks = async () => {
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

  const handleCloseCustomization = () => {
    setCustomizationModalVisible(false);
  };

  // Use custom gradient if available, otherwise fall back to primary gradient
  const avatarGradient = selectedGradient
    ? selectedGradient.colors
    : primaryGradient;

  return (
    <>
      <TouchableOpacity
        style={[styles.profileButton, { backgroundColor: colors.surface }]}
        onPress={showMenu}
      >
        <LinearGradient
          colors={avatarGradient}
          style={styles.profileAvatar}
          start={selectedGradient?.start || { x: 0, y: 0 }}
          end={selectedGradient?.end || { x: 1, y: 1 }}
        >
          <Text style={styles.profileInitial}>{getUserInitial()}</Text>
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
              { backgroundColor: colors.surface },
              animatedStyle,
            ]}
          >
            {/* User Profile Section */}
            <View style={styles.profileSection}>
              <LinearGradient
                colors={avatarGradient}
                style={styles.menuAvatar}
                start={selectedGradient?.start || { x: 0, y: 0 }}
                end={selectedGradient?.end || { x: 1, y: 1 }}
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
            <View
              style={[styles.menuDivider, { backgroundColor: colors.border }]}
            />

            {/* Totals Summary */}
            <View style={styles.menuActionButton}>
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
              <Text style={{ color: colors.text, fontWeight: "700" }}>
                {stats.total}
              </Text>
            </View>

            {/* Divider */}
            <View
              style={[styles.menuDivider, { backgroundColor: colors.border }]}
            />

            {/* Customize Avatar Button */}
            <TouchableOpacity
              style={styles.menuActionButton}
              onPress={handleCustomizeAvatar}
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

            {/* Divider */}
            <View
              style={[styles.menuDivider, { backgroundColor: colors.border }]}
            />

            {/* Delete All Tasks */}
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleDeleteAllTasks}
            >
              <View
                style={[
                  styles.signOutIconContainer,
                  { backgroundColor: colors.error + "15" },
                ]}
              >
                <Ionicons
                  name="trash-bin-outline"
                  size={20}
                  color={colors.error}
                />
              </View>
              <Text style={[styles.signOutText, { color: colors.error }]}>
                Delete All Tasks
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={[styles.menuDivider, { backgroundColor: colors.border }]}
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
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Avatar Customization Modal */}
      <AvatarCustomizationModal
        visible={customizationModalVisible}
        onClose={handleCloseCustomization}
      />
    </>
  );
}
