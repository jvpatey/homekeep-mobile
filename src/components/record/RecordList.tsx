import React, { ReactNode } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";
import { HearthSurfaceCard } from "../ui/HearthSurfaceCard";
import { IconChip } from "../ui/IconChip";
import { SectionHeader } from "../ui/SectionHeader";

const TILE = 30;

/** Grouped list section: a section header over rows on a Hearth surface. */
export function RecordSection({
  title,
  footer,
  children,
  style,
  trailing,
  actionLabel,
  onAction,
}: {
  title?: string;
  footer?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Shown at the header's trailing edge instead of an action link. */
  trailing?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.section, style]}>
      {title ? (
        <View style={styles.sectionHeader}>
          <SectionHeader
            title={title}
            actionLabel={trailing ? undefined : actionLabel}
            onAction={trailing ? undefined : onAction}
            style={styles.sectionHeaderTitle}
          />
          {trailing}
        </View>
      ) : null}
      <HearthSurfaceCard>
        {items.map((child, index) => (
          <View key={index}>
            {index > 0 ? (
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
            ) : null}
            {child}
          </View>
        ))}
      </HearthSurfaceCard>
      {footer ? (
        <Text
          style={[styles.footer, { color: colors.textSecondary }]}
          maxFontSizeMultiplier={1.4}
        >
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

export interface RecordRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  /** Chip colour; defaults to the primary accent. */
  tint?: string;
  /** `solid` draws a filled tile with a white glyph instead of a soft chip. */
  tone?: "solid" | "soft";
  title: string;
  subtitle?: string | null;
  value?: string | null;
  onPress?: () => void;
  locked?: boolean;
  showChevron?: boolean;
  trailing?: ReactNode;
  destructive?: boolean;
  accessibilityLabel?: string;
}

export function RecordRow({
  icon,
  tint,
  tone = "soft",
  title,
  subtitle,
  value,
  onPress,
  locked,
  showChevron = true,
  trailing,
  destructive,
  accessibilityLabel,
}: RecordRowProps) {
  const { colors } = useTheme();
  const tileColor = destructive ? colors.error : tint ?? colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: colors.fieldFill },
      ]}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={
        accessibilityLabel ??
        [title, subtitle, value, locked ? "HomeKeep Plus" : null]
          .filter(Boolean)
          .join(". ")
      }
    >
      {tone === "solid" ? (
        <View style={[styles.tile, { backgroundColor: tileColor }]}>
          <Ionicons name={icon} size={17} color="#FFFFFF" />
        </View>
      ) : (
        <IconChip icon={icon} tint={tileColor} size={TILE} />
      )}
      <View style={styles.rowText}>
        <Text
          style={[
            styles.rowTitle,
            { color: destructive ? colors.error : colors.text },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.rowSubtitle, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text
          style={[styles.rowValue, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      ) : null}
      {trailing}
      {locked ? (
        <Ionicons name="lock-closed" size={14} color={colors.textSecondary} />
      ) : null}
      {showChevron && onPress ? (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textSecondary}
          style={styles.chevron}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: DesignSystem.spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.sm,
  },
  sectionHeaderTitle: {
    flex: 1,
    marginBottom: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: DesignSystem.spacing.md + TILE + DesignSystem.spacing.md,
  },
  footer: {
    ...DesignSystem.typography.footnote,
    paddingHorizontal: DesignSystem.spacing.xs,
    marginTop: DesignSystem.spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm + 2,
    gap: DesignSystem.spacing.md,
  },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    ...DesignSystem.typography.body,
  },
  rowSubtitle: {
    ...DesignSystem.typography.footnote,
    marginTop: 1,
  },
  rowValue: {
    ...DesignSystem.typography.body,
    fontVariant: ["tabular-nums"],
    maxWidth: 140,
  },
  chevron: {
    marginLeft: -4,
  },
});
