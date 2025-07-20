import { useTheme } from "../context/ThemeContext";

/**
 * Custom hook for gradient colors used across the app
 * Provides consistent gradient styling based on theme
 */
export function useGradients() {
  const { colors, isDark } = useTheme();

  // Primary gradient for main buttons and important elements
  const primaryGradient = (
    isDark
      ? [colors.primary, colors.secondary]
      : [colors.primary, colors.secondary]
  ) as [string, string];

  // Accent gradient for OAuth buttons and special elements
  const accentGradient = (
    isDark ? [colors.primary, colors.accent] : [colors.primary, colors.accent]
  ) as [string, string];

  // Icon gradient for feature icons and decorative elements
  const iconGradient = (
    isDark
      ? ["rgba(32, 180, 134, 0.15)", "rgba(32, 180, 134, 0.08)"]
      : ["rgba(46, 196, 182, 0.12)", "rgba(46, 196, 182, 0.06)"]
  ) as [string, string];

  // Fade gradient for dividers and decorative elements
  const fadeGradient = [
    colors.background,
    colors.background,
    primaryGradient[0],
    primaryGradient[1],
    primaryGradient[0],
    colors.background,
    colors.background,
  ] as const;

  return {
    primaryGradient,
    accentGradient,
    iconGradient,
    fadeGradient,
    isDark,
    colors,
  };
}
