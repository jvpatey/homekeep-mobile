import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { ProfileMenu } from "./profile";
import { useNavigation } from "@react-navigation/native";
import { AppStackParamList } from "../../navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { headerStyles } from "./styles";

interface DashboardHeaderProps {
  userName: string;
  greeting: string;
  motivationalMessage: string;
  dueSoonCount: number;
  completedCount: number;
  streak: number;
  onRefresh?: () => void;
  onShowDueSoonPopup: () => void;
  onShowStreakPopup: () => void;
}

// DashboardHeader Component used in the Dashboard
export function DashboardHeader({
  userName,
  greeting,
  motivationalMessage,
  dueSoonCount,
  completedCount,
  streak,
  onRefresh,
  onShowDueSoonPopup,
  onShowStreakPopup,
}: DashboardHeaderProps) {
  const { colors, isDark } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const gradientColors = isDark
    ? [
        "rgba(46, 196, 182, 0.04)",
        "rgba(58, 134, 255, 0.01)",
        colors.background,
      ]
    : [
        "rgba(46, 196, 182, 0.06)",
        "rgba(58, 134, 255, 0.02)",
        colors.background,
      ];

  return (
    <View style={headerStyles.headerSection}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.15, 1]}
        style={headerStyles.headerGradient}
      >
        {/* Profile Button - Top Right */}
        <View style={headerStyles.profileButtonContainer}>
          <ProfileMenu onRefresh={onRefresh} navigation={navigation} />
        </View>

        <View style={headerStyles.headerContent}>
          <View style={headerStyles.greetingContainer}>
            <Text style={[headerStyles.greeting, { color: colors.text }]}>
              {greeting}, {userName}!
            </Text>

            <Text
              style={[
                headerStyles.motivationalMessage,
                { color: colors.textSecondary },
              ]}
            >
              {motivationalMessage}
            </Text>
          </View>

          <View
            style={[
              headerStyles.statsContainer,
              {
                backgroundColor: colors.glass,
                borderWidth: 1,
                borderColor: colors.glassBorder,
              },
            ]}
          >
            <TouchableOpacity
              style={headerStyles.statItem}
              onPress={onShowDueSoonPopup}
              activeOpacity={0.7}
            >
              <Text
                style={[headerStyles.statNumber, { color: colors.primary }]}
              >
                {dueSoonCount}
              </Text>
              <Text
                style={[
                  headerStyles.statLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Due Soon
              </Text>
            </TouchableOpacity>
            <View style={headerStyles.statDivider} />
            <TouchableOpacity
              style={headerStyles.statItem}
              onPress={() => {
                navigation.navigate("CompletionHistory");
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[headerStyles.statNumber, { color: colors.success }]}
              >
                {completedCount}
              </Text>
              <Text
                style={[
                  headerStyles.statLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Completed
              </Text>
            </TouchableOpacity>
            <View style={headerStyles.statDivider} />
            <TouchableOpacity
              style={headerStyles.statItem}
              onPress={onShowStreakPopup}
              activeOpacity={0.7}
            >
              <Text style={[headerStyles.statNumber, { color: colors.accent }]}>
                {streak}
              </Text>
              <Text
                style={[
                  headerStyles.statLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Day Streak
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
