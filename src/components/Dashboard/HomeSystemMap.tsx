import React, { useEffect, useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { MaintenanceTask } from "../../types/maintenance";
import { DesignSystem } from "../../theme/designSystem";
import { isHomeSystemsComplete } from "../../data/maintenancePlans";
import { HearthSurfaceCard, Button } from "../ui";
import { useHaptics, useScalePress, useReducedMotion } from "../../hooks";
import {
  getHomeMapZones,
  HomeMapZoneId,
  HomeMapZoneState,
  zoneState,
  zoneCaption,
  zoneTaskCounts,
  HomeMapZone,
} from "../../data/homeMapZones";
import { emergencyProgressSubtitle } from "../../types/homeEmergency";
import {
  LastCompletionMap,
  ZoneHealth,
  ZoneHealthGrade,
  computeAllZoneHealth,
  overallHomeHealth,
  zoneHealthReason,
} from "../../utils/zoneHealth";

interface HomeSystemMapProps {
  overdueTasks: MaintenanceTask[];
  upcomingTasks: MaintenanceTask[];
  /** routine_id → latest completion, for the recency half of the zone score. */
  lastCompletion?: LastCompletionMap;
  selectedZoneId: HomeMapZoneId | null;
  onSelectZone: (zoneId: HomeMapZoneId | null) => void;
  onSetupHome?: () => void;
  weatherOverlay?: "freeze" | "storm" | "heat" | null;
  showPins?: boolean;
  onPinPress?: (kind: "water" | "electrical") => void;
}

const ZONE_ICONS: Record<HomeMapZoneId, keyof typeof Ionicons.glyphMap> = {
  exterior: "home-outline",
  interior: "grid-outline",
  hvac: "thermometer-outline",
  water: "water-outline",
  electrical: "flash-outline",
  appliances: "restaurant-outline",
  yard: "leaf-outline",
  pool: "water-outline",
  safety: "shield-checkmark-outline",
};

function stateColors(
  state: HomeMapZoneState,
  colors: { primary: string; error: string; text: string; textSecondary: string },
  isDark: boolean
) {
  if (state === "overdue") {
    return {
      fill: colors.error + (isDark ? "44" : "28"),
      ink: colors.error,
      statusLabel: "overdue" as const,
    };
  }
  if (state === "due") {
    return {
      fill: colors.primary + (isDark ? "40" : "26"),
      ink: colors.primary,
      statusLabel: "due" as const,
    };
  }
  if (state === "scheduled") {
    return {
      fill: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.5)",
      ink: colors.textSecondary,
      statusLabel: null,
    };
  }
  return {
    fill: isDark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.45)",
    ink: colors.textSecondary,
    statusLabel: null,
  };
}

function gradeColor(
  grade: ZoneHealthGrade | null,
  colors: { success: string; warning: string; error: string; textSecondary: string }
): string {
  if (grade === "good") return colors.success;
  if (grade === "fair") return colors.warning;
  if (grade === "needs_attention") return colors.error;
  return colors.textSecondary;
}

const GRADE_LABEL: Record<ZoneHealthGrade, string> = {
  good: "Looking good",
  fair: "A few things slipping",
  needs_attention: "Needs attention",
};

function attentionCopy(
  overdueCount: number,
  dueCount: number
): string | null {
  if (overdueCount > 0) {
    return overdueCount === 1 ? "1 overdue" : `${overdueCount} overdue`;
  }
  if (dueCount > 0) {
    return dueCount === 1 ? "1 due" : `${dueCount} due`;
  }
  return null;
}

function tileAccessibilityLabel(
  zone: HomeMapZone,
  statusText: string | null,
  selected: boolean,
  score: number | null
): string {
  const parts = [zone.label];
  if (score !== null) parts.push(`health ${score} out of 100`);
  if (statusText) parts.push(statusText);
  else parts.push("all clear");
  if (selected) parts.push("filtering schedule");
  else parts.push("tap to filter");
  return parts.join(", ");
}

const EMPTY_COMPLETIONS: LastCompletionMap = {};

function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

