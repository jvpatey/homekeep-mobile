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

/** Grouped inset list section, iOS Settings style, on Hearth surfaces. */
export function RecordSection({
  title,
  footer,
  children,
  style,
  trailing,
}: {
  title?: string;
  footer?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  trailing?: ReactNode;
}) {
  const { colors } = useTheme();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.section, style]}>
      {title || trailing ? (
        <View style={styles.sectionHeader}>
          {title ? (
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
              accessibilityRole="header"
            >
              {title}
            </Text>
          ) : (
            <View />
          )}
          {trailing}
        </View>
      ) : null}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
          DesignSystem.shadows.softAmbient,
        ]}
      >
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
      </View>
      {footer ? (
        <Text style={[styles.footer, { color: colors.textSecondary }]}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

export interface RecordRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  /** Tile colour; defaults to the primary accent. */
  tint?: string;
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
      <View style={[styles.tile, { backgroundColor: tileColor }]}>
        <Ionicons name={icon} size={17} color="#FFFFFF" />
      </View>
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
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  sectionTitle: {
    ...DesignSystem.typography.captionSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  card: {
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: DesignSystem.spacing.md + 30 + DesignSystem.spacing.md,
  },
  footer: {
    ...DesignSystem.typography.footnote,
    paddingHorizontal: DesignSystem.spacing.md,
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
    width: 30,
    height: 30,
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
