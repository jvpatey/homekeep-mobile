/**
 * Surfaces for in-modal controls — aligned with dashboard schedule rows
 * (ScheduleTaskRow) and auth fields on GlassCard.
 */
export function formControlFill(isDark: boolean): string {
  return isDark ? "rgba(35, 37, 38, 0.4)" : "rgba(255, 255, 255, 0.4)";
}
