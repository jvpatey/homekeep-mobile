import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";

interface ProfileButtonProps {
  size?: number;
}

// ProfileButton component for the Dashboard
export function ProfileButton({ size = 44 }: ProfileButtonProps) {
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

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

  const handleSignOut = async () => {
    try {
      await signOut();
      setMenuVisible(false);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.profileButton, { width: size, height: size }]}
        onPress={() => setMenuVisible(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={[
            styles.profileAvatar,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.profileInitial, { fontSize: size * 0.4 }]}>
            {getUserInitial()}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={[styles.menuContainer, { backgroundColor: colors.surface }]}
          >
            {/* User Profile Section */}
            <View style={styles.profileSection}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.menuAvatar}
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

            {/* Sign Out Button */}
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.signOutIconContainer,
                  { backgroundColor: colors.error + "20" },
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
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  profileButton: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    // Ensure the button doesn't expand beyond its intended size
    overflow: "hidden",
  },
  profileAvatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    fontWeight: "700",
    letterSpacing: 0.1,
    color: "white",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 100,
    paddingRight: 32,
  },
  menuContainer: {
    borderRadius: 20,
    minWidth: 280,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  menuAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  menuAvatarInitial: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.1,
    color: "white",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: 0.1,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 20,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  signOutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
});
