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
import { useHaptics } from "../../hooks";
import { AvatarCustomizationModal } from "../../components/modals/avatar-customization-modal";
import { SettingsScreenProps } from "./types";

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { colors, isDark } = useTheme();
  const { signOut } = useAuth();
  const { deleteAllTasks } = useTasks();
  const { triggerLight, triggerMedium } = useHaptics();
  const [customizationModalVisible, setCustomizationModalVisible] =
    useState(false);

  const handleCustomizeAvatar = async () => {
    console.log("Opening avatar customization modal");
    await triggerMedium();
    setCustomizationModalVisible(true);
  };

  const handleNotificationSettings = async () => {
    console.log("Navigating to notification preferences");
    await triggerLight();
    navigation.navigate("NotificationPreferences");
  };

  const handleDeleteAllTasks = async () => {
    console.log("User requested to delete all tasks");
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
    console.log("User requested to sign out");
    await triggerMedium();
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

  const handleCloseCustomization = () => {
    setCustomizationModalVisible(false);
  };

  const settingsOptions = [
    {
      id: "customize-avatar",
      title: "Customize Avatar",
      icon: "color-palette-outline",
      onPress: handleCustomizeAvatar,
      type: "action" as const,
    },
    {
      id: "notifications",
      title: "Notification Settings",
      icon: "notifications-outline",
      onPress: handleNotificationSettings,
      type: "navigation" as const,
    },
    {
      id: "delete-tasks",
      title: "Delete All Tasks",
      icon: "trash-bin-outline",
      onPress: handleDeleteAllTasks,
      type: "destructive" as const,
    },
    {
      id: "sign-out",
      title: "Sign Out",
      icon: "log-out-outline",
      onPress: handleSignOut,
      type: "destructive" as const,
    },
  ];

  const renderSettingsOption = (option: (typeof settingsOptions)[0]) => {
    const getIconColor = () => {
      switch (option.type) {
        case "destructive":
          return colors.error;
        case "action":
        case "navigation":
        default:
          return colors.primary;
      }
    };

    const getTextColor = () => {
      switch (option.type) {
        case "destructive":
          return colors.error;
        default:
          return colors.text;
      }
    };

    const getIconBackgroundColor = () => {
      switch (option.type) {
        case "destructive":
          return colors.error + "15";
        case "action":
        case "navigation":
        default:
          return colors.primary + "15";
      }
    };

    return (
      <TouchableOpacity
        key={option.id}
        style={[styles.optionButton, { borderBottomColor: colors.border }]}
        onPress={option.onPress}
        activeOpacity={0.7}
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
        {option.type === "navigation" && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textSecondary}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Settings
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={[styles.optionsContainer, { backgroundColor: colors.surface }]}
        >
          {settingsOptions.map(renderSettingsOption)}
        </View>
      </ScrollView>

      {/* Avatar Customization Modal */}
      <AvatarCustomizationModal
        visible={customizationModalVisible}
        onClose={handleCloseCustomization}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.2,
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    zIndex: 0,
  },
  headerRightSpacer: {
    width: 40, // Same as back button width for visual balance
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  optionsContainer: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.1,
    flex: 1,
  },
});
