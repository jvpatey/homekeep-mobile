import React from "react";
import { View, Text, Pressable, StyleSheet, DimensionValue } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { MaintenanceTask } from "../../types/maintenance";
import { DesignSystem } from "../../theme/designSystem";
import { isHomeSystemsComplete } from "../../data/maintenancePlans";
import { HearthSurfaceCard, Button } from "../ui";
import { useHaptics, useScalePress } from "../../hooks";
import {
  getHomeMapZones,
  HomeMapZoneId,
  HomeMapZoneState,
  zoneState,
  zoneCaption,
  HomeMapZone,
} from "../../data/homeMapZones";

interface HomeSystemMapProps {
  overdueTasks: MaintenanceTask[];
  upcomingTasks: MaintenanceTask[];
  selectedZoneId: HomeMapZoneId | null;
  onSelectZone: (zoneId: HomeMapZoneId | null) => void;
  onSetupHome?: () => void;
  weatherOverlay?: "freeze" | "storm" | "heat" | null;
  showPins?: boolean;
  onPinPress?: (kind: "water" | "electrical") => void;
}

const ZONE_ICONS: Record<
  HomeMapZoneId,
  keyof typeof Ionicons.glyphMap
> = {
  exterior: "home-outline",
  hvac: "thermometer-outline",
  water: "water-outline",
  electrical: "flash-outline",
  appliances: "restaurant-outline",
  yard: "leaf-outline",
  pool: "water-outline",
  safety: "shield-checkmark-outline",
};

const ZONE_LAYOUT: Record<
  HomeMapZoneId,
  {
    top: DimensionValue;
    left: DimensionValue;
    width: DimensionValue;
    height: DimensionValue;
  }
> = {
  exterior: { top: "0%", left: "12%", width: "76%", height: "30%" },
  hvac: { top: "32%", left: "7%", width: "27%", height: "26%" },
  water: { top: "32%", left: "36.5%", width: "27%", height: "26%" },
  electrical: { top: "32%", left: "66%", width: "27%", height: "26%" },
  appliances: { top: "60%", left: "7%", width: "56%", height: "22%" },
  safety: { top: "60%", left: "66%", width: "27%", height: "22%" },
  yard: { top: "84%", left: "5%", width: "90%", height: "14%" },
  pool: { top: "70%", left: "2%", width: "24%", height: "22%" },
};

function stateColors(
  state: HomeMapZoneState,
  colors: { primary: string; error: string; border: string }
) {
  if (state === "overdue") {
    return {
      fill: colors.error + "40",
      border: colors.error,
      dot: colors.error,
    };
  }
  if (state === "due") {
    return {
      fill: colors.primary + "45",
      border: colors.primary,
      dot: colors.primary,
    };
  }
  return {
    fill: colors.border + "55",
    border: colors.border,
    dot: colors.border,
  };
}

