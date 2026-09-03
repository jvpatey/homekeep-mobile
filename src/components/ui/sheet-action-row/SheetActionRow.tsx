import React, { ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { DesignSystem } from "../../../theme/designSystem";

export interface SheetActionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  trailing?: ReactNode;
  accessibilityLabel?: string;
  showDivider?: boolean;
}

export function SheetActionRow({
  icon,
  title,
  subtitle,
  onPress,
  destructive = false,
  disabled = false,
  showChevron = true,
  trailing,
  accessibilityLabel,
  showDivider = false,
}: SheetActionRowProps) {
  const { colors } = useTheme();
  const iconColor = disabled
    ? colors.textSecondary
    : destructive
      ? colors.error
      : colors.primary;
  const textColor = disabled
    ? colors.textSecondary
    : destructive
      ? colors.error
      : colors.text;
  const iconBg = `${disabled ? colors.border : destructive ? colors.error : colors.primary}15`;

  return (
    <TouchableOpacity
      style={[
        styles.row,
        showDivider && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={0.75}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ?? (subtitle ? `${title}. ${subtitle}` : title)
      }
      accessibilityState={{ disabled }}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {showChevron && !destructive ? (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textSecondary}
        />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...DesignSystem.typography.bodyMedium,
    fontSize: 16,
  },
  subtitle: {
    ...DesignSystem.typography.caption,
    marginTop: 2,
  },
});
