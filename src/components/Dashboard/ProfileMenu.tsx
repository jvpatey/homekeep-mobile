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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { styles } from "./styles";

export function ProfileMenu() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
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
        <Text style={[styles.profileInitial, { color: colors.primary }]}>
          {getUserInitial()}
        </Text>
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
            <View
              style={[styles.menuHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Account
              </Text>
            </View>

            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}
