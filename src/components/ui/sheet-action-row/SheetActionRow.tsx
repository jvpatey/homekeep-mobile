import React, { ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { DesignSystem } from "../../../theme/designSystem";

export interface SheetActionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  /** Omit for non-tappable rows (e.g. Switch-only). */
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  trailing?: ReactNode;
  /** Override icon / well accent (defaults to primary or error when destructive). */
  accentColor?: string;
  accessibilityLabel?: string;
  showDivider?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SheetActionRow({
  icon,
  title,
  subtitle,
  onPress,
  destructive = false,
  disabled = false,
  showChevron,
  trailing,
  accentColor,
  accessibilityLabel,
  showDivider = false,
  style,
}: SheetActionRowProps) {
  const { colors } = useTheme();
  const pressable = typeof onPress === "function" && !disabled;
  const chevronVisible =
    showChevron ?? (pressable && !destructive && !trailing);

  const tone = accentColor
    ? accentColor
    : destructive
      ? colors.error
      : colors.primary;
  const iconColor = disabled ? colors.textSecondary : tone;
  const textColor = disabled
    ? colors.textSecondary
    : destructive
      ? colors.error
      : colors.text;
  const iconBg = `${disabled ? colors.border : tone}15`;

  const content = (
    <>
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
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      {chevronVisible ? (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textSecondary}
        />
      ) : null}
    </>
  );

  const rowStyle = [
    styles.row,
    showDivider && {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    style,
  ];

  if (pressable) {
    return (
      <TouchableOpacity
        style={rowStyle}
        onPress={onPress}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={
          accessibilityLabel ?? (subtitle ? `${title}. ${subtitle}` : title)
        }
        accessibilityState={{ disabled }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={rowStyle}
      accessibilityRole={trailing ? "none" : "text"}
      accessibilityLabel={
        accessibilityLabel ?? (subtitle ? `${title}. ${subtitle}` : title)
      }
      accessibilityState={{ disabled }}
    >
      {content}
    </View>
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
  trailing: {
    justifyContent: "center",
    alignItems: "center",
  },
});
