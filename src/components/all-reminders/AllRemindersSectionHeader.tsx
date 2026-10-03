import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";
import { ReminderSection } from "./groupRoutines";

interface AllRemindersSectionHeaderProps {
  section: ReminderSection;
  collapsed: boolean;
  onToggle: () => void;
}

export function AllRemindersSectionHeader({
  section,
  collapsed,
  onToggle,
}: AllRemindersSectionHeaderProps) {
  const { colors } = useTheme();
  const count = section.data.length;

  return (
    <Pressable
      onPress={onToggle}
      style={[
        styles.header,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ expanded: !collapsed }}
      accessibilityLabel={`${section.title}, ${count} reminder${
        count === 1 ? "" : "s"
      }. ${collapsed ? "Collapsed" : "Expanded"}`}
    >
      <View
        style={[styles.iconWrap, { backgroundColor: `${section.accent}22` }]}
      >
        <Ionicons name={section.icon} size={18} color={section.accent} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>
          {section.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {count} reminder{count === 1 ? "" : "s"}
        </Text>
      </View>
      <Ionicons
        name={collapsed ? "chevron-forward" : "chevron-down"}
        size={18}
        color={colors.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...DesignSystem.typography.h4,
    fontSize: 18,
  },
  subtitle: {
    ...DesignSystem.typography.footnote,
    marginTop: 1,
  },
});
