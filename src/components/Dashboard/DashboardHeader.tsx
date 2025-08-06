import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Searchbar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useSimpleAnimation } from "../../hooks";
import { styles } from "./styles";

/**
 * DashboardHeader - iOS-style large title header with search functionality
 * Features welcome message, user name, and expandable search bar
 */
export function DashboardHeader() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const headerAnimatedStyle = useSimpleAnimation(0, 600, 15);
  const searchAnimatedStyle = useSimpleAnimation(
    searchVisible ? 0 : 300,
    300,
    10
  );

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

        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: colors.surface }]}
          onPress={() => setSearchVisible(!searchVisible)}
        >
          <Ionicons
            name={searchVisible ? "close" : "search"}
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Expandable Search Bar */}
      {searchVisible && (
        <Animated.View style={[styles.searchContainer, searchAnimatedStyle]}>
          <Searchbar
            placeholder="Search tasks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
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
