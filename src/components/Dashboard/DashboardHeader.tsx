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
  const { colors } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={headerStyles.headerSection}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={headerStyles.headerGradient}
      >
        {/* Profile Button - Top Right */}
        <View style={headerStyles.profileButtonContainer}>
          <ProfileMenu onRefresh={onRefresh} navigation={navigation} />
        </View>

        <View style={headerStyles.headerContent}>
          <View style={headerStyles.greetingContainer}>
            <Text style={[headerStyles.greeting, { color: colors.surface }]}>
              {greeting}, {userName}!
            </Text>

            <Text
              style={[
                headerStyles.motivationalMessage,
                { color: colors.surface },
              ]}
            >
              {motivationalMessage}
            </Text>
          </View>

          <View style={headerStyles.statsContainer}>
            <TouchableOpacity
              style={headerStyles.statItem}
              onPress={onShowDueSoonPopup}
              activeOpacity={0.7}
            >
              <Text
                style={[headerStyles.statNumber, { color: colors.surface }]}
              >
                {dueSoonCount}
              </Text>
              <Text style={[headerStyles.statLabel, { color: colors.surface }]}>
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
                style={[headerStyles.statNumber, { color: colors.surface }]}
              >
                {completedCount}
              </Text>
              <Text style={[headerStyles.statLabel, { color: colors.surface }]}>
                Completed
              </Text>
            </TouchableOpacity>
            <View style={headerStyles.statDivider} />
            <TouchableOpacity
              style={headerStyles.statItem}
              onPress={onShowStreakPopup}
              activeOpacity={0.7}
            >
              <Text
                style={[headerStyles.statNumber, { color: colors.surface }]}
              >
                {streak}
              </Text>
              <Text style={[headerStyles.statLabel, { color: colors.surface }]}>
                Day Streak
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
