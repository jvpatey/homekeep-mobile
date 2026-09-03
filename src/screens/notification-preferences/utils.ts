import {
  NotificationPreferencesNavigationProps,
  ThemeColors,
  NotificationSettings,
  NotificationPreference,
} from "../../types/navigation";

export interface NotificationPreferencesScreenProps {
  navigation: NotificationPreferencesNavigationProps["navigation"];
}

export const getNotificationTypeConfig = (
  type: string,
  colors: ThemeColors
) => {
  const typeConfig = {
    due_soon_reminder: {
      title: "Upcoming reminders",
      description: "The evening before something is due",
      icon: "time-outline",
      color: colors.success,
    },
    overdue_reminder: {
      title: "Overdue and due today",
      description: "A morning nudge when work is waiting",
      icon: "warning-outline",
      color: colors.error,
    },
    weekly_summary: {
      title: "Weekly summary",
      description: "Saturday morning look at the week ahead",
      icon: "stats-chart-outline",
      color: colors.accent,
    },
  };

  return typeConfig[type as keyof typeof typeConfig];
};

export const isNotificationTypeEnabled = (
  type: string,
  notificationSettings: NotificationSettings
) => {
  return Object.values(notificationSettings.categories).some(
    (pref: NotificationPreference) =>
      pref && pref[type as keyof NotificationPreference]
  );
};

export const getNotificationTypes = () => [
  "due_soon_reminder",
  "overdue_reminder",
  "weekly_summary",
];
