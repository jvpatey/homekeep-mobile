import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useHaptics } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { HomeMapZone, HomeMapZoneId } from "../../data/homeMapZones";
import { ZoneUpkeep } from "../../utils/upkeep";
import { upkeepGradeColor } from "../today/upkeepColors";
import { ZONE_ICONS } from "../Dashboard/HomeSystemMap";

interface ZoneFilterChipsProps {
  zones: HomeMapZone[];
  statuses: Partial<Record<HomeMapZoneId, ZoneUpkeep>>;
  counts: Partial<Record<HomeMapZoneId, number>>;
  totalCount: number;
  value: HomeMapZoneId | null;
  onChange: (zone: HomeMapZoneId | null) => void;
}

function Chip({
  label,
  icon,
  count,
  dot,
  selected,
  onPress,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  count: number;
  dot: string | null;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  const ink = selected ? "#FFFFFF" : colors.text;

  return (
    <Pressable
      onPress={() => {
        void triggerLight();
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.text : colors.surface,
          borderColor: selected ? colors.text : colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${count} ${count === 1 ? "task" : "tasks"}`}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? colors.background : colors.textSecondary}
        />
      ) : null}
      <Text
        style={[styles.label, { color: selected ? colors.background : ink }]}
        maxFontSizeMultiplier={1.3}
      >
        {label}
      </Text>
      {count > 0 ? (
        <View
          style={[
            styles.count,
            {
              backgroundColor: selected
                ? colors.background + "33"
                : colors.fieldFill,
            },
          ]}
        >
          {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
          <Text
            style={[
              styles.countText,
              { color: selected ? colors.background : colors.textSecondary },
            ]}
          >
            {count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Horizontal home-area filter for the schedule; each chip shows open tasks and a status dot. */
export function ZoneFilterChips({
  zones,
  statuses,
  counts,
  totalCount,
  value,
  onChange,
}: ZoneFilterChipsProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityLabel="Filter by home area"
    >
      <Chip
        label="All"
        count={totalCount}
        dot={null}
        selected={value === null}
        onPress={() => onChange(null)}
      />
      {zones.map((zone) => {
        const status = statuses[zone.id];
        const attention =
          status?.state === "late" || status?.state === "needsAttention";
        return (
          <Chip
            key={zone.id}
            label={zone.shortLabel}
            icon={ZONE_ICONS[zone.id]}
            count={counts[zone.id] ?? 0}
            dot={attention ? upkeepGradeColor(status?.grade ?? null, colors) : null}
            selected={value === zone.id}
            onPress={() => onChange(value === zone.id ? null : zone.id)}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
  },
  count: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: DesignSystem.borders.radius.round,
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  countText: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
