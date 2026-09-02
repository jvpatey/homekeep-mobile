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
import { useHaptics } from "../../hooks";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProfileMenu } from "./profile";
import { useNavigation } from "@react-navigation/native";
import { AppStackParamList } from "../../navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DesignSystem } from "../../theme/designSystem";
import { HouseMark } from "../ui";
import { formatProfileLocality } from "../../utils/formatProfileAddress";

interface DashboardHeaderProps {
  userName: string;
  greeting: string;
  overdueCount: number;
  dueTodayCount: number;
  onOpenEquipmentManuals?: () => void;
  onOpenAddressEditor: () => void;
  onOpenHomeSummary?: () => void;
  onScrollToSection?: (sectionKey: string) => void;
  animatedStyle?: object;
  /** Season only — e.g. "Warm season". Locality lives in the context line. */
  seasonLabel?: string | null;
}

export function DashboardHeader({
  userName,
  greeting,
  overdueCount,
  dueTodayCount,
  onOpenEquipmentManuals,
  onOpenAddressEditor,
  onOpenHomeSummary,
  onScrollToSection,
  animatedStyle,
  seasonLabel,
}: DashboardHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { triggerLight } = useHaptics();
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
  const locality = formatProfileLocality(profile);

  // One secondary line. Never repeat locality next to weather.
  const contextLine = useMemo(() => {
    if (weather) {
      const parts = [
        `${weather.temperature}${unitSymbol}`,
        weather.conditionLabel,
      ];
      if (seasonLabel) parts.push(seasonLabel);
      return {
        icon: weather.iconName,
        text: parts.join(" · "),
        needsAddress: false,
      };
    }
    if (!hasCoords) {
      return {
        icon: "location-outline" as const,
        text: "Add your address for local weather",
        needsAddress: true,
      };
    }
    const parts = [locality, seasonLabel].filter(Boolean) as string[];
    if (parts.length === 0) return null;
    return {
      icon: "location-outline" as const,
      text: parts.join(" · "),
      needsAddress: false,
    };
  }, [weather, hasCoords, unitSymbol, locality, seasonLabel]);

  // Status chip is only overdue or due today — not seasonal plan campaigns.
  const statusChip = useMemo(() => {
    if (overdueCount > 0) {
      return {
        key: "overdue",
        label: overdueCount === 1 ? "1 overdue" : `${overdueCount} overdue`,
        accessibilityLabel: `${overdueCount} overdue tasks`,
        color: colors.error,
        onPress: () => onScrollToSection?.("overdue"),
      };
    }
    if (dueTodayCount > 0) {
      return {
        key: "today",
        label: dueTodayCount === 1 ? "1 due today" : `${dueTodayCount} due today`,
        accessibilityLabel: `${dueTodayCount} due today`,
        color: colors.primary,
        onPress: () => onScrollToSection?.("__today__"),
      };
    }
    return null;
  }, [
    overdueCount,
    dueTodayCount,
    onScrollToSection,
    colors.error,
    colors.primary,
  ]);

  const handleContextPress = () => {
    triggerLight();
    onOpenAddressEditor();
  };

  const Wrapper = animatedStyle ? Animated.View : View;

  return (
    <Wrapper
      style={[
        styles.container,
        { paddingTop: insets.top + DesignSystem.spacing.md },
        animatedStyle,
      ]}
    >
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

          {onOpenHomeSummary ? (
            <TouchableOpacity
              onPress={() => {
                triggerLight();
                onOpenHomeSummary();
              }}
              hitSlop={8}
              style={styles.iconHit}
              accessibilityRole="button"
              accessibilityLabel="Home maintenance summary"
            >
              <Ionicons
                name="document-text-outline"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}

          <ProfileMenu navigation={navigation} />
        </View>
      </View>

      <Text
        style={[styles.greeting, { color: colors.text }]}
        maxFontSizeMultiplier={1.25}
      >
        {greeting}, {userName}
      </Text>

      {contextLine || statusChip ? (
        <View style={styles.metaRow}>
          {contextLine ? (
            <Pressable
              onPress={handleContextPress}
              accessibilityRole="button"
              accessibilityLabel={contextLine.text}
              style={styles.contextPressable}
            >
              <Ionicons
                name={contextLine.icon}
                size={15}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.contextText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {contextLine.text}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.contextPressable} />
          )}

          {statusChip ? (
            <Pressable
              onPress={() => {
                triggerLight();
                statusChip.onPress();
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: colors.glassTint,
                  borderColor: statusChip.color + "44",
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={statusChip.accessibilityLabel}
            >
              <Text style={[styles.chipText, { color: statusChip.color }]}>
                {statusChip.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: DesignSystem.spacing.md,
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  contextPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
    minWidth: 0,
  },
  contextText: {
    ...DesignSystem.typography.footnote,
    flexShrink: 1,
  },
  chip: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs + 2,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: 1,
    flexShrink: 0,
  },
  chipText: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
  },
});