function ZoneTile({
  zone,
  state,
  overdueCount,
  dueCount,
  health,
  selected,
  onPress,
}: {
  zone: HomeMapZone;
  state: HomeMapZoneState;
  overdueCount: number;
  dueCount: number;
  health: ZoneHealth | undefined;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const score = health?.score ?? null;
  const scoreColor = gradeColor(health?.grade ?? null, colors);
  const { triggerLight } = useHaptics();
  const { animatedStyle, onPressIn, onPressOut } = useScalePress(0.97);
  const reducedMotion = useReducedMotion();
  const palette = stateColors(state, colors, isDark);
  const statusText = attentionCopy(overdueCount, dueCount);
  const pulse = useSharedValue(1);

  // Selection uses a cream/white ring — never the status orange/red.
  const borderColor = selected
    ? isDark
      ? "rgba(255, 236, 214, 0.85)"
      : "rgba(60, 40, 24, 0.55)"
    : isDark
      ? "rgba(255,236,214,0.10)"
      : "rgba(80,55,35,0.08)";

  useEffect(() => {
    if (state === "overdue" && !reducedMotion) {
      pulse.value = withRepeat(
        withTiming(1.03, { duration: 900 }),
        -1,
        true
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = 1;
    }
    return () => {
      cancelAnimation(pulse);
    };
  }, [state, reducedMotion, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity:
      state === "overdue" && !reducedMotion
        ? 0.86 + (pulse.value - 1) * 4
        : 1,
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        void triggerLight();
        onPress();
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.tilePress}
      accessibilityRole="button"
      accessibilityLabel={tileAccessibilityLabel(
        zone,
        statusText,
        selected,
        score
      )}
      accessibilityState={{ selected }}
    >
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <Animated.View
          style={[
            styles.tile,
            {
              backgroundColor: palette.fill,
              borderColor,
              borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
            },
            pulseStyle,
          ]}
        >
          <View style={styles.tileTop}>
            <Ionicons
              name={ZONE_ICONS[zone.id]}
              size={20}
              color={palette.ink}
            />
            <View style={styles.tileTopRight}>
              {selected ? (
                <Text style={[styles.filteringTag, { color: colors.text }]}>
                  Filtering
                </Text>
              ) : null}
              {score !== null ? (
                <Text style={[styles.scoreText, { color: scoreColor }]}>
                  {score}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.tileBottom}>
            <Text
              style={[styles.tileLabel, { color: colors.text }]}
              numberOfLines={2}
            >
              {zone.label}
            </Text>
            {statusText ? (
              <Text style={[styles.statusText, { color: palette.ink }]}>
                {statusText}
              </Text>
            ) : null}
            {score !== null ? (
              <View
                style={[
                  styles.scoreTrack,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.10)"
                      : "rgba(80,55,35,0.10)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.scoreFill,
                    { width: `${score}%`, backgroundColor: scoreColor },
                  ]}
                />
              </View>
            ) : null}
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export function HomeSystemMap({
  overdueTasks,
  upcomingTasks,
  lastCompletion = EMPTY_COMPLETIONS,
  selectedZoneId,
  onSelectZone,
  onSetupHome,
  weatherOverlay: _weatherOverlay,
  showPins,
  onPinPress,
}: HomeSystemMapProps) {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const { triggerLight } = useHaptics();
  const home = profile?.home_systems;
  const setupComplete = isHomeSystemsComplete(home);
  const zones = useMemo(
    () => getHomeMapZones(home).filter((z) => !z.hidden),
    [home]
  );

  const zoneStates = useMemo(() => {
    const next: Partial<Record<HomeMapZoneId, HomeMapZoneState>> = {};
    for (const zone of zones) {
      next[zone.id] = zoneState(zone, overdueTasks, upcomingTasks);
    }
    return next;
  }, [zones, overdueTasks, upcomingTasks]);

  const zoneHealth = useMemo(
    () =>
      computeAllZoneHealth(
        zones,
        [...overdueTasks, ...upcomingTasks],
        lastCompletion
      ),
    [zones, overdueTasks, upcomingTasks, lastCompletion]
  );
  const overall = useMemo(() => overallHomeHealth(zoneHealth), [zoneHealth]);

  const countsFor = (zone: HomeMapZone) =>
    zoneTaskCounts(zone, overdueTasks, upcomingTasks);

  const selectedZone = zones.find((z) => z.id === selectedZoneId);
  const selectedHealth = selectedZone ? zoneHealth[selectedZone.id] : undefined;
  const selectedReason = selectedHealth ? zoneHealthReason(selectedHealth) : null;
  const emergencySubtitle = emergencyProgressSubtitle(
    profile?.home_emergency,
    home,
  );

  const toggle = (id: HomeMapZoneId) => {
    onSelectZone(selectedZoneId === id ? null : id);
  };

  const handleSetupPress = () => {
    void triggerLight();
    onSetupHome?.();
  };

  return (
    <View style={styles.wrap}>
      <HearthSurfaceCard containerStyle={styles.cardOuter}>
        {setupComplete && overall ? (
          <View
            style={styles.overallRow}
            accessible
            accessibilityLabel={`Home health ${overall.score} out of 100. ${GRADE_LABEL[overall.grade]}`}
          >
            <Text style={[styles.overallLabel, { color: colors.textSecondary }]}>
              Home health
            </Text>
            <Text
              style={[
                styles.overallScore,
                { color: gradeColor(overall.grade, colors) },
              ]}
            >
              {overall.score}
            </Text>
            <Text
              style={[styles.overallGrade, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {GRADE_LABEL[overall.grade]}
            </Text>
          </View>
        ) : null}
        {setupComplete ? (
          <View style={styles.grid}>
            {chunkPairs(zones).map((row) => (
              <View key={row.map((z) => z.id).join("-")} style={styles.gridRow}>
                {row.map((zone) => {
                  const counts = countsFor(zone);
                  return (
                    <ZoneTile
                      key={zone.id}
                      zone={zone}
                      state={zoneStates[zone.id] ?? "quiet"}
                      overdueCount={counts.overdueCount}
                      dueCount={counts.dueCount}
                      health={zoneHealth[zone.id]}
                      selected={selectedZoneId === zone.id}
                      onPress={() => toggle(zone.id)}
                    />
                  );
                })}
                {row.length === 1 ? <View style={styles.tilePress} /> : null}
              </View>
            ))}
          </View>
        ) : (
          <Pressable
            style={styles.setupBlock}
            onPress={handleSetupPress}
            accessibilityRole="button"
            accessibilityLabel="Set up your home"
          >
            <View
              style={[
                styles.setupIconRing,
                {
                  borderColor: colors.primary + "55",
                  backgroundColor: colors.primary + "18",
                },
              ]}
            >
              <Ionicons name="home" size={26} color={colors.primary} />
            </View>
            <Text style={[styles.setupTitle, { color: colors.text }]}>
              Your home map
            </Text>
            <Text style={[styles.setupHint, { color: colors.textSecondary }]}>
              A few questions and each category lights up when it needs you.
            </Text>
          </Pressable>
        )}

        {setupComplete && selectedZone ? (
          <View style={styles.footer}>
            <Text style={[styles.caption, { color: colors.textSecondary }]}>
              {zoneCaption(
                selectedZone,
                zoneStates[selectedZone.id] ?? "quiet",
                overdueTasks,
                upcomingTasks
              )}
            </Text>
            {selectedHealth?.score != null ? (
              <Text style={[styles.caption, { color: colors.textSecondary }]}>
                {selectedReason
                  ? `Health ${selectedHealth.score} · ${selectedReason}`
                  : `Health ${selectedHealth.score}`}
              </Text>
            ) : selectedHealth ? (
              <Text style={[styles.caption, { color: colors.textSecondary }]}>
                No tasks yet
              </Text>
            ) : null}
            <Pressable onPress={() => onSelectZone(null)} hitSlop={8}>
              <Text style={[styles.link, { color: colors.primary }]}>
                Show all
              </Text>
            </Pressable>
          </View>
        ) : null}

        {setupComplete && showPins && onPinPress ? (
          <Pressable
            onPress={() => {
              void triggerLight();
              onPinPress("water");
            }}
            style={[
              styles.emergencyCard,
              {
                backgroundColor: colors.fieldFill,
                borderColor: colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Emergency shutoffs. ${emergencySubtitle}`}
          >
            <View
              style={[
                styles.emergencyIcon,
                { backgroundColor: colors.primary + "22" },
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={styles.emergencyCopy}>
              <Text style={[styles.emergencyTitle, { color: colors.text }]}>
                Emergency shutoffs
              </Text>
              <Text
                style={[
                  styles.emergencySubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {emergencySubtitle}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}

      </HearthSurfaceCard>

      {!setupComplete && onSetupHome ? (
        <View style={styles.setupButtonWrap}>
          <Button label="Set up your home" onPress={handleSetupPress} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.md,
  },
  cardOuter: {
    marginBottom: DesignSystem.spacing.xs,
  },
  grid: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.sm,
    gap: 8,
  },
  gridRow: {
    flexDirection: "row",
    gap: 8,
  },
  tilePress: {
    flex: 1,
    minWidth: 0,
  },
  tile: {
    minHeight: 88,
    borderRadius: DesignSystem.borders.radius.medium,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  tileTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  tileTopRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scoreText: {
    ...DesignSystem.typography.caption,
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  scoreTrack: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 6,
  },
  scoreFill: {
    height: 3,
    borderRadius: 2,
  },
  overallRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.md,
  },
  overallLabel: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
  },
  overallScore: {
    ...DesignSystem.typography.callout,
    fontSize: 22,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  overallGrade: {
    ...DesignSystem.typography.caption,
    fontSize: 12,
    flexShrink: 1,
  },
  filteringTag: {
    ...DesignSystem.typography.caption,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  tileBottom: {
    gap: 2,
  },
  tileLabel: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
  },
  statusText: {
    ...DesignSystem.typography.caption,
    fontSize: 12,
    fontWeight: "600",
  },
  setupBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.lg,
  },
  setupIconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.sm,
  },
  setupTitle: {
    ...DesignSystem.typography.callout,
    fontWeight: "700",
    marginBottom: DesignSystem.spacing.xs,
  },
  setupHint: {
    ...DesignSystem.typography.footnote,
    textAlign: "center",
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.sm,
    gap: 4,
    alignItems: "center",
  },
  caption: {
    ...DesignSystem.typography.footnote,
    textAlign: "center",
  },
  link: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    fontSize: 12,
  },
  emergencyCard: {
    marginHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emergencyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  emergencyTitle: {
    ...DesignSystem.typography.footnote,
    fontWeight: "700",
  },
  emergencySubtitle: {
    ...DesignSystem.typography.caption,
    fontSize: 12,
  },
  setupButtonWrap: {
    marginTop: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.xl,
  },
});
