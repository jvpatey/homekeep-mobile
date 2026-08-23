import { useTheme } from "../context/ThemeContext";

/**
 * Gradient tokens for the Hearth design system.
 * Gradients are atmosphere (light), not brand chrome.
 */
export function useGradients() {
  const { colors, isDark } = useTheme();

  /** Welcome hero — layered warm bloom behind the sculptural mark. */
  const welcomeAtmosphere = (
    isDark
      ? [
          "rgba(212, 107, 53, 0.22)",
          "rgba(74, 122, 106, 0.10)",
          "transparent",
        ]
      : [
          "rgba(196, 92, 38, 0.18)",
          "rgba(47, 93, 80, 0.08)",
          "transparent",
        ]
  ) as [string, string, string];

  /** Secondary sage mist for welcome hero depth. */
  const welcomeAtmosphereSecondary = (
    isDark
      ? ["rgba(74, 122, 106, 0.14)", "transparent"]
      : ["rgba(47, 93, 80, 0.10)", "transparent"]
  ) as [string, string];

  /** Auth screens — quiet top wash, same hues at lower opacity. */
  const authAtmosphere = (
    isDark
      ? [
          "rgba(212, 107, 53, 0.12)",
          "rgba(74, 122, 106, 0.05)",
          "transparent",
        ]
      : [
          "rgba(196, 92, 38, 0.10)",
          "rgba(47, 93, 80, 0.04)",
          "transparent",
        ]
  ) as [string, string, string];

  /** @deprecated Use welcomeAtmosphere or authAtmosphere. Kept for dashboard compat. */
  const haloGradient = authAtmosphere;

  /** @deprecated Solid CTAs no longer use specular overlays. */
  const ctaHighlight = [
    "rgba(255, 255, 255, 0)",
    "rgba(255, 255, 255, 0)",
  ] as [string, string];

  const primaryGradient = (
    isDark
      ? [colors.primary, colors.secondary]
      : [colors.primary, colors.secondary]
  ) as [string, string];

  const accentGradient = (
    isDark ? [colors.primary, colors.secondary] : [colors.primary, colors.secondary]
  ) as [string, string];

  const spectrumGradient = primaryGradient as unknown as [string, string, string];

  const glassOverlay = (
    isDark
      ? ["rgba(30, 27, 24, 0.7)", "rgba(30, 27, 24, 0.5)"]
      : ["rgba(255, 251, 247, 0.7)", "rgba(255, 251, 247, 0.5)"]
  ) as [string, string];

  const glassBorder = (
    isDark
      ? ["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.08)"]
      : ["rgba(26, 22, 18, 0.08)", "rgba(26, 22, 18, 0.04)"]
  ) as [string, string];

  const iconGradient = (
    isDark
      ? ["rgba(212, 107, 53, 0.18)", "rgba(74, 122, 106, 0.12)"]
      : ["rgba(196, 92, 38, 0.12)", "rgba(47, 93, 80, 0.08)"]
  ) as [string, string];

  const glowGradient = (
    isDark
      ? ["rgba(212, 107, 53, 0.20)", "rgba(74, 122, 106, 0.10)", "transparent"]
      : ["rgba(196, 92, 38, 0.16)", "rgba(47, 93, 80, 0.08)", "transparent"]
  ) as [string, string, string];

  const fadeGradient = [
    colors.background,
    colors.background,
    primaryGradient[0],
    primaryGradient[1],
    primaryGradient[0],
    colors.background,
    colors.background,
  ] as const;

  const heroGradient = welcomeAtmosphere as unknown as [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];

  const heroGradientLocations = [0, 0.15, 0.30, 0.50, 0.70, 0.85, 0.95, 1] as const;

  const radialGlow = (
    isDark
      ? {
          innerColor: "rgba(212, 107, 53, 0.18)",
          midColor: "rgba(74, 122, 106, 0.10)",
          outerColor: "rgba(212, 107, 53, 0.04)",
          fadeColor: colors.background,
        }
      : {
          innerColor: "rgba(196, 92, 38, 0.20)",
          midColor: "rgba(47, 93, 80, 0.10)",
          outerColor: "rgba(196, 92, 38, 0.04)",
          fadeColor: colors.background,
        }
  );

  const ambientGradient = authAtmosphere as unknown as [
    string,
    string,
    string,
    string,
  ];

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
    haloGradient,
    ctaHighlight,
    welcomeAtmosphere,
    welcomeAtmosphereSecondary,
    authAtmosphere,
    isDark,
    colors,
  };
}
