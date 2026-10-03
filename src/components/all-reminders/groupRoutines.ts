import {
  CategoryKey,
  HOME_MAINTENANCE_CATEGORIES,
  MaintenanceRoutine,
} from "../../types/maintenance";
import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type ReminderSectionKey = CategoryKey | "__paused__";

export type ReminderSection = {
  key: ReminderSectionKey;
  title: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  accent: string;
  data: MaintenanceRoutine[];
  isPausedSection: boolean;
};

const CATEGORY_ORDER: CategoryKey[] = [
  "HVAC",
  "PLUMBING",
  "ELECTRICAL",
  "APPLIANCES",
  "EXTERIOR",
  "INTERIOR",
  "LANDSCAPING",
  "SAFETY",
  "GENERAL",
];

function sortByTitle(a: MaintenanceRoutine, b: MaintenanceRoutine): number {
  return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
}

/** Active routines grouped by category, then a Paused section. */
export function groupRoutinesIntoSections(
  routines: MaintenanceRoutine[]
): ReminderSection[] {
  const active = routines.filter((r) => r.is_active);
  const paused = routines.filter((r) => !r.is_active);

  const byCategory = new Map<CategoryKey, MaintenanceRoutine[]>();
  for (const routine of active) {
    const key = (
      routine.category in HOME_MAINTENANCE_CATEGORIES
        ? routine.category
        : "GENERAL"
    ) as CategoryKey;
    const list = byCategory.get(key) ?? [];
    list.push(routine);
    byCategory.set(key, list);
  }

  const sections: ReminderSection[] = [];
  for (const key of CATEGORY_ORDER) {
    const data = byCategory.get(key);
    if (!data?.length) continue;
    const meta = HOME_MAINTENANCE_CATEGORIES[key];
    sections.push({
      key,
      title: meta.displayName,
      icon: meta.icon as ReminderSection["icon"],
      accent: meta.color,
      data: [...data].sort(sortByTitle),
      isPausedSection: false,
    });
  }

  if (paused.length > 0) {
    sections.push({
      key: "__paused__",
      title: "Paused",
      icon: "pause-circle-outline",
      accent: "#C49A3C",
      data: [...paused].sort(sortByTitle),
      isPausedSection: true,
    });
  }

  return sections;
}

export function formatRoutineInterval(intervalDays: number): string {
  if (intervalDays <= 0) return "One-time";
  if (intervalDays < 7) {
    return `Every ${intervalDays} day${intervalDays !== 1 ? "s" : ""}`;
  }
  if (intervalDays === 7) return "Weekly";
  if (intervalDays === 14) return "Bi-weekly";
  if (intervalDays === 30) return "Monthly";
  if (intervalDays === 90) return "Quarterly";
  if (intervalDays === 365) return "Yearly";
  const weeks = Math.round(intervalDays / 7);
  const months = Math.round(intervalDays / 30);
  if (intervalDays % 7 === 0 && weeks <= 8) {
    return `Every ${weeks} week${weeks !== 1 ? "s" : ""}`;
  }
  if (intervalDays % 30 === 0 && months <= 12) {
    return `Every ${months} month${months !== 1 ? "s" : ""}`;
  }
  return `Every ${intervalDays} days`;
}

export function defaultCollapsedKeys(
  sections: ReminderSection[]
): Set<ReminderSectionKey> {
  return new Set(sections.map((s) => s.key));
}
