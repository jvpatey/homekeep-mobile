import React, { useEffect } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { useHaptics, useReducedMotion } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";
import {
  FloatingChip,
  HeroIconName as IconName,
  Sparkle,
  useEnter,
  useLoop,
  usePop,
} from "../../ui/hero/heroKit";

const HERO_HEIGHT = 228;
const PLATE = 96;
const AVATAR = 58;
const AVATAR_X = 118;
const LINK_START = PLATE / 2 + 6;
const LINK_END = AVATAR_X - AVATAR / 2 - 6;
const AVATARS_START = 260;
const CHIPS_START = 900;
/** Widest point of the scene (avatars + sparkles); scaled down on narrow phones. */
const SCENE_WIDTH = 320;

const SPARKLES = [
  { x: -150, y: -78, size: 5, delay: 900 },
  { x: 150, y: -64, size: 4, delay: 1300 },
  { x: -132, y: 84, size: 4, delay: 1700 },
  { x: 156, y: 92, size: 6, delay: 1100 },
];

const CHIPS: {
  label: string;
  x: number;
  y: number;
  tone: "primary" | "secondary";
}[] = [
  { label: "Gutters cleaned · Sam", x: 44, y: -88, tone: "secondary" },
  { label: "Filter changed · You", x: -40, y: 88, tone: "primary" },
];

/** Dashed link between a person and the house, with a dot flowing inward. */
function Link({
  side,
  color,
  reducedMotion,
}: {
  side: -1 | 1;
  color: string;
  reducedMotion: boolean;
}) {
  const { colors } = useTheme();
  const flow = useLoop(
    reducedMotion,
    1500,
    AVATARS_START + 500 + (side === 1 ? 750 : 0),
    false
  );
  const center = (side * (LINK_START + LINK_END)) / 2;
  const dotStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion
      ? 0
      : interpolate(flow.value, [0, 0.15, 0.85, 1], [0, 1, 1, 0]),
    transform: [
      {
        translateX: interpolate(
          flow.value,
          [0, 1],
          [side * LINK_END, side * LINK_START]
        ),
      },
    ],
  }));
  return (
    <>
      <View
        style={[
          styles.link,
          {
            width: LINK_END - LINK_START,
            borderColor: colors.border,
            transform: [{ translateX: center }],
          },
        ]}
      />
      <Animated.View
        style={[styles.flowDot, { backgroundColor: color }, dotStyle]}
      />
    </>
  );
}

