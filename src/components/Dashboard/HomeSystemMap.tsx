import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";
import { useHaptics, useScalePress } from "../../hooks";
import { HomeMapZone, HomeMapZoneId } from "../../data/homeMapZones";
import { RoutineUpkeep, ZoneUpkeep, zoneUpkeep } from "../../utils/upkeep";
import { upkeepGradeColor } from "../today/upkeepColors";

export const ZONE_ICONS: Record<HomeMapZoneId, keyof typeof Ionicons.glyphMap> = {
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

interface HomeSystemMapProps {
  zones: HomeMapZone[];
  routines: RoutineUpkeep[];
  onZonePress: (zoneId: HomeMapZoneId) => void;
}

function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
}

function ZoneTile({
  zone,
  status,
  onPress,
}: {
  zone: HomeMapZone;
  status: ZoneUpkeep;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const { triggerLight } = useHaptics();
  const { animatedStyle, onPressIn, onPressOut } = useScalePress(0.97);
  const dot = upkeepGradeColor(status.grade, colors);
  const attention =
    status.state === "late" || status.state === "needsAttention";

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
      accessibilityLabel={`${zone.label}, ${status.label}`}
      accessibilityHint="Opens this area's tasks"
    >
      <Animated.View
        style={[
          styles.tile,
          {
            backgroundColor: attention
              ? dot + (isDark ? "26" : "14")
              : isDark
                ? "rgba(255,255,255,0.05)"
                : colors.background + "B3",
            borderColor: attention ? dot + "40" : colors.border,
          },
          animatedStyle,
        ]}
      >
        <Ionicons
          name={ZONE_ICONS[zone.id]}
          size={18}
          color={attention ? dot : colors.textSecondary}
        />
        <View style={styles.tileCopy}>
          <Text
            style={[styles.tileLabel, { color: colors.text }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}
          >
            {zone.label}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: dot }]} />
            <Text
              style={[
                styles.statusText,
                { color: attention ? dot : colors.textSecondary },
              ]}
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
            >
              {status.label}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

/** Compact two-column grid of home areas with a word status each. */
export function HomeSystemMap({ zones, routines, onZonePress }: HomeSystemMapProps) {
  const statuses = useMemo(() => {
    const next: Partial<Record<HomeMapZoneId, ZoneUpkeep>> = {};
    for (const zone of zones) next[zone.id] = zoneUpkeep(routines, zone.id);
    return next;
  }, [zones, routines]);

  return (
    <View style={styles.grid}>
      {chunkPairs(zones).map((row) => (
        <View key={row.map((z) => z.id).join("-")} style={styles.gridRow}>
          {row.map((zone) => (
            <ZoneTile
              key={zone.id}
              zone={zone}
              status={statuses[zone.id] ?? zoneUpkeep([], zone.id)}
              onPress={() => onZonePress(zone.id)}
            />
          ))}
          {row.length === 1 ? <View style={styles.tilePress} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: DesignSystem.spacing.sm,
  },
  gridRow: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
  },
  tilePress: {
    flex: 1,
    minWidth: 0,
  },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm + 2,
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  tileLabel: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...DesignSystem.typography.caption,
    fontWeight: "500",
    flexShrink: 1,
  },
});
