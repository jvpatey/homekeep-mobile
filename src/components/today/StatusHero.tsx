import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { useHaptics, useWeather } from "../../hooks";
import { pickTemperatureUnit } from "../../services/WeatherService";
import { formatProfileLocality } from "../../utils/formatProfileAddress";
import { DesignSystem } from "../../theme/designSystem";
import { HearthSurfaceCard } from "../ui";
import { HomeSystemMap } from "../Dashboard/HomeSystemMap";
import { HomeMapZone, HomeMapZoneId } from "../../data/homeMapZones";
import {
  UPKEEP_GRADE_LABEL,
  UpkeepResult,
  upkeepSummary,
} from "../../utils/upkeep";
import { formatUpkeepTrend } from "../../utils/upkeepTrend";
import { UpkeepRing } from "./UpkeepRing";
import { upkeepGradeColor } from "./upkeepColors";

interface StatusHeroProps {
  userName: string;
  upkeep: UpkeepResult;
  trendDelta: number | null;
  zones: HomeMapZone[];
  seasonLabel: string | null;
  overdueCount: number;
  dueTodayCount: number;
  onZonePress: (zoneId: HomeMapZoneId) => void;
  onStatusChipPress: (kind: "overdue" | "today") => void;
  onAddressPress: () => void;
}

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function ringCopy(upkeep: UpkeepResult): {
  progress: number;
  value: string;
  caption: string;
  headline: string;
} {
  if (upkeep.state === "scored") {
    return {
      progress: upkeep.score / 100,
      value: String(upkeep.score),
      caption: "Upkeep",
      headline: UPKEEP_GRADE_LABEL[upkeep.grade],
    };
  }
  if (upkeep.state === "gettingStarted") {
    if (upkeep.routinesNeeded > 0) {
      const have = upkeep.routines.length;
      const need = have + upkeep.routinesNeeded;
      return {
        progress: have / need,
        value: `${have}/${need}`,
        caption: "Reminders",
        headline: `Add ${upkeep.routinesNeeded} more ${
          upkeep.routinesNeeded === 1 ? "reminder" : "reminders"
        }`,
      };
    }
    const left = upkeep.target - upkeep.completed;
    return {
      progress: upkeep.completed / upkeep.target,
      value: `${upkeep.completed}/${upkeep.target}`,
      caption: "First jobs",
      headline: `${left} first ${left === 1 ? "job" : "jobs"} to go`,
    };
  }
  return { progress: 0, value: "—", caption: "Upkeep", headline: "Getting started" };
}

