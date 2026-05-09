import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

export type PlanThemeIcon = ComponentProps<typeof Ionicons>["name"];

/** Visual identity for a guided maintenance plan (library + dashboard tint). */
export interface MaintenancePlanTheme {
  icon: PlanThemeIcon;
  /** Solid accent for icons, borders, and CTAs on plan flows. */
  primary: string;
}

/**
 * Hex RGB + alpha as #RRGGBBAA (same logic as dashboard popupChrome).
 */
function hexWithAlpha(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  const a = Math.min(1, Math.max(0, alpha));
  const aByte = Math.round(a * 255)
    .toString(16)
    .padStart(2, "0");
  if (raw.length === 6) return `#${raw}${aByte}`;
  if (raw.length === 8) return `#${raw.slice(0, 6)}${aByte}`;
  return hex;
}

/** Catalog of themes keyed by `MaintenancePlanDefinition.id`. */
export const PLAN_THEMES: Record<string, MaintenancePlanTheme> = {
  "spring-refresh": {
    icon: "leaf-outline",
    primary: "#16A34A",
  },
  "cold-weather-prep": {
    icon: "snow-outline",
    primary: "#C2410C",
  },
  "year-round-safety": {
    icon: "shield-checkmark-outline",
    primary: "#DC2626",
  },
  "pool-spa-care": {
    icon: "water-outline",
    primary: "#0891B2",
  },
  "new-homeowner-starter": {
    icon: "home-outline",
    primary: "#4F46E5",
  },
};

export function getPlanTheme(
  planId: string | null | undefined
): MaintenancePlanTheme | undefined {
  if (!planId) return undefined;
  return PLAN_THEMES[planId];
}

/** Soft fill + border for task rows/cards (manual tasks omit theme → neutral). */
export function getPlanTaskSurfaceStyle(
  theme: MaintenancePlanTheme | undefined,
  isDark: boolean
): { backgroundColor: string; borderColor: string } | null {
  if (!theme) return null;
  return {
    backgroundColor: hexWithAlpha(
      theme.primary,
      isDark ? 0.11 : 0.065
    ),
    borderColor: hexWithAlpha(
      theme.primary,
      isDark ? 0.28 : 0.2
    ),
  };
}

/** Left accent bar for timeline rows. */
export function getPlanAccentStripColor(
  theme: MaintenancePlanTheme | undefined
): string | undefined {
  return theme?.primary;
}

/** Icon circle background on plan library rows. */
export function getPlanIconBubbleStyle(
  theme: MaintenancePlanTheme,
  isDark: boolean
): { backgroundColor: string } {
  return {
    backgroundColor: hexWithAlpha(theme.primary, isDark ? 0.2 : 0.12),
  };
}

/** Tag pill on plan library rows. */
export function getPlanTagPillStyle(theme: MaintenancePlanTheme, isDark: boolean) {
  return {
    backgroundColor: hexWithAlpha(theme.primary, isDark ? 0.14 : 0.09),
    borderColor: hexWithAlpha(theme.primary, isDark ? 0.32 : 0.22),
    color: theme.primary,
  };
}
