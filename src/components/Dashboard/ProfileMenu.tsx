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
import { useGradients } from "../../hooks";
import { styles } from "./styles";

export function ProfileMenu() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const { primaryGradient } = useGradients();
  const [menuVisible, setMenuVisible] = useState(false);

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

  const showMenu = () => {
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

  return (
    <>
      <TouchableOpacity
        style={[styles.profileButton, { backgroundColor: colors.surface }]}
        onPress={showMenu}
      >
        <LinearGradient
          colors={primaryGradient}
          style={styles.profileAvatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
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
                colors={primaryGradient}
                style={styles.menuAvatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
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
    </>
  );
}
