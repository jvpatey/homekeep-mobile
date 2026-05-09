/**
 * Color/contrast helpers used by the dashboard header and the tinted-glass
 * avatar to keep customizable gradient colors readable on both themes.
 *
 * Same math as the original inline implementation in DashboardHeader.tsx so
 * existing visual behavior is preserved.
 */

export const getLuminance = (hex: string): number => {
  const raw = hex.replace("#", "");
  const rgb = parseInt(raw, 16);
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

const darken = (hex: string, amount: number): string => {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

const lighten = (hex: string, amount: number): string => {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

/**
 * Adjusts a two-stop gradient so it stays visible against the theme background.
 * Light mode: darkens overly light gradients. Dark mode: lightens overly dark
 * gradients. Pass-through otherwise.
 */
export const adjustGradientForContrast = (
  gradientColors: [string, string],
  isDark: boolean
): [string, string] => {
  const [color1, color2] = gradientColors;
  const avgLuminance = (getLuminance(color1) + getLuminance(color2)) / 2;

  if (!isDark && avgLuminance > 0.55) {
    const darkenAmount =
      avgLuminance > 0.85
        ? 70
        : avgLuminance > 0.75
        ? 55
        : avgLuminance > 0.65
        ? 40
        : 30;
    return [darken(color1, darkenAmount), darken(color2, darkenAmount)];
  }

  if (isDark && avgLuminance < 0.25) {
    return [lighten(color1, 40), lighten(color2, 40)];
  }

  return gradientColors;
};

/**
 * Returns a single readable color (hex) derived from the gradient's first stop.
 * Used by the tinted-glass avatar for the centered initial so the letter holds
 * contrast on either theme regardless of which preset the user picked.
 */
export const getReadableInitialColor = (
  gradientColors: [string, string],
  isDark: boolean,
  fallback: string
): string => {
  const [adjustedFirst] = adjustGradientForContrast(gradientColors, isDark);
  const lum = getLuminance(adjustedFirst);

  // Last-resort fallback: if even the adjusted color is too pale on light mode
  // or too dark on dark mode, fall back to the theme text color.
  if (!isDark && lum > 0.7) return fallback;
  if (isDark && lum < 0.2) return fallback;
  return adjustedFirst;
};
