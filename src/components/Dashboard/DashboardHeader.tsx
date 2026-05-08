import React, { useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
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
  const { haloGradient } = useGradients();
  const { isTablet, getFontMultiplier, getResponsiveValue, width, height, getGradientFadeColors, getGradientFadeLocations, getGradientFadeHeight } = useDevice();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  
  const fontMultiplier = getFontMultiplier();
  // Larger multipliers for hero text (greeting, userName, motivationalMessage)
  const heroFontMultiplier = isTablet
    ? Math.max(width, height) > 1300
      ? 1.5  // iPad Pro 13": 1.5x
      : 1.35 // Standard iPad: 1.35x
    : 1;
  // Larger multipliers for stats text
  const statsFontMultiplier = isTablet
    ? Math.max(width, height) > 1300
      ? 1.65  // iPad Pro 13": 1.65x
      : 1.5   // Standard iPad: 1.5x
    : 1;

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

  const _textGradientColors = adjustGradientForContrast(selectedGradient.colors);

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

    const d = DesignSystem.motion.duration.base;
    const fast = DesignSystem.motion.duration.fast;
    const s = DesignSystem.motion.stagger;

    // Subtle, faster “settle” (less bouncy)
    greetOpacity.value = withDelay(
      s,
      withTiming(1, { duration: d, easing: DesignSystem.motion.easing.standard })
    );
    greetTranslateY.value = withDelay(
      s,
      withTiming(0, { duration: d, easing: DesignSystem.motion.easing.standard })
    );

    nameOpacity.value = withDelay(
      s * 2,
      withTiming(1, { duration: d, easing: DesignSystem.motion.easing.standard })
    );
    nameTranslateY.value = withDelay(
      s * 2,
      withTiming(0, { duration: d, easing: DesignSystem.motion.easing.standard })
    );

    profileOpacity.value = withDelay(
      s,
      withTiming(1, {
        duration: fast,
        easing: DesignSystem.motion.easing.standard,
      })
    );
    profileScale.value = withDelay(s, withSpring(1, DesignSystem.motion.spring.smooth));
    profileTranslateY.value = withDelay(
      s,
      withTiming(0, {
        duration: fast,
        easing: DesignSystem.motion.easing.standard,
      })
    );

    statsOpacity.value = withDelay(
      s * 3,
      withTiming(1, { duration: d, easing: DesignSystem.motion.easing.standard })
    );
    statsTranslateY.value = withDelay(
      s * 3,
      withTiming(0, { duration: d, easing: DesignSystem.motion.easing.standard })
    );
    statsScale.value = withDelay(s * 3, withSpring(1, DesignSystem.motion.spring.smooth));
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

  // Use fade colors but adjust for iPad to preserve text readability
  const fadeColors = isTablet && isDark
    ? (() => {
        const screenMax = Math.max(width, height);
        if (screenMax > 1300) {
          // Reduce opacity for dark mode on large iPad
          return [
            "transparent",
            "transparent",
            "rgba(24, 26, 27, 0.08)",
            "rgba(24, 26, 27, 0.25)",
            "rgba(24, 26, 27, 0.5)",
            colors.background,
          ] as const;
        } else if (screenMax > 1100) {
          return [
            "transparent",
            "transparent",
            "rgba(24, 26, 27, 0.25)",
            colors.background,
          ] as const;
        }
        return ["transparent", "transparent", colors.background] as const;
      })()
    : getGradientFadeColors(isDark, colors.background);
  
  // Push fade opacity further down so text at top stays readable - start fade later for phones
  const fadeLocations = isTablet
    ? (() => {
        const screenMax = Math.max(width, height);
        if (isDark) {
          // Dark mode: start fade later
          if (screenMax > 1300) {
            return [0, 0.6, 0.75, 0.85, 0.95, 1] as const;
          } else if (screenMax > 1100) {
            return [0, 0.65, 0.8, 1] as const;
          }
          return [0, 0.7, 1] as const;
        } else {
          // Light mode: start fade later
          if (screenMax > 1300) {
            return [0, 0.6, 0.75, 0.85, 0.95, 1] as const;
          } else if (screenMax > 1100) {
            return [0, 0.65, 0.8, 1] as const;
          }
          return [0, 0.7, 0.9, 1] as const;
        }
      })()
    : isDark
    ? getGradientFadeLocations(isDark)
    : ([0, 0.7, 0.85, 0.95, 1] as const); // For phones in light mode, start fade much later
  const gradientFadeHeight = getGradientFadeHeight();
  const screenMax = Math.max(width, height);

  return (
    <View style={[headerStyles.headerSection, { marginBottom: DesignSystem.spacing.sm, backgroundColor: colors.background }]}>
      <View style={[headerStyles.headerGradient, { backgroundColor: colors.background }]}>
        {/* Bottom fade mask - inside the hero container */}
        <LinearGradient
          colors={fadeColors}
          locations={fadeLocations}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            headerStyles.bottomFade,
            {
              height: gradientFadeHeight,
            },
            isTablet && {
              height: screenMax > 1300 
                ? gradientFadeHeight * 1.6  // iPad Pro 13"
                : gradientFadeHeight * 1.3, // Standard iPads
            },
          ]}
          pointerEvents="none"
        />
        
        {/* Hero background — single halo (match Welcome/Auth) */}
        <LinearGradient
          colors={haloGradient}
          start={{ x: 0.5, y: 0.15 }}
          end={{ x: 0.5, y: 1 }}
          style={headerStyles.halo}
          pointerEvents="none"
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
                  color: isDark ? colors.text : "rgba(15, 23, 42, 0.9)",
                },
                greetAnimatedStyle,
                isTablet && {
                  fontSize: headerStyles.greeting.fontSize * heroFontMultiplier,
                  lineHeight: (headerStyles.greeting.fontSize * heroFontMultiplier) * 1.2,
                },
              ]}
            >
              {greeting}
            </Animated.Text>
            <Animated.View style={nameAnimatedStyle}>
              <Text
                style={[
                  headerStyles.userName,
                  { color: isDark ? colors.text : "rgba(15, 23, 42, 0.92)" },
                  isTablet && {
                    fontSize: headerStyles.userName.fontSize * heroFontMultiplier,
                    lineHeight:
                      (headerStyles.userName.fontSize * heroFontMultiplier) *
                      1.2,
                  },
                ]}
              >
                {userName}
              </Text>
            </Animated.View>

            <Text
              style={[
                headerStyles.motivationalMessage,
                {
                  color: isDark ? colors.textSecondary : "rgba(15, 23, 42, 0.65)",
                },
                isTablet && {
                  fontSize: (headerStyles.motivationalMessage.fontSize || 16) * heroFontMultiplier,
                  lineHeight: ((headerStyles.motivationalMessage.fontSize || 16) * heroFontMultiplier) * 1.4,
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
                  : "rgba(255, 255, 255, 0.45)",
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(255, 255, 255, 0.5)",
              },
              statsAnimatedStyle,
              isTablet && {
                padding: getResponsiveValue(
                  DesignSystem.spacing.lg,
                  DesignSystem.spacing.xl + DesignSystem.spacing.md,
                  DesignSystem.spacing.xxl + DesignSystem.spacing.lg,
                ),
                gap: getResponsiveValue(
                  DesignSystem.spacing.md,
                  DesignSystem.spacing.lg,
                  DesignSystem.spacing.xl,
                ),
              },
            ]}
          >
            <TouchableOpacity
              style={[
                headerStyles.statItem,
                isTablet && {
                  paddingHorizontal: getResponsiveValue(0, DesignSystem.spacing.sm, DesignSystem.spacing.md),
                },
              ]}
              onPress={onShowDueSoonPopup}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  headerStyles.statNumber,
                  {
                    color: colors.primary,
                  },
                  isTablet && {
                    fontSize: headerStyles.statNumber.fontSize * statsFontMultiplier,
                    lineHeight: (headerStyles.statNumber.fontSize * statsFontMultiplier) * 1.2,
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
                      : "rgba(15, 23, 42, 0.85)",
                  },
                  isTablet && {
                    fontSize: (headerStyles.statLabel.fontSize || 14) * statsFontMultiplier,
                    lineHeight: ((headerStyles.statLabel.fontSize || 14) * statsFontMultiplier) * 1.3,
                  },
                ]}
              >
                Due Soon
              </Text>
            </TouchableOpacity>
            <View style={[
              headerStyles.statDivider,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.08)",
              },
            ]} />
            <TouchableOpacity
              style={[
                headerStyles.statItem,
                isTablet && {
                  paddingHorizontal: getResponsiveValue(0, DesignSystem.spacing.sm, DesignSystem.spacing.md),
                },
              ]}
              onPress={() => {
                navigation.navigate("CompletionHistory");
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  headerStyles.statNumber,
                  {
                    color: colors.success,
                  },
                  isTablet && {
                    fontSize: headerStyles.statNumber.fontSize * statsFontMultiplier,
                    lineHeight: (headerStyles.statNumber.fontSize * statsFontMultiplier) * 1.2,
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
                      : "rgba(15, 23, 42, 0.85)",
                  },
                  isTablet && {
                    fontSize: (headerStyles.statLabel.fontSize || 14) * statsFontMultiplier,
                    lineHeight: ((headerStyles.statLabel.fontSize || 14) * statsFontMultiplier) * 1.3,
                  },
                ]}
              >
                Completed
              </Text>
            </TouchableOpacity>
            <View style={[
              headerStyles.statDivider,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.08)",
              },
            ]} />
            <TouchableOpacity
              style={[
                headerStyles.statItem,
                isTablet && {
                  paddingHorizontal: getResponsiveValue(0, DesignSystem.spacing.sm, DesignSystem.spacing.md),
                },
              ]}
              onPress={onShowStreakPopup}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  headerStyles.statNumber,
                  {
                    color: colors.accent,
                  },
                  isTablet && {
                    fontSize: headerStyles.statNumber.fontSize * statsFontMultiplier,
                    lineHeight: (headerStyles.statNumber.fontSize * statsFontMultiplier) * 1.2,
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
                      : "rgba(15, 23, 42, 0.85)",
                  },
                  isTablet && {
                    fontSize: (headerStyles.statLabel.fontSize || 14) * statsFontMultiplier,
                    lineHeight: ((headerStyles.statLabel.fontSize || 14) * statsFontMultiplier) * 1.3,
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
