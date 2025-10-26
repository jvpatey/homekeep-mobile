import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
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

  const textGradientColors = [colors.primary, colors.secondary, colors.accent];

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
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <Text style={[headerStyles.greeting, { color: colors.text }]}>
                {greeting},{"\u00A0"}
              </Text>
              <MaskedView
                maskElement={
                  <Text style={[headerStyles.greeting, { color: colors.text }]}>
                    {userName}!
                  </Text>
                }
              >
                <LinearGradient
                  colors={textGradientColors}
                  locations={[0, 0.5, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[headerStyles.greeting, { opacity: 0 }]}>
                    {userName}!
                  </Text>
                </LinearGradient>
              </MaskedView>
            </View>

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
                backgroundColor: isDark
                  ? "rgba(35, 37, 38, 0.4)"
                  : "rgba(255, 255, 255, 0.4)",
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(255, 255, 255, 0.6)",
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
