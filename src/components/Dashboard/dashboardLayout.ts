import { DesignSystem } from "../../theme/designSystem";

/** Vertical gap between stats card, home/weather tiles, and quick-action buttons. */
export function getDashboardSummaryStackGap(
  getResponsiveValue: (
    phone: number,
    tablet: number,
    largeTablet?: number
  ) => number
): number {
  return getResponsiveValue(
    DesignSystem.spacing.md,
    DesignSystem.spacing.md,
    DesignSystem.spacing.lg
  );
}
