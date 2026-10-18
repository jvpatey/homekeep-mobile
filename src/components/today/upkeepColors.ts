import type { UpkeepGrade } from "../../utils/upkeep";

export function upkeepGradeColor(
  grade: UpkeepGrade | null,
  colors: { success: string; warning: string; error: string; textSecondary: string }
): string {
  if (grade === "on_track") return colors.success;
  if (grade === "slipping") return colors.warning;
  if (grade === "needs_attention") return colors.error;
  return colors.textSecondary;
}
