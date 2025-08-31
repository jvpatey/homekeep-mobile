import { useTheme } from "../../../context/ThemeContext";

// useAuthInputTheme hook for the useAuthInputTheme on the home screen
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
