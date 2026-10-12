import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { TodayAlertCard } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { ClimateAlert } from "../../services/WeatherService";

interface WeatherAlertCardProps {
  alert: ClimateAlert;
  applying: boolean;
  onAddPrepTasks: () => void;
  onDismiss?: () => void;
}

function iconForKind(kind: ClimateAlert["kind"]): keyof typeof Ionicons.glyphMap {
  if (kind === "freeze") return "snow-outline";
  if (kind === "heat") return "sunny-outline";
  return "thunderstorm-outline";
}

function titleForKind(kind: ClimateAlert["kind"]): string {
  if (kind === "freeze") return "Freeze on the way";
  if (kind === "heat") return "Heat wave coming";
  return "Storm on the way";
}

export function WeatherAlertCard({
  alert,
  applying,
  onAddPrepTasks,
  onDismiss,
}: WeatherAlertCardProps) {
  const { colors } = useTheme();
  return (
    <TodayAlertCard
      icon={iconForKind(alert.kind)}
      tint={alert.kind === "freeze" ? colors.secondary : colors.primary}
      title={titleForKind(alert.kind)}
      body={alert.label}
      actionLabel="Add prep tasks"
      actionIcon="add-circle-outline"
      actionBusy={applying}
      onAction={onAddPrepTasks}
      onDismiss={onDismiss}
    />
  );
}
