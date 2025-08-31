import { MaintenanceCategory } from "./maintenance";

// NotificationPreferences is a type for the notification preferences of a user
export interface NotificationPreferences {
  id?: string;
  user_id: string;
  category: MaintenanceCategory;
  enabled: boolean;
  due_soon_reminder: boolean;
  overdue_reminder: boolean;
  daily_digest: boolean;
  weekly_summary: boolean;
  reminder_hours_before: number;
  created_at?: string;
  updated_at?: string;
}

// PushNotification is a type for the push notifications of a user
export interface PushNotification {
  id?: string;
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sent_at?: string;
  read_at?: string;
  action_taken?: string;
  created_at?: string;
}

// NotificationSettings is a type for the notification settings of a user
export interface NotificationSettings {
  globalEnabled: boolean;
  categories: Record<MaintenanceCategory, NotificationPreferences>;
}

// NotificationPermissionStatus is a type for the notification permission status of a user
export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: "granted" | "denied" | "undetermined" | "blocked";
}

// ExpoPushToken is a type for the expo push token of a user
export interface ExpoPushToken {
  type: "expo";
  data: string;
}
