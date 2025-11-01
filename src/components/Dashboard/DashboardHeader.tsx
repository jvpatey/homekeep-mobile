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
import { useGradients, useDevice } from "../../hooks";
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
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  
  const fontMultiplier = getFontMultiplier();

  // Helper function to calculate luminance of a hex color
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.replace("#", ""), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };

  // Adjust gradient colors for better contrast based on theme
  const adjustGradientForContrast = (
    gradientColors: [string, string]
  ): [string, string] => {
    const [color1, color2] = gradientColors;
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const avgLuminance = (lum1 + lum2) / 2;

    // In light mode, ensure all gradients are dark enough to be visible
    // Darken any gradient that's too light (luminance > 0.55)
    if (!isDark && avgLuminance > 0.55) {
      // Moderate darkening for light colors in light mode
      const darken = (hex: string, amount: number) => {
        const num = parseInt(hex.replace("#", ""), 16);
        const r = Math.max(0, ((num >> 16) & 0xff) - amount);
        const g = Math.max(0, ((num >> 8) & 0xff) - amount);
        const b = Math.max(0, (num & 0xff) - amount);
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
      };
      // Less aggressive darkening - lighter amounts
      const darkenAmount =
        avgLuminance > 0.85
          ? 70
          : avgLuminance > 0.75
          ? 55
          : avgLuminance > 0.65
          ? 40
          : 30;
      return [darken(color1, darkenAmount), darken(color2, darkenAmount)] as [
        string,
        string,
      ];
    } else if (isDark && avgLuminance < 0.25) {
      // Subtle lightening for very dark colors only
      const lighten = (hex: string, amount: number) => {
        const num = parseInt(hex.replace("#", ""), 16);
        const r = Math.min(255, ((num >> 16) & 0xff) + amount);
        const g = Math.min(255, ((num >> 8) & 0xff) + amount);
        const b = Math.min(255, (num & 0xff) + amount);
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
      };
      return [lighten(color1, 40), lighten(color2, 40)] as [string, string];
    }
    return gradientColors;
  };

  const textGradientColors = adjustGradientForContrast(selectedGradient.colors);

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
          colors={
            isDark
              ? ["transparent", "transparent", colors.background]
              : ["transparent", "rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.6)", colors.background]
          }
          locations={isDark ? [0, 0.4, 1] : [0, 0.6, 0.9, 1]}
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
        <View style={[
          headerStyles.contentLayer,
          isTablet && {
            paddingHorizontal: getResponsiveValue(
              DesignSystem.spacing.md,
              DesignSystem.spacing.lg,  // Comfortable padding on iPad (24px)
              DesignSystem.spacing.xl,  // Comfortable padding on iPad Pro (32px)
            ),
          },
        ]}>
          {/* Profile Button - Top Right */}
          <Animated.View
            style={[headerStyles.profileButtonContainer, profileAnimatedStyle]}
          >
            <ProfileMenu onRefresh={onRefresh} navigation={navigation} />
          </Animated.View>

          <View style={headerStyles.headerContent}>
          <View style={headerStyles.greetingContainer}>
            <Animated.Text
              style={[
                headerStyles.greeting,
                {
                  color: isDark
                    ? colors.text
                    : "rgba(15, 23, 42, 0.9)",
                },
                greetAnimatedStyle,
                isTablet && {
                  fontSize: headerStyles.greeting.fontSize * fontMultiplier,
                  lineHeight: (headerStyles.greeting.fontSize * fontMultiplier) * 1.2,
                },
              ]}
            >
              {greeting}
            </Animated.Text>
            <Animated.View style={nameAnimatedStyle}>
              {/* Light mode: Add a subtle white outline behind for contrast */}
              {!isDark && (
                <MaskedView
                  style={{ position: "absolute" }}
                  maskElement={
                    <Text
                      style={[
                        headerStyles.userName,
                        {
                          color: colors.text,
                          textShadowColor: "rgba(255, 255, 255, 0.6)",
                          textShadowOffset: { width: 0, height: 0 },
                          textShadowRadius: 2,
                        },
                      ]}
                    >
                      {userName}
                    </Text>
                  }
                >
                  <LinearGradient
                    colors={["rgba(255, 255, 255, 0.4)", "rgba(255, 255, 255, 0.4)"]}
                    locations={[0, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={[headerStyles.userName, { opacity: 0 }]}>
                      {userName}
                    </Text>
                  </LinearGradient>
                </MaskedView>
              )}
              {/* Main gradient text layer */}
              <MaskedView
                maskElement={
                  <Text
                    style={[
                      headerStyles.userName,
                      { color: colors.text },
                      {
                        // Text shadow for depth
                        textShadowColor: isDark
                          ? "rgba(0, 0, 0, 0.5)"
                          : "rgba(0, 0, 0, 0.3)",
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: isDark ? 8 : 4,
                      },
                      isTablet && {
                        fontSize: headerStyles.userName.fontSize * fontMultiplier,
                        lineHeight: (headerStyles.userName.fontSize * fontMultiplier) * 1.2,
                      },
                    ]}
                  >
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
                  <Text style={[
                    headerStyles.userName,
                    { opacity: 0 },
                    isTablet && {
                      fontSize: headerStyles.userName.fontSize * fontMultiplier,
                      lineHeight: (headerStyles.userName.fontSize * fontMultiplier) * 1.2,
                    },
                  ]}>
                    {userName}
                  </Text>
                </LinearGradient>
              </MaskedView>
            </Animated.View>

            <Text
              style={[
                headerStyles.motivationalMessage,
                {
                  color: isDark
                    ? colors.textSecondary
                    : "rgba(15, 23, 42, 0.65)",
                },
                isTablet && {
                  fontSize: (headerStyles.motivationalMessage.fontSize || 16) * fontMultiplier,
                  lineHeight: ((headerStyles.motivationalMessage.fontSize || 16) * fontMultiplier) * 1.4,
                },
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
              isTablet && {
                padding: getResponsiveValue(
                  DesignSystem.spacing.lg,
                  DesignSystem.spacing.xl,
                  DesignSystem.spacing.xxl,
                ),
              },
            ]}
          >
            <TouchableOpacity
              style={headerStyles.statItem}
              onPress={onShowDueSoonPopup}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  headerStyles.statNumber,
                  {
                    color: isDark
                      ? colors.primary
                      : "rgba(15, 23, 42, 0.9)",
                  },
                  isTablet && {
                    fontSize: headerStyles.statNumber.fontSize * fontMultiplier,
                  },
                ]}
              >
                {dueSoonCount}
              </Text>
              <Text
                style={[
                  headerStyles.statLabel,
                  {
                    color: isDark
                      ? colors.textSecondary
                      : "rgba(15, 23, 42, 0.7)",
                  },
                  isTablet && {
                    fontSize: (headerStyles.statLabel.fontSize || 14) * fontMultiplier,
                  },
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
                style={[
                  headerStyles.statNumber,
                  {
                    color: isDark
                      ? colors.success
                      : "rgba(15, 23, 42, 0.9)",
                  },
                  isTablet && {
                    fontSize: headerStyles.statNumber.fontSize * fontMultiplier,
                  },
                ]}
              >
                {completedCount}
              </Text>
              <Text
                style={[
                  headerStyles.statLabel,
                  {
                    color: isDark
                      ? colors.textSecondary
                      : "rgba(15, 23, 42, 0.7)",
                  },
                  isTablet && {
                    fontSize: (headerStyles.statLabel.fontSize || 14) * fontMultiplier,
                  },
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
              <Text
                style={[
                  headerStyles.statNumber,
                  {
                    color: isDark
                      ? colors.accent
                      : "rgba(15, 23, 42, 0.9)",
                  },
                  isTablet && {
                    fontSize: headerStyles.statNumber.fontSize * fontMultiplier,
                  },
                ]}
              >
                {streak}
              </Text>
              <Text
                style={[
                  headerStyles.statLabel,
                  {
                    color: isDark
                      ? colors.textSecondary
                      : "rgba(15, 23, 42, 0.7)",
                  },
                  isTablet && {
                    fontSize: (headerStyles.statLabel.fontSize || 14) * fontMultiplier,
                  },
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
