import { useTheme } from "../../../context/ThemeContext";

/**
 * Custom hook for input theming used across auth screens
 * Provides consistent input styling based on theme and error states
 */
export function useAuthInputTheme() {
  const { colors } = useTheme();

  const getInputTheme = (hasError: boolean = false) => ({
    colors: {
      primary: colors.primary,
      outline: hasError ? colors.error : colors.border,
      surface: colors.surface,
      background: colors.surface,
      onSurface: colors.text,
      onSurfaceVariant: colors.textSecondary,
    },
  });

  return {
    getInputTheme,
    colors,
  };
}
