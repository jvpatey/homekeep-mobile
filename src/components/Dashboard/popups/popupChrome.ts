/**
 * Build `#RRGGBBAA` for overlays and soft tints on glass popups.
 */
export function hexWithAlpha(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  const a = Math.min(1, Math.max(0, alpha));
  const aByte = Math.round(a * 255)
    .toString(16)
    .padStart(2, "0");

  if (raw.length === 6) {
    return `#${raw}${aByte}`;
  }
  if (raw.length === 8) {
    return `#${raw.slice(0, 6)}${aByte}`;
  }
  return hex;
}
