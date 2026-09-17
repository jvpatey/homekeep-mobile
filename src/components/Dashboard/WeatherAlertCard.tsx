import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";
import { ClimateAlert } from "../../services/WeatherService";

interface WeatherAlertCardProps {
  alert: ClimateAlert;
  applying: boolean;
  onAddPrepTasks: () => void;
}

function iconForKind(kind: ClimateAlert["kind"]): keyof typeof Ionicons.glyphMap {
  if (kind === "freeze") return "snow-outline";
  if (kind === "heat") return "sunny-outline";
  return "thunderstorm-outline";
}

export function WeatherAlertCard({
  alert,
  applying,
  onAddPrepTasks,
}: WeatherAlertCardProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark
            ? "rgba(35, 37, 38, 0.45)"
            : "rgba(255, 255, 255, 0.55)",
          borderColor: colors.glassStroke,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={alert.label}
    >
      <View style={styles.row}>
        <View
          style={[styles.iconWrap, { backgroundColor: `${colors.primary}18` }]}
        >
          <Ionicons
            name={iconForKind(alert.kind)}
            size={18}
            color={colors.primary}
          />
        </View>
        <Text style={[styles.label, { color: colors.text }]} numberOfLines={3}>
          {alert.label}
        </Text>
      </View>
      <Pressable
        onPress={onAddPrepTasks}
        disabled={applying}
        style={[
          styles.cta,
          {
            backgroundColor: colors.primary,
            opacity: applying ? 0.7 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add prep tasks"
      >
        {applying ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="add-circle-outline" size={16} color="#fff" />
            <Text style={styles.ctaText}>Add prep tasks</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: DesignSystem.spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignSystem.spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...DesignSystem.typography.smallSemiBold,
    flex: 1,
    minWidth: 0,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.medium,
    minHeight: 40,
  },
  ctaText: {
    ...DesignSystem.typography.smallSemiBold,
    color: "#fff",
  },
});
