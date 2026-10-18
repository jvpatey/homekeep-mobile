import type { ThemeColors } from "../../types/navigation";

/** Shared Switch track/thumb colors for Settings-family sheets. */
export function settingsSwitchColors(colors: ThemeColors, value: boolean) {
  return {
    trackColor: {
      false: colors.border,
      true: `${colors.primary}40`,
    },
    thumbColor: value ? colors.primary : colors.textSecondary,
  };
}