/** Today's opening card: greeting, Upkeep ring and reason, weather, home areas. */
export function StatusHero({
  userName,
  upkeep,
  trendDelta,
  zones,
  seasonLabel,
  overdueCount,
  dueTodayCount,
  onZonePress,
  onStatusChipPress,
  onAddressPress,
}: StatusHeroProps) {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const { triggerLight } = useHaptics();

  const temperatureUnit = useMemo(
    () => pickTemperatureUnit(profile?.country),
    [profile?.country]
  );
  const hasCoords = profile?.latitude != null && profile?.longitude != null;
  const { weather } = useWeather({
    latitude: profile?.latitude ?? null,
    longitude: profile?.longitude ?? null,
    temperatureUnit,
  });
  const unitSymbol = temperatureUnit === "fahrenheit" ? "°F" : "°C";
  const locality = formatProfileLocality(profile);

  const contextLine = useMemo(() => {
    if (weather) {
      const parts = [`${weather.temperature}${unitSymbol}`, weather.conditionLabel];
      if (seasonLabel) parts.push(seasonLabel);
      return { icon: weather.iconName, text: parts.join(" · "), needsAddress: false };
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
    return { icon: "location-outline" as const, text: parts.join(" · "), needsAddress: false };
  }, [weather, hasCoords, unitSymbol, locality, seasonLabel]);

  const statusChip =
    overdueCount > 0
      ? {
          key: "overdue" as const,
          label: `${overdueCount} overdue`,
          color: colors.error,
        }
      : dueTodayCount > 0
        ? {
            key: "today" as const,
            label: `${dueTodayCount} due today`,
            color: colors.primary,
          }
        : null;

  const ring = ringCopy(upkeep);
  const gradeColor =
    upkeep.state === "scored"
      ? upkeepGradeColor(upkeep.grade, colors)
      : colors.primary;
  const summary = upkeepSummary(upkeep);
  const trend =
    upkeep.state === "scored" && trendDelta !== null
      ? {
          label: formatUpkeepTrend(trendDelta),
          icon: (trendDelta > 0
            ? "trending-up"
            : trendDelta < 0
              ? "trending-down"
              : "remove") as keyof typeof Ionicons.glyphMap,
        }
      : null;

  const ringLabel =
    upkeep.state === "scored"
      ? `Upkeep ${upkeep.score} out of 100, ${ring.headline}. ${summary}`
      : `${ring.headline}. ${summary}`;

  return (
    <HearthSurfaceCard emphasis="hero" style={styles.card}>
      <Text
        style={[styles.greeting, { color: colors.text }]}
        accessibilityRole="header"
        maxFontSizeMultiplier={1.3}
      >
        {greetingFor(new Date().getHours())}, {userName}
      </Text>

      {contextLine ? (
        <Pressable
          onPress={() => {
            if (!contextLine.needsAddress) return;
            void triggerLight();
            onAddressPress();
          }}
          disabled={!contextLine.needsAddress}
          style={styles.contextRow}
          accessibilityRole={contextLine.needsAddress ? "button" : "text"}
          accessibilityLabel={contextLine.text}
        >
          <Ionicons
            name={contextLine.icon as keyof typeof Ionicons.glyphMap}
            size={15}
            color={contextLine.needsAddress ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.contextText,
              {
                color: contextLine.needsAddress
                  ? colors.primary
                  : colors.textSecondary,
              },
            ]}
            numberOfLines={1}
          >
            {contextLine.text}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.scoreRow}>
        <View accessible accessibilityRole="summary" accessibilityLabel={ringLabel}>
          <UpkeepRing progress={ring.progress} color={gradeColor}>
            <Text
              style={[
                styles.ringValue,
                { color: colors.text },
                ring.value.length > 3 && styles.ringValueSmall,
              ]}
              maxFontSizeMultiplier={1.1}
            >
              {ring.value}
            </Text>
            <Text
              style={[styles.ringCaption, { color: colors.textSecondary }]}
              maxFontSizeMultiplier={1.1}
            >
              {ring.caption}
            </Text>
          </UpkeepRing>
        </View>

        <View style={styles.scoreCopy}>
          <Text
            style={[styles.gradeWord, { color: gradeColor }]}
            maxFontSizeMultiplier={1.3}
          >
            {ring.headline}
          </Text>
          <Text
            style={[styles.summary, { color: colors.textSecondary }]}
            numberOfLines={4}
            maxFontSizeMultiplier={1.4}
          >
            {summary}
          </Text>
          <View style={styles.pills}>
            {trend ? (
              <View style={[styles.pill, { backgroundColor: colors.fieldFill }]}>
                <Ionicons name={trend.icon} size={13} color={colors.textSecondary} />
                <Text style={[styles.pillText, { color: colors.textSecondary }]}>
                  {trend.label}
                </Text>
              </View>
            ) : null}
            {statusChip ? (
              <Pressable
                onPress={() => {
                  void triggerLight();
                  onStatusChipPress(statusChip.key);
                }}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.pill,
                  {
                    backgroundColor: statusChip.color + "1A",
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${statusChip.label}, open tasks`}
              >
                <Text style={[styles.pillText, { color: statusChip.color, fontWeight: "700" }]}>
                  {statusChip.label}
                </Text>
                <Ionicons name="chevron-forward" size={12} color={statusChip.color} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      {zones.length > 0 ? (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <HomeSystemMap
            zones={zones}
            routines={upkeep.routines}
            onZonePress={onZonePress}
          />
        </>
      ) : null}
    </HearthSurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: DesignSystem.spacing.lg - 4,
  },
  greeting: {
    ...DesignSystem.typography.title2,
  },
  contextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs + 2,
    marginTop: DesignSystem.spacing.xs,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  contextText: {
    ...DesignSystem.typography.footnote,
    flexShrink: 1,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md + 4,
    marginTop: DesignSystem.spacing.lg - 4,
  },
  ringValue: {
    fontFamily: DesignSystem.fonts.display,
    fontSize: 34,
    lineHeight: 38,
    fontVariant: ["tabular-nums"],
  },
  ringValueSmall: {
    fontSize: 24,
    lineHeight: 30,
  },
  ringCaption: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 10,
  },
  scoreCopy: {
    flex: 1,
    minWidth: 0,
    gap: DesignSystem.spacing.xs,
  },
  gradeWord: {
    ...DesignSystem.typography.headline,
    fontFamily: DesignSystem.fonts.displaySemiBold,
    fontSize: 20,
    lineHeight: 26,
  },
  summary: {
    ...DesignSystem.typography.subhead,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.xs + 2,
    marginTop: DesignSystem.spacing.xs,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: DesignSystem.borders.radius.round,
  },
  pillText: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: DesignSystem.spacing.md + 4,
  },
});
