import React, { ReactNode, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { useHaptics, useReducedMotion } from "../../../hooks";
import { DesignSystem } from "../../../theme/designSystem";

type IconName = keyof typeof Ionicons.glyphMap;

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

function ProgressSegment({ filled }: { filled: boolean }) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const fill = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    const target = filled ? 1 : 0;
    fill.value = reducedMotion
      ? target
      : withTiming(target, { duration: 420, easing: EASE_OUT });
  }, [fill, filled, reducedMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));

  return (
    <View style={[styles.progressSegment, { backgroundColor: colors.border }]}>
      <Animated.View
        style={[
          styles.progressFill,
          { backgroundColor: colors.primary },
          fillStyle,
        ]}
      />
    </View>
  );
}

export function SetupProgress({
  total,
  current,
}: {
  total: number;
  /** Zero-based index of the active step. */
  current: number;
}) {
  return (
    <View
      style={styles.progress}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${current + 1} of ${total}`}
      accessibilityValue={{ min: 1, max: total, now: current + 1 }}
    >
      {Array.from({ length: total }, (_, index) => (
        <ProgressSegment key={index} filled={index <= current} />
      ))}
    </View>
  );
}

export function SetupLead({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.lead, { color: colors.textSecondary }]}>
      {children}
    </Text>
  );
}

export function SetupSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </Text>
        {hint ? (
          <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
            {hint}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function OptionGrid({ children }: { children: ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

export function OptionTile({
  icon,
  label,
  selected,
  onPress,
  multiple = true,
}: {
  icon: IconName;
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Checkbox semantics when true, radio when false. */
  multiple?: boolean;
}) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  return (
    <Pressable
      onPress={() => {
        triggerLight();
        onPress();
      }}
      style={({ pressed }) => [
        styles.tile,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary + "14" : colors.surface,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      accessibilityRole={multiple ? "checkbox" : "radio"}
      accessibilityState={multiple ? { checked: selected } : { selected }}
      accessibilityLabel={label}
    >
      <Ionicons
        name={icon}
        size={20}
        color={selected ? colors.primary : colors.textSecondary}
      />
      <Text
        style={[
          styles.tileLabel,
          { color: selected ? colors.primary : colors.text },
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
      {selected ? (
        <Ionicons
          name="checkmark-circle"
          size={16}
          color={colors.primary}
          style={styles.tileCheck}
        />
      ) : null}
    </Pressable>
  );
}

/** Compact follow-up question, e.g. "Fireplace: Wood | Gas". */
export function InlineChoice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  return (
    <View
      style={[
        styles.inline,
        { backgroundColor: colors.fieldFill, borderColor: colors.border },
      ]}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
    >
      <Text style={[styles.inlineLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.inlineOptions}>
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => {
                triggerLight();
                onChange(option.id);
              }}
              style={[
                styles.pill,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${label}: ${option.label}`}
            >
              <Text
                style={[
                  styles.pillLabel,
                  { color: selected ? "#FFFFFF" : colors.text },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progress: {
    flexDirection: "row",
    gap: 4,
    marginBottom: DesignSystem.spacing.md,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  lead: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
    marginBottom: DesignSystem.spacing.lg,
  },
  section: {
    marginBottom: DesignSystem.spacing.lg,
  },
  sectionHeader: {
    marginBottom: DesignSystem.spacing.sm,
  },
  sectionTitle: {
    ...DesignSystem.typography.bodySemiBold,
  },
  sectionHint: {
    ...DesignSystem.typography.footnote,
    marginTop: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: DesignSystem.spacing.sm,
  },
  tile: {
    width: "48.5%",
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: 1,
  },
  tileLabel: {
    ...DesignSystem.typography.smallMedium,
    flex: 1,
  },
  tileCheck: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  inline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.sm,
    paddingLeft: DesignSystem.spacing.md,
    paddingRight: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inlineLabel: {
    ...DesignSystem.typography.smallMedium,
    flex: 1,
  },
  inlineOptions: {
    flexDirection: "row",
    gap: 6,
  },
  pill: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: 1,
  },
  pillLabel: {
    ...DesignSystem.typography.smallSemiBold,
  },
});
