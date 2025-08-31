import { useTheme } from "../../../context/ThemeContext";

// useAuthGradient hook for the useAuthGradient on the home screen
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
