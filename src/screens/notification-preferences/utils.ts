// NotificationPreferencesScreenProps for the NotificationPreferencesScreenProps on the home screen
export interface NotificationPreferencesScreenProps {
  navigation: any;
}

// Notification type configuration
export const getNotificationTypeConfig = (type: string, colors: any) => {
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
  notificationSettings: any
) => {
  return Object.values(notificationSettings.categories).some(
    (pref: any) => pref && pref[type as keyof typeof pref]
  );
};

// Get notification types array
export const getNotificationTypes = () => [
  "due_soon_reminder",
  "overdue_reminder",
  "daily_digest",
  "weekly_summary",
];
