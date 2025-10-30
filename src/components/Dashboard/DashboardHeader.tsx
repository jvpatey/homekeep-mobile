import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useTheme } from "../../context/ThemeContext";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import { useGradients } from "../../hooks";
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
  const { selectedGradient } = useUserPreferences();
  const { heroGradient, heroGradientLocations, radialGlow, ambientGradient } = useGradients();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const textGradientColors = selectedGradient.colors;

  return (
    <View style={[headerStyles.headerSection, { marginBottom: DesignSystem.spacing.lg }]}>
      <View style={headerStyles.headerGradient}>
        {/* Bottom fade mask - inside the hero container */}
        <LinearGradient
          colors={["transparent", "transparent", colors.background]}
          locations={[0, 0.4, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={headerStyles.bottomFade}
          pointerEvents="none"
        />
        
        {/* Layered gradient background for depth */}
        <LinearGradient
          colors={heroGradient}
          locations={heroGradientLocations}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={headerStyles.gradientBase}
        />
        
        {/* Radial glow effect centered on content - simulated with multiple linear gradients */}
        <LinearGradient
          colors={[radialGlow.innerColor, radialGlow.midColor, radialGlow.outerColor, radialGlow.fadeColor]}
          locations={[0, 0.3, 0.6, 1]}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 1, y: 1 }}
          style={headerStyles.gradientGlow}
        />
        
        {/* Ambient light layer */}
        <LinearGradient
          colors={ambientGradient}
          locations={[0, 0.4, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={headerStyles.gradientAmbient}
        />

        {/* Content layer */}
        <View style={headerStyles.contentLayer}>
          {/* Profile Button - Top Right */}
          <View style={headerStyles.profileButtonContainer}>
            <ProfileMenu onRefresh={onRefresh} navigation={navigation} />
          </View>

          <View style={headerStyles.headerContent}>
          <View style={headerStyles.greetingContainer}>
            <Text style={[headerStyles.greeting, { color: colors.text }]}>
              {greeting}
            </Text>
            <MaskedView
              maskElement={
                <Text style={[headerStyles.userName, { color: colors.text }]}>
                  {userName}
                </Text>
              }
            >
              <LinearGradient
                colors={textGradientColors}
                locations={[0, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[headerStyles.userName, { opacity: 0 }]}>
                  {userName}
                </Text>
              </LinearGradient>
            </MaskedView>

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
        </View>
      </View>
    </View>
  );
}
