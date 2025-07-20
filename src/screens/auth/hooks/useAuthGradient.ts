import { useTheme } from "../../../context/ThemeContext";

/**
 * Custom hook for gradient colors used across auth screens
 * Provides consistent gradient styling based on theme
 */
export function useAuthGradient() {
  const { colors, isDark } = useTheme();

  const gradientColors = (
    isDark
      ? [colors.primary, colors.secondary]
      : [colors.primary, colors.secondary]
  ) as [string, string];

  return {
    gradientColors,
    isDark,
    colors,
  };
}
