import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Navigation types to replace 'any' types
export interface NavigationProps {
  navigation: NativeStackNavigationProp<any>;
}

// Specific navigation parameter types
export interface NotificationPreferencesNavigationProps {
  navigation: NativeStackNavigationProp<{
    NotificationPreferences: undefined;
    [key: string]: undefined;
  }>;
}

export interface ProfileMenuNavigationProps {
  navigation: NativeStackNavigationProp<any>;
}

// Date picker event types
export interface DatePickerEvent {
  type: string;
  nativeEvent: {
    timestamp?: number;
  };
}

// Viewable items changed event types
export interface ViewableItemsChangedEvent {
  viewableItems: Array<{
    index: number | null;
    isViewable: boolean;
    item: unknown;
    key: string;
  }>;
  changed: Array<{
    index: number | null;
    isViewable: boolean;
    item: unknown;
    key: string;
  }>;
}

// Colors object type for theme
export interface ThemeColors {
  [key: string]: string;
}

// Notification settings type
export interface NotificationSettings {
  categories: {
    [category: string]: NotificationPreference;
  };
}

// Notification preference type
export interface NotificationPreference {
  due_soon_reminder?: boolean;
  overdue_reminder?: boolean;
  daily_digest?: boolean;
  weekly_summary?: boolean;
}
