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

  // 2025 Modern Hero Gradient - natural glow that fades smoothly to background
  const heroGradient = (
    isDark
      ? [
          "rgba(46, 196, 182, 0.04)",
          "rgba(46, 196, 182, 0.10)",
          "rgba(46, 196, 182, 0.15)",
          "rgba(58, 134, 255, 0.12)",
          "rgba(46, 196, 182, 0.08)",
          "rgba(46, 196, 182, 0.04)",
          "rgba(46, 196, 182, 0.02)",
          "transparent",
        ]
      : [
          "rgba(46, 196, 182, 0.06)",
          "rgba(46, 196, 182, 0.14)",
          "rgba(46, 196, 182, 0.22)",
          "rgba(58, 134, 255, 0.18)",
          "rgba(46, 196, 182, 0.08)",
          "rgba(46, 196, 182, 0.04)",
          "rgba(46, 196, 182, 0.015)",
          "transparent",
        ]
  ) as [string, string, string, string, string, string, string, string];

  const heroGradientLocations = [0, 0.15, 0.30, 0.50, 0.70, 0.85, 0.95, 1] as const;

  // Radial glow for content highlighting (for use with RadialGradient)
  const radialGlow = (
    isDark
      ? {
          innerColor: "rgba(46, 196, 182, 0.20)",
          midColor: "rgba(58, 134, 255, 0.15)",
          outerColor: "rgba(255, 159, 28, 0.05)",
          fadeColor: colors.background,
        }
      : {
          innerColor: "rgba(46, 196, 182, 0.35)",
          midColor: "rgba(58, 134, 255, 0.30)",
          outerColor: "rgba(255, 159, 28, 0.10)",
          fadeColor: "rgba(255, 255, 255, 0.5)",
        }
  );

  // Ambient light gradient for transition fade - seamlessly blends to background
  const ambientGradient = (
    isDark
      ? [
          "rgba(46, 196, 182, 0.10)",
          "rgba(58, 134, 255, 0.06)",
          "rgba(46, 196, 182, 0.03)",
          colors.background,
        ]
      : [
          "rgba(46, 196, 182, 0.12)",
          "rgba(58, 134, 255, 0.08)",
          "rgba(46, 196, 182, 0.025)",
          "rgba(255, 255, 255, 0.4)",
        ]
  ) as [string, string, string, string];

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
    heroGradientLocations,
    radialGlow,
    ambientGradient,
    isDark,
    colors,
  };
}
