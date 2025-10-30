import React, { useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import { useGradients } from "../../hooks";
import { ProfileMenu } from "./profile";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { AppStackParamList } from "../../navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { headerStyles } from "./styles";
import { DesignSystem } from "../../theme/designSystem";

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

  // Spring animations for greeting, username, and profile icon
  const greetOpacity = useSharedValue(0);
  const greetTranslateY = useSharedValue(12);
  const nameOpacity = useSharedValue(0);
  const nameTranslateY = useSharedValue(12);
  const profileOpacity = useSharedValue(0);
  const profileScale = useSharedValue(0.8);
  const profileTranslateY = useSharedValue(10);
  const statsOpacity = useSharedValue(0);
  const statsTranslateY = useSharedValue(15);
  const statsScale = useSharedValue(0.95);

  const triggerHeaderAnimations = useCallback(() => {
    // reset
    greetOpacity.value = 0;
    greetTranslateY.value = 12;
    nameOpacity.value = 0;
    nameTranslateY.value = 12;
    profileOpacity.value = 0;
    profileScale.value = 0.8;
    profileTranslateY.value = 10;
    statsOpacity.value = 0;
    statsTranslateY.value = 15;
    statsScale.value = 0.95;

    // animate with springs and slight stagger
    greetOpacity.value = withDelay(150, withSpring(1, { damping: 15, stiffness: 150 }));
    greetTranslateY.value = withDelay(150, withSpring(0, { damping: 15, stiffness: 150 }));
    nameOpacity.value = withDelay(250, withSpring(1, { damping: 15, stiffness: 150 }));
    nameTranslateY.value = withDelay(250, withSpring(0, { damping: 15, stiffness: 150 }));
    profileOpacity.value = withDelay(100, withSpring(1, { damping: 15, stiffness: 150 }));
    profileScale.value = withDelay(100, withSpring(1, { damping: 15, stiffness: 150 }));
    profileTranslateY.value = withDelay(100, withSpring(0, { damping: 15, stiffness: 150 }));
    statsOpacity.value = withDelay(350, withSpring(1, { damping: 15, stiffness: 150 }));
    statsTranslateY.value = withDelay(350, withSpring(0, { damping: 15, stiffness: 150 }));
    statsScale.value = withDelay(350, withSpring(1, { damping: 15, stiffness: 150 }));
  }, []);

  useEffect(() => {
    triggerHeaderAnimations();
  }, [triggerHeaderAnimations]);

  useFocusEffect(
    useCallback(() => {
      triggerHeaderAnimations();
    }, [triggerHeaderAnimations])
  );

  const greetAnimatedStyle = useAnimatedStyle(() => ({
    opacity: greetOpacity.value,
    transform: [{ translateY: greetTranslateY.value }],
  }));

  const nameAnimatedStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameTranslateY.value }],
  }));

  const profileAnimatedStyle = useAnimatedStyle(() => ({
    opacity: profileOpacity.value,
    transform: [
      { scale: profileScale.value },
      { translateY: profileTranslateY.value },
    ],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [
      { translateY: statsTranslateY.value },
      { scale: statsScale.value },
    ],
  }));

  return (
    <View style={[headerStyles.headerSection, { marginBottom: DesignSystem.spacing.sm }]}>
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
          <Animated.View
            style={[headerStyles.profileButtonContainer, profileAnimatedStyle]}
          >
            <ProfileMenu onRefresh={onRefresh} navigation={navigation} />
          </Animated.View>

          <View style={headerStyles.headerContent}>
          <View style={headerStyles.greetingContainer}>
            <Animated.Text style={[headerStyles.greeting, { color: colors.text }, greetAnimatedStyle]}>
              {greeting}
            </Animated.Text>
            <Animated.View style={nameAnimatedStyle}>
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
            </Animated.View>

            <Text
              style={[
                headerStyles.motivationalMessage,
                { color: colors.textSecondary },
              ]}
            >
              {motivationalMessage}
            </Text>
          </View>

          <Animated.View
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
              statsAnimatedStyle,
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
          </Animated.View>
        </View>
        </View>
      </View>
    </View>
  );
}