function Avatar({
  side,
  color,
  index,
  reducedMotion,
}: {
  side: -1 | 1;
  color: string;
  index: number;
  reducedMotion: boolean;
}) {
  const { colors } = useTheme();
  const pop = usePop(reducedMotion, AVATARS_START + index * 120);
  const bob = useLoop(reducedMotion, 2000 + index * 260, AVATARS_START + 600);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pop.value, [0, 0.4], [0, 1], "clamp"),
    transform: [
      {
        translateX:
          side * AVATAR_X * interpolate(pop.value, [0, 1], [0.45, 1]),
      },
      { translateY: interpolate(bob.value, [0, 1], [-3, 3]) },
      { scale: interpolate(pop.value, [0, 1], [0.5, 1]) },
    ],
  }));
  return (
    <Animated.View
      style={[
        styles.avatar,
        DesignSystem.shadows.softKey,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      <View style={[styles.avatarInner, { backgroundColor: color + "22" }]}>
        <Ionicons name="person" size={24} color={color} />
      </View>
    </Animated.View>
  );
}

function HomeShareHero() {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  const reducedMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const plate = usePop(reducedMotion, 0);
  const pulse = useLoop(reducedMotion, 2400, 600, false);
  const tones = { primary: colors.primary, secondary: colors.secondary };

  useEffect(() => {
    if (reducedMotion) return;
    const haptic = setTimeout(triggerLight, CHIPS_START);
    return () => clearTimeout(haptic);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per motion mode
  }, [reducedMotion]);

  const plateStyle = useAnimatedStyle(() => ({
    opacity: interpolate(plate.value, [0, 0.5], [0, 1], "clamp"),
    transform: [{ scale: interpolate(plate.value, [0, 1], [0.7, 1]) }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.5 : interpolate(pulse.value, [0, 1], [0.7, 0]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.55]) }],
  }));
  const fit = Math.min(1, (width - 48) / SCENE_WIDTH);

  return (
    <View
      style={[styles.hero, { transform: [{ scale: fit }] }]}
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={[styles.glow, { backgroundColor: colors.glassGlow }]}
      />
      {SPARKLES.map((sparkle, index) => (
        <Sparkle
          key={index}
          {...sparkle}
          color={index % 2 === 0 ? colors.primary : colors.secondary}
          reducedMotion={reducedMotion}
        />
      ))}

      <Link side={-1} color={colors.primary} reducedMotion={reducedMotion} />
      <Link side={1} color={colors.secondary} reducedMotion={reducedMotion} />

      <Avatar side={-1} index={0} color={colors.primary} reducedMotion={reducedMotion} />
      <Avatar side={1} index={1} color={colors.secondary} reducedMotion={reducedMotion} />

      <Animated.View
        style={[styles.pulse, { borderColor: colors.primary }, pulseStyle]}
      />
      <Animated.View
        style={[
          styles.plate,
          DesignSystem.shadows.glassStrong,
          { backgroundColor: colors.surface, borderColor: colors.border },
          plateStyle,
        ]}
      >
        <Ionicons name="home" size={38} color={colors.primary} />
      </Animated.View>

      {CHIPS.map((chip, index) => (
        <FloatingChip
          key={chip.label}
          label={chip.label}
          x={chip.x}
          y={chip.y}
          color={tones[chip.tone]}
          popDelay={CHIPS_START + index * 420}
          bobDelay={CHIPS_START + 600}
          bobDuration={2300 + index * 300}
          reducedMotion={reducedMotion}
        />
      ))}
    </View>
  );
}

