import { useTheme } from "../context/ThemeContext";

/**
 * Custom hook for gradient colors used across the app
 * Provides consistent gradient styling based on theme with liquid glass effects
 */
export function useGradients() {
  const { colors, isDark } = useTheme();

  // Primary gradient for main buttons and important elements (teal → blue)
  const primaryGradient = (
    isDark
      ? [colors.primary, colors.secondary]
      : [colors.primary, colors.secondary]
  ) as [string, string];

  // Accent gradient for OAuth buttons and special elements (teal → orange)
  const accentGradient = (
    isDark ? [colors.primary, colors.accent] : [colors.primary, colors.accent]
  ) as [string, string];

  // Full spectrum gradient (teal → blue → orange)
  const spectrumGradient = (
    isDark
      ? [colors.primary, colors.secondary, colors.accent]
      : [colors.primary, colors.secondary, colors.accent]
  ) as [string, string, string];

  // Glass overlay gradient for glassmorphism effects
  const glassOverlay = (
    isDark
      ? ["rgba(35, 37, 38, 0.7)", "rgba(35, 37, 38, 0.5)"]
      : ["rgba(255, 255, 255, 0.7)", "rgba(255, 255, 255, 0.5)"]
  ) as [string, string];

  // Glass border gradient (subtle teal → blue)
  const glassBorder = (
    isDark
      ? ["rgba(32, 180, 134, 0.4)", "rgba(58, 134, 255, 0.4)"]
      : ["rgba(46, 196, 182, 0.5)", "rgba(58, 134, 255, 0.5)"]
  ) as [string, string];

  // Icon gradient for feature icons and decorative elements
  const iconGradient = (
    isDark
      ? ["rgba(32, 180, 134, 0.2)", "rgba(58, 134, 255, 0.15)"]
      : ["rgba(46, 196, 182, 0.15)", "rgba(58, 134, 255, 0.1)"]
  ) as [string, string];

  // Glow gradient for soft shadows and highlights
  const glowGradient = (
    isDark
      ? ["rgba(32, 180, 134, 0.3)", "rgba(58, 134, 255, 0.2)", "rgba(255, 159, 28, 0.1)"]
      : ["rgba(46, 196, 182, 0.4)", "rgba(58, 134, 255, 0.3)", "rgba(255, 159, 28, 0.2)"]
  ) as [string, string, string];

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

  // Hero gradient for background effects
  const heroGradient = (
    isDark
      ? ["rgba(24, 26, 27, 1)", "rgba(35, 37, 38, 0.95)", "rgba(24, 26, 27, 0.98)"]
      : ["rgba(247, 249, 250, 1)", "rgba(255, 255, 255, 0.95)", "rgba(247, 249, 250, 0.98)"]
  ) as [string, string, string];

  return {
    primaryGradient,
    accentGradient,
    spectrumGradient,
    glassOverlay,
    glassBorder,
    iconGradient,
    glowGradient,
    fadeGradient,
    heroGradient,
    isDark,
    colors,
  };
}
