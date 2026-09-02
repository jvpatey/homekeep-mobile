import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { MaintenanceTask } from "../../types/maintenance";
import { useTheme } from "../../context/ThemeContext";
import { useScalePress } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";

interface NextRightThingCardProps {
  task: MaintenanceTask;
  why: string;
  onPress: () => void;
}

export function NextRightThingCard({
  task,
  why,
  onPress,
}: NextRightThingCardProps) {
  const { colors, isDark } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = useScalePress();
  const minutes = task.estimated_duration_minutes;
  const duration =
    minutes < 60 ? `~${minutes} min` : `~${Math.round(minutes / 60)} hr`;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.card,
        {
          backgroundColor: isDark
            ? "rgba(35, 37, 38, 0.45)"
            : "rgba(255, 255, 255, 0.55)",
          borderColor: colors.glassStroke,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Next: ${task.title}. ${why}`}
    >
      <Animated.View style={animatedStyle}>
      <Text style={[styles.kicker, { color: colors.primary }]}>Do this next</Text>
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {task.title}
      </Text>
      <Text style={[styles.why, { color: colors.textSecondary }]}>{why}</Text>
      <View style={styles.meta}>
        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          {duration}
        </Text>
      </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.glass,
    borderWidth: StyleSheet.hairlineWidth,
  },
  kicker: {
    ...DesignSystem.typography.caption,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: DesignSystem.spacing.xs,
  },
  title: {
    ...DesignSystem.typography.h3,
    fontWeight: "700",
    marginBottom: DesignSystem.spacing.xs,
  },
  why: {
    ...DesignSystem.typography.footnote,
    marginBottom: DesignSystem.spacing.sm,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
  },
  metaText: {
    ...DesignSystem.typography.footnote,
    fontWeight: "500",
  },
});
