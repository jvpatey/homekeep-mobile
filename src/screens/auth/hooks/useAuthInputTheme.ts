import { useTheme } from "../../../context/ThemeContext";

// useAuthInputTheme hook for the useAuthInputTheme on the home screen
export function useAuthInputTheme() {
  const { colors } = useTheme();

  const getInputTheme = (hasError: boolean = false) => ({
    colors: {
      primary: colors.secondary, // Use blue for gradient effect
      outline: hasError ? colors.error : colors.glassBorder,
      surface: colors.surface,
      background: "transparent",
      onSurface: colors.text,
      onSurfaceVariant: colors.textSecondary,
    },
  });

  return {
    getInputTheme,
    colors,
  };
}
