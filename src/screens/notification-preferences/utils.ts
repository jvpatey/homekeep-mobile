import {
  NotificationPreferencesNavigationProps,
  ThemeColors,
  NotificationSettings,
  NotificationPreference,
} from "../../types/navigation";

// NotificationPreferencesScreenProps for the NotificationPreferencesScreenProps on the home screen
export interface NotificationPreferencesScreenProps {
  navigation: NotificationPreferencesNavigationProps["navigation"];
}

// Notification type configuration
export const getNotificationTypeConfig = (
  type: string,
  colors: ThemeColors
) => {
  const typeConfig = {
    due_soon_reminder: {
      title: "Due Soon Reminders",
      description: "Get notified 1 day before tasks are due",
      icon: "time-outline",
      color: colors.success,
    },
    overdue_reminder: {
      title: "Overdue Reminders",
      description: "Get notified when tasks are overdue",
      icon: "warning-outline",
      color: colors.error,
    },
    daily_digest: {
      title: "Daily Digest",
      description: "Receive daily summary of tasks",
      icon: "calendar-outline",
      color: colors.secondary,
    },
    weekly_summary: {
      title: "Weekly Summary",
      description: "Receive weekly summary of tasks",
      icon: "stats-chart-outline",
      color: colors.accent,
    },
  };

  return typeConfig[type as keyof typeof typeConfig];
};

// Check if a notification type is enabled for any category
export const isNotificationTypeEnabled = (
  type: string,
  notificationSettings: NotificationSettings
) => {
  return Object.values(notificationSettings.categories).some(
    (pref: NotificationPreference) =>
      pref && pref[type as keyof NotificationPreference]
  );
};

// Get notification types array
export const getNotificationTypes = () => [
  "due_soon_reminder",
  "overdue_reminder",
  "daily_digest",
  "weekly_summary",
];
