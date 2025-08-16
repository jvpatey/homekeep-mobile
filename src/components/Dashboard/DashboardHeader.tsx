import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Searchbar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../navigation/types";
import { useSimpleAnimation } from "../../hooks";
import { ThemeToggle } from "../ThemeToggle/ThemeToggle";
import { ProfileMenu } from "./ProfileMenu";
import {
  DesignSystem,
  getTypography,
  getSpacing,
} from "../../theme/designSystem";
import { styles } from "./styles";

interface DashboardHeaderProps {
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
  mode?: "dashboard" | "calendar";
  onPrimaryToggle?: () => void; // optional handler to avoid navigation and toggle inline
}

// DashboardHeader - Features welcome message, user name, and expandable search bar

export function DashboardHeader({
  onSearchChange,
  searchQuery = "",
  mode = "dashboard",
  onPrimaryToggle,
}: DashboardHeaderProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [searchVisible, setSearchVisible] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const headerAnimatedStyle = useSimpleAnimation(0, 600, 15);
  const searchAnimatedStyle = useSimpleAnimation(
    searchVisible ? 0 : 300,
    300,
    10
  );

  // Sync localSearchQuery with searchQuery prop
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
    if (searchQuery && !searchVisible) {
      setSearchVisible(true);
    }
  }, [searchQuery]);

  // Get user's first name from full name or email
  const getUserGreeting = () => {
    const fullName = user?.user_metadata?.full_name;
    if (fullName) {
      const firstName = fullName.split(" ")[0];
      return `${firstName}`;
    }
    return "Hello there";
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleSearchChange = (query: string) => {
    setLocalSearchQuery(query);
    onSearchChange?.(query);
  };

  const handleSearchToggle = () => {
    if (searchVisible) {
      // Clear search when closing
      handleSearchChange("");
    }
    setSearchVisible(!searchVisible);
  };

  const handlePrimaryToggle = () => {
    if (onPrimaryToggle) {
      onPrimaryToggle();
      return;
    }
    // Fallback navigation (kept for type safety; Calendar route was removed)
    if (mode === "calendar") navigation.navigate("Dashboard");
    else navigation.navigate("Dashboard");
  };

  return (
    <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
      {/* Large Title Header */}
      <View style={styles.headerTop}>
        <View style={styles.titleSection}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {getTimeGreeting()}
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {getUserGreeting()}
          </Text>
        </View>

        <View style={styles.headerButtons}>
          <ProfileMenu />
          <ThemeToggle
            style={[styles.headerButton, { backgroundColor: colors.surface }]}
            size={44}
            iconSize={22}
          />
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: colors.surface }]}
            onPress={handlePrimaryToggle}
          >
            <Ionicons
              name={mode === "calendar" ? "list" : "calendar"}
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: colors.surface }]}
            onPress={handleSearchToggle}
          >
            <Ionicons
              name={searchVisible ? "close" : "search"}
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expandable Search Bar */}
      {searchVisible && (
        <Animated.View style={[styles.searchContainer, searchAnimatedStyle]}>
          <Searchbar
            placeholder="Search tasks..."
            value={localSearchQuery}
            onChangeText={handleSearchChange}
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            inputStyle={[styles.searchInput, { color: colors.text }]}
            placeholderTextColor={colors.textSecondary}
            iconColor={colors.textSecondary}
            elevation={0}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}
