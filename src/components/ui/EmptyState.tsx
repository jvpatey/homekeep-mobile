import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";
import { Button } from "./Button";
import { HearthSurfaceCard } from "./HearthSurfaceCard";
import { IconChip } from "./IconChip";

interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  tint?: string;
  title: string;
  body?: string | null;
  primaryAction?: EmptyStateAction | null;
  secondaryAction?: EmptyStateAction | null;
  /** Sits on a surface card instead of the bare canvas. */
  inCard?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Icon, title, body, and up to two actions for a list with nothing in it. */
export function EmptyState({
  icon,
  tint,
  title,
  body,
  primaryAction,
  secondaryAction,
  inCard,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();

  const content = (
    <View style={[styles.wrap, inCard && styles.inCard, !inCard && style]}>
      <IconChip icon={icon} tint={tint ?? colors.primary} size={64} />
      <Text
        style={[styles.title, { color: colors.text }]}
        accessibilityRole="header"
        maxFontSizeMultiplier={1.4}
      >
        {title}
      </Text>
      {body ? (
        <Text
          style={[styles.body, { color: colors.textSecondary }]}
          maxFontSizeMultiplier={1.5}
        >
          {body}
        </Text>
      ) : null}
      {primaryAction || secondaryAction ? (
        <View style={styles.actions}>
          {primaryAction ? (
            <Button label={primaryAction.label} onPress={primaryAction.onPress} />
          ) : null}
          {secondaryAction ? (
            <Button
              label={secondaryAction.label}
              variant="ghost"
              onPress={secondaryAction.onPress}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );

  return inCard ? (
    <HearthSurfaceCard containerStyle={style}>{content}</HearthSurfaceCard>
  ) : (
    content
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  inCard: {
    paddingVertical: DesignSystem.spacing.xl,
    paddingHorizontal: DesignSystem.spacing.lg - 4,
  },
  title: {
    ...DesignSystem.typography.title2,
    fontSize: 20,
    lineHeight: 26,
    textAlign: "center",
    marginTop: DesignSystem.spacing.md,
  },
  body: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
    textAlign: "center",
    marginTop: DesignSystem.spacing.sm,
  },
  actions: {
    alignSelf: "stretch",
    marginTop: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.xs,
  },
});
