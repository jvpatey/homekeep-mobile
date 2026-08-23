import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { useWeather } from "../../hooks";
import { pickTemperatureUnit } from "../../services/WeatherService";
import { useDevice, useHaptics } from "../../hooks";
import { ProfileMenu } from "./profile";
import { useNavigation } from "@react-navigation/native";
import { AppStackParamList } from "../../navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DesignSystem } from "../../theme/designSystem";
import { HouseMark } from "../ui";

interface DashboardHeaderProps {
  userName: string;
  greeting: string;
  overdueCount: number;
  dueTodayCount: number;
  onOpenEquipmentManuals?: () => void;
  onOpenAddressEditor: () => void;
  onScrollToSection?: (sectionKey: string) => void;
  animatedStyle?: object;
}

export function DashboardHeader({
  userName,
  greeting,
  overdueCount,
  dueTodayCount,
  onOpenEquipmentManuals,
  onOpenAddressEditor,
  onScrollToSection,
  animatedStyle,
}: DashboardHeaderProps) {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const { triggerLight } = useHaptics();
  const { isTablet, getResponsiveValue } = useDevice();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const temperatureUnit = useMemo(
    () => pickTemperatureUnit(profile?.country),
    [profile?.country]
  );

  const hasCoords =
    profile?.latitude != null && profile?.longitude != null;

  const { weather } = useWeather({
    latitude: profile?.latitude ?? null,
    longitude: profile?.longitude ?? null,
    temperatureUnit,
  });

  const unitSymbol = temperatureUnit === "fahrenheit" ? "°F" : "°C";

  const weatherLine = useMemo(() => {
    if (weather) {
      return `${weather.temperature}${unitSymbol} · ${weather.conditionLabel}`;
    }
    if (!hasCoords) {
      return "Add your address for local weather";
    }
    return null;
  }, [weather, hasCoords, unitSymbol]);

  const headerAvatarSize = isTablet ? getResponsiveValue(44, 52, 56) : 44;

  const handleWeatherPress = () => {
    triggerLight();
    if (!hasCoords) {
      onOpenAddressEditor();
    }
  };

  const handleChipPress = (key: string) => {
    triggerLight();
    onScrollToSection?.(key);
  };

  const Wrapper = animatedStyle ? Animated.View : View;

  return (
    <Wrapper style={[styles.container, animatedStyle]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.wordmarkRow}>
          <View style={styles.wordmarkMark}>
            <HouseMark size={20} inline />
          </View>
          <Text style={[styles.wordmark, { color: colors.text }]}>
            HomeKeep
          </Text>
        </View>

        <View style={styles.topActions}>
          {onOpenEquipmentManuals ? (
            <TouchableOpacity
              onPress={() => {
                triggerLight();
                onOpenEquipmentManuals();
              }}
              hitSlop={8}
              style={styles.iconHit}
              accessibilityRole="button"
              accessibilityLabel="Equipment manuals"
            >
              <Ionicons
                name="book-outline"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}

          <ProfileMenu navigation={navigation} />
        </View>
      </View>

      {/* Greeting */}
      <Text
        style={[styles.greeting, { color: colors.text }]}
        maxFontSizeMultiplier={1.25}
      >
        {greeting}, {userName}
      </Text>

      {/* Context line + chips */}
      <View style={styles.contextRow}>
        {weatherLine ? (
          <Pressable
            onPress={handleWeatherPress}
            accessibilityRole="button"
            accessibilityLabel={weatherLine}
          >
            <Text
              style={[styles.contextText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {weatherLine}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {(overdueCount > 0 || dueTodayCount > 0) && (
        <View style={styles.chipRow}>
          {overdueCount > 0 && (
            <Pressable
              onPress={() => handleChipPress("overdue")}
              style={[
                styles.chip,
                {
                  backgroundColor: colors.glassTint,
                  borderColor: colors.error + "44",
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${overdueCount} overdue tasks`}
            >
              <Text style={[styles.chipText, { color: colors.error }]}>
                {overdueCount} overdue
              </Text>
            </Pressable>
          )}
          {dueTodayCount > 0 && (
            <Pressable
              onPress={() => handleChipPress("__today__")}
              style={[
                styles.chip,
                {
                  backgroundColor: colors.glassTint,
                  borderColor: colors.primary + "44",
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${dueTodayCount} due today`}
            >
              <Text style={[styles.chipText, { color: colors.primary }]}>
                {dueTodayCount} due today
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.xl + DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.md,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: DesignSystem.spacing.lg,
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm + 2,
  },
  wordmarkMark: {
    height: 20,
    justifyContent: "center",
  },
  wordmark: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  iconHit: {
    minWidth: DesignSystem.components.minTouchTarget,
    minHeight: DesignSystem.components.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    ...DesignSystem.typography.title1,
    marginBottom: DesignSystem.spacing.sm,
  },
  contextRow: {
    marginBottom: DesignSystem.spacing.sm,
  },
  contextText: {
    ...DesignSystem.typography.callout,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.xs,
  },
  chip: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs + 2,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: 1,
  },
  chipText: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
  },
});