function ZoneRegion({
  zone,
  state,
  selected,
  onPress,
  layout,
}: {
  zone: HomeMapZone;
  state: HomeMapZoneState;
  selected: boolean;
  onPress: () => void;
  layout: {
    top: DimensionValue;
    left: DimensionValue;
    width: DimensionValue;
    height: DimensionValue;
  };
}) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  const { animatedStyle, onPressIn, onPressOut } = useScalePress(0.96);
  const palette = stateColors(state, colors);
  const icon = ZONE_ICONS[zone.id];

  const handlePress = () => {
    void triggerLight();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.zoneHit,
        {
          top: layout.top,
          left: layout.left,
          width: layout.width,
          height: layout.height,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={zone.label}
      accessibilityState={{ selected }}
    >
      <Animated.View
        style={[
          styles.zoneInner,
          {
            backgroundColor: palette.fill,
            borderColor: selected ? colors.primary : palette.border,
            borderWidth: selected ? 2 : 1,
          },
          animatedStyle,
        ]}
      >
        <Ionicons name={icon} size={14} color={palette.dot} />
        <Text
          style={[styles.zoneLabel, { color: colors.text }]}
          numberOfLines={1}
        >
          {zone.label.split(" ")[0]}
        </Text>
        {state !== "quiet" ? (
          <View style={[styles.stateDot, { backgroundColor: palette.dot }]} />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function HouseSilhouette({
  isHouse,
  hasChimney,
}: {
  isHouse: boolean;
  hasChimney: boolean;
}) {
  const { colors, isDark } = useTheme();

  const wall = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.72)";
  const roof = isDark ? "rgba(255,255,255,0.12)" : "rgba(62, 56, 48, 0.12)";
  const trim = isDark ? "rgba(255,255,255,0.18)" : "rgba(62, 56, 48, 0.2)";
  const door = colors.primary + (isDark ? "88" : "55");

  return (
    <View style={styles.silhouette} pointerEvents="none">
      {isHouse ? (
        <View
          style={[
            styles.roofPeak,
            {
              borderBottomColor: roof,
            },
          ]}
        />
      ) : (
        <View style={[styles.flatRoofBar, { backgroundColor: roof }]} />
      )}

      <View
        style={[
          styles.facade,
          {
            backgroundColor: wall,
            borderColor: trim,
          },
        ]}
      >
        {hasChimney ? (
          <View
            style={[
              styles.chimney,
              { backgroundColor: roof, borderColor: trim },
            ]}
          />
        ) : null}

        <View style={styles.windowRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.window, { borderColor: trim, backgroundColor: wall }]}
            >
              <View style={[styles.windowCross, { backgroundColor: trim }]} />
              <View
                style={[
                  styles.windowCross,
                  styles.windowCrossVertical,
                  { backgroundColor: trim },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={[styles.door, { backgroundColor: door, borderColor: trim }]}>
          <View style={[styles.doorKnob, { backgroundColor: colors.primary }]} />
        </View>

        <View style={[styles.foundation, { backgroundColor: trim + "66" }]} />
      </View>

      <View
        style={[
          styles.ground,
          {
            backgroundColor: isDark
              ? "rgba(255,255,255,0.06)"
              : colors.secondary + "22",
          },
        ]}
      />
    </View>
  );
}

export function HomeSystemMap({
  overdueTasks,
  upcomingTasks,
  selectedZoneId,
  onSelectZone,
  onSetupHome,
  weatherOverlay,
  showPins,
  onPinPress,
}: HomeSystemMapProps) {
  const { colors, isDark } = useTheme();
  const { profile } = useProfile();
  const { triggerLight } = useHaptics();
  const home = profile?.home_systems;
  const setupComplete = isHomeSystemsComplete(home);
  const isHouse = home?.propertyType !== "condo_townhome";
  const zones = getHomeMapZones(home).filter((z) => !z.hidden);

  const stateFor = (id: HomeMapZoneId): HomeMapZoneState => {
    const zone = zones.find((z) => z.id === id);
    if (!zone) return "quiet";
    return zoneState(zone, overdueTasks, upcomingTasks);
  };

  const selectedZone: HomeMapZone | undefined = zones.find(
    (z) => z.id === selectedZoneId
  );

  const caption = selectedZone
    ? zoneCaption(
        selectedZone,
        zoneState(selectedZone, overdueTasks, upcomingTasks),
        overdueTasks,
        upcomingTasks
      )
    : setupComplete
      ? "Tap a zone to filter your schedule"
      : "Tell us about this house to light up the map";

  const toggle = (id: HomeMapZoneId) => {
    onSelectZone(selectedZoneId === id ? null : id);
  };

  const handleSetupPress = () => {
    void triggerLight();
    onSetupHome?.();
  };

  const mapBody = (
    <View style={styles.stage}>
      <HouseSilhouette isHouse={isHouse} hasChimney={isHouse} />

      {setupComplete
        ? zones.map((zone) => (
            <ZoneRegion
              key={zone.id}
              zone={zone}
              state={stateFor(zone.id)}
              selected={selectedZoneId === zone.id}
              onPress={() => toggle(zone.id)}
              layout={ZONE_LAYOUT[zone.id]}
            />
          ))
        : null}

      {!setupComplete ? (
        <Pressable
          style={[
            styles.setupOverlay,
            {
              backgroundColor: isDark
                ? "rgba(26, 22, 18, 0.55)"
                : "rgba(255, 252, 247, 0.72)",
            },
          ]}
          onPress={handleSetupPress}
          accessibilityRole="button"
          accessibilityLabel="Set up your home"
        >
          <View
            style={[
              styles.setupIconRing,
              { borderColor: colors.primary + "55", backgroundColor: colors.primary + "18" },
            ]}
          >
            <Ionicons name="home" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.setupTitle, { color: colors.text }]}>
            Your home map
          </Text>
          <Text style={[styles.setupHint, { color: colors.textSecondary }]}>
            A few quick questions and each zone lights up with what needs
            attention.
          </Text>
        </Pressable>
      ) : null}

      {showPins ? (
        <View style={styles.pinRow} pointerEvents="box-none">
          <Pressable
            onPress={() => onPinPress?.("water")}
            style={[styles.pin, { backgroundColor: colors.primary }]}
            accessibilityLabel="Water shutoff"
            hitSlop={8}
          />
          <Pressable
            onPress={() => onPinPress?.("electrical")}
            style={[styles.pin, { backgroundColor: colors.secondary }]}
            accessibilityLabel="Breaker panel"
            hitSlop={8}
          />
        </View>
      ) : null}

      {weatherOverlay ? (
        <View
          pointerEvents="none"
          style={[
            styles.weatherWash,
            {
              borderColor:
                weatherOverlay === "freeze"
                  ? colors.secondary
                  : weatherOverlay === "heat"
                    ? colors.primary
                    : colors.warning,
            },
          ]}
        />
      ) : null}
    </View>
  );

  return (
    <View style={styles.wrap}>
      <HearthSurfaceCard containerStyle={styles.cardOuter}>
        {mapBody}
      </HearthSurfaceCard>

      <Text style={[styles.caption, { color: colors.textSecondary }]}>
        {caption}
      </Text>

      {selectedZoneId ? (
        <Pressable onPress={() => onSelectZone(null)} hitSlop={8}>
          <Text style={[styles.link, { color: colors.primary }]}>Show all</Text>
        </Pressable>
      ) : !setupComplete && onSetupHome ? (
        <View style={styles.setupButtonWrap}>
          <Button label="Set up your home" onPress={handleSetupPress} />
        </View>
      ) : null}
    </View>
  );
}

const MAP_HEIGHT = 220;

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.md,
  },
  cardOuter: {
    marginBottom: DesignSystem.spacing.xs,
  },
  stage: {
    height: MAP_HEIGHT,
    margin: DesignSystem.spacing.md,
    position: "relative",
  },
  silhouette: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  roofPeak: {
    width: 0,
    height: 0,
    borderLeftWidth: 118,
    borderRightWidth: 118,
    borderBottomWidth: 52,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginBottom: -1,
  },
  flatRoofBar: {
    width: "82%",
    height: 14,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginBottom: -1,
  },
  facade: {
    width: "82%",
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 0,
    borderBottomLeftRadius: DesignSystem.borders.radius.medium,
    borderBottomRightRadius: DesignSystem.borders.radius.medium,
    paddingTop: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    alignItems: "center",
  },
  chimney: {
    position: "absolute",
    top: -18,
    right: 18,
    width: 16,
    height: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 2,
  },
  windowRow: {
    flexDirection: "row",
    gap: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.xs,
  },
  window: {
    width: 34,
    height: 34,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  windowCross: {
    position: "absolute",
    width: "70%",
    height: 1,
  },
  windowCrossVertical: {
    width: 1,
    height: "70%",
  },
  door: {
    width: 42,
    height: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    marginTop: DesignSystem.spacing.sm,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 6,
  },
  doorKnob: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  foundation: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
    borderBottomLeftRadius: DesignSystem.borders.radius.medium,
    borderBottomRightRadius: DesignSystem.borders.radius.medium,
  },
  ground: {
    position: "absolute",
    bottom: 0,
    width: "92%",
    height: 10,
    borderRadius: DesignSystem.borders.radius.round,
  },
  zoneHit: {
    position: "absolute",
  },
  zoneInner: {
    flex: 1,
    borderRadius: DesignSystem.borders.radius.small,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    gap: 2,
  },
  zoneLabel: {
    ...DesignSystem.typography.caption,
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
  stateDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    position: "absolute",
    top: 4,
    right: 4,
  },
  setupOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: DesignSystem.borders.radius.medium,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  setupIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  caption: {
    ...DesignSystem.typography.footnote,
    textAlign: "center",
    marginTop: DesignSystem.spacing.xs,
  },
  link: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
    textAlign: "center",
    marginTop: DesignSystem.spacing.xs,
    paddingVertical: DesignSystem.spacing.xs,
  },
  setupButtonWrap: {
    marginTop: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.xl,
  },
  pinRow: {
    position: "absolute",
    right: 4,
    top: 58,
    gap: 8,
  },
  pin: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  weatherWash: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderRadius: DesignSystem.borders.radius.medium,
    opacity: 0.4,
  },
});