/** Animated scene, headline, and benefits. Shared by setup and Settings → HomeShare. */
export function HomeSharePitch({ isPlus }: { isPlus: boolean }) {
  const { colors } = useTheme();
  const enter = useEnter();

  const rows: { icon: IconName; title: string; detail: string; plus?: boolean }[] =
    [
      {
        icon: "people-outline",
        title: "One shared plan",
        detail: "Same tasks and due dates on both phones",
      },
      {
        icon: "checkmark-done-outline",
        title: "See who did what",
        detail: "Every check-off shows who took care of it",
      },
      {
        icon: "folder-open-outline",
        title: "Everything in one place",
        detail: "Equipment, documents, and emergency info",
      },
      {
        icon: "sparkles-outline",
        title: "One membership for the home",
        detail: "HomeKeep + covers everyone you invite",
        plus: !isPlus,
      },
    ];

  return (
    <View style={styles.pitch}>
      <HomeShareHero />

      <Animated.Text
        entering={enter(420)}
        style={[styles.eyebrow, { color: colors.primary }]}
      >
        HomeShare
      </Animated.Text>
      <Animated.Text
        entering={enter(500)}
        style={[styles.headline, { color: colors.text }]}
        accessibilityRole="header"
        maxFontSizeMultiplier={1.3}
      >
        Keep up your home together
      </Animated.Text>
      <Animated.Text
        entering={enter(580)}
        style={[styles.support, { color: colors.textSecondary }]}
        maxFontSizeMultiplier={1.4}
      >
        Invite a partner, roommate, or family member to share the work.
      </Animated.Text>

      <View style={styles.rows}>
        {rows.map((row, index) => (
          <Animated.View
            key={row.title}
            entering={enter(720 + index * 80)}
            style={styles.row}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.glassGlow }]}>
              <Ionicons name={row.icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <View style={styles.rowTitleLine}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  {row.title}
                </Text>
                {row.plus ? (
                  <View
                    style={[
                      styles.plusBadge,
                      { backgroundColor: colors.secondary + "1F" },
                    ]}
                  >
                    <Text style={[styles.plusText, { color: colors.secondary }]}>
                      Plus
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.rowDetail, { color: colors.textSecondary }]}>
                {row.detail}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

/** Short HomeShare ask at the end of first-run setup (full pitch lives in Settings). */
export function SetupHomeShare({
  isPlus,
  readyMessage,
}: {
  isPlus: boolean;
  /** "Added 31 tasks for this home." from the step before. */
  readyMessage?: string | null;
}) {
  const { colors } = useTheme();
  const enter = useEnter();

  return (
    <View style={styles.root}>
      {readyMessage ? (
        <Animated.View
          entering={enter(0)}
          style={[styles.readyPill, { backgroundColor: colors.success + "18" }]}
        >
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={[styles.readyText, { color: colors.text }]}>
            {readyMessage}
          </Text>
        </Animated.View>
      ) : null}

      <Animated.Text
        entering={enter(80)}
        style={[styles.setupHeadline, { color: colors.text }]}
        accessibilityRole="header"
        maxFontSizeMultiplier={1.3}
      >
        Anyone else help with this home?
      </Animated.Text>
      <Animated.Text
        entering={enter(160)}
        style={[styles.setupSupport, { color: colors.textSecondary }]}
        maxFontSizeMultiplier={1.4}
      >
        Invite a partner, roommate, or family member to share the schedule —
        or join with a code if they already set one up.
      </Animated.Text>

      <Animated.View
        entering={enter(240)}
        style={[styles.notePill, { borderColor: colors.border }]}
      >
        <Ionicons name="key-outline" size={14} color={colors.textSecondary} />
        <Text style={[styles.noteText, { color: colors.textSecondary }]}>
          {isPlus
            ? "Joining is free · Or do this later in Settings"
            : "Inviting needs HomeKeep + · Joining is free"}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    paddingBottom: DesignSystem.spacing.lg,
  },
  pitch: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  readyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs + 2,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs + 2,
    borderRadius: DesignSystem.borders.radius.round,
    marginTop: DesignSystem.spacing.xs,
  },
  readyText: {
    ...DesignSystem.typography.smallSemiBold,
  },
  setupHeadline: {
    ...DesignSystem.typography.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
    textAlign: "center",
    marginTop: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.sm,
  },
  setupSupport: {
    ...DesignSystem.typography.callout,
    textAlign: "center",
    maxWidth: 320,
    marginBottom: DesignSystem.spacing.lg,
  },
  hero: {
    width: "100%",
    height: HERO_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.sm,
  },
  glow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.8,
  },
  link: {
    position: "absolute",
    height: 0,
    borderTopWidth: 2,
    borderStyle: "dashed",
  },
  flowDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
  },
  avatar: {
    position: "absolute",
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: AVATAR - 10,
    height: AVATAR - 10,
    borderRadius: (AVATAR - 10) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: PLATE,
    height: PLATE,
    borderRadius: 32,
    borderWidth: 2,
  },
  plate: {
    width: PLATE,
    height: PLATE,
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    ...DesignSystem.typography.captionSemiBold,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: DesignSystem.spacing.xs,
  },
  headline: {
    ...DesignSystem.typography.display,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.7,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.sm,
  },
  support: {
    ...DesignSystem.typography.callout,
    textAlign: "center",
    maxWidth: 320,
    marginBottom: DesignSystem.spacing.lg,
  },
  rows: {
    alignSelf: "stretch",
    gap: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  rowTitleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  rowTitle: {
    ...DesignSystem.typography.bodySemiBold,
  },
  rowDetail: {
    ...DesignSystem.typography.footnote,
  },
  plusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: DesignSystem.borders.radius.round,
  },
  plusText: {
    ...DesignSystem.typography.captionSemiBold,
  },
  notePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs + 2,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  noteText: {
    ...DesignSystem.typography.footnote,
  },
});
