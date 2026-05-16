import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";

interface TasksLoadErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function TasksLoadErrorBanner({
  message,
  onRetry,
}: TasksLoadErrorBannerProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.error + "18",
          borderColor: colors.error + "40",
        },
      ]}
    >
      <Ionicons
        name="cloud-offline-outline"
        size={20}
        color={colors.error}
        style={styles.icon}
      />
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.text }]}>
          Couldn&apos;t refresh tasks
        </Text>
        <Text
          style={[styles.detail, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {message}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onRetry}
        style={[styles.retryButton, { backgroundColor: colors.error }]}
        accessibilityRole="button"
        accessibilityLabel="Retry loading tasks"
      >
        <Text style={styles.retryLabel}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: DesignSystem.borders.hairline,
  },
  icon: {
    marginRight: DesignSystem.spacing.sm,
  },
  textBlock: {
    flex: 1,
    marginRight: DesignSystem.spacing.sm,
  },
  title: {
    ...DesignSystem.typography.bodySemiBold,
    marginBottom: 2,
  },
  detail: {
    ...DesignSystem.typography.caption,
  },
  retryButton: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borders.radius.small,
  },
  retryLabel: {
    ...DesignSystem.typography.caption,
    color: "#fff",
    fontWeight: "600",
  },
});
