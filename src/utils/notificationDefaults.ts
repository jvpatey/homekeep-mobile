import {
  HOME_MAINTENANCE_CATEGORIES,
  MaintenanceCategory,
} from "../types/maintenance";
import { NotificationPreferences } from "../types/notifications";

export const MAINTENANCE_CATEGORY_COUNT = Object.keys(
  HOME_MAINTENANCE_CATEGORIES
).length;

export function buildDefaultNotificationPreferences(
  userId: string
): NotificationPreferences[] {
  return Object.keys(HOME_MAINTENANCE_CATEGORIES).map((category) => ({
    user_id: userId,
    category: category as MaintenanceCategory,
    enabled: true,
    due_soon_reminder: true,
    overdue_reminder: true,
    daily_digest: false,
    weekly_summary: false,
    reminder_hours_before: 24,
    updated_at: new Date().toISOString(),
  }));
}
