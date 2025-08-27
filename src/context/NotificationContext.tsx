import React, { createContext, useContext, useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { useAuth } from "./AuthContext";
import {
  NotificationPreferences,
  NotificationSettings,
  NotificationPermissionStatus,
  ExpoPushToken,
} from "../types/notifications";
import {
  HOME_MAINTENANCE_CATEGORIES,
  MaintenanceCategory,
} from "../types/maintenance";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    } as Notifications.NotificationBehavior),
});

// NotificationContextType is a type for the notification context
interface NotificationContextType {
  expoPushToken: ExpoPushToken | null;
  notification: Notifications.Notification | null;
  permissionStatus: NotificationPermissionStatus;
  notificationSettings: NotificationSettings;
  requestPermissions: () => Promise<NotificationPermissionStatus>;
  updateNotificationPreferences: (
    category: MaintenanceCategory,
    preferences: Partial<NotificationPreferences>
  ) => Promise<void>;
  updateGlobalNotificationSettings: (enabled: boolean) => Promise<void>;
  registerForPushNotifications: () => Promise<ExpoPushToken | null>;
  savePushToken: (token: string) => Promise<void>;
  testNotification: () => Promise<void>;
}

// NotificationContext is a context for the notification context
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// useNotifications is a hook that returns the notification context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}

// NotificationProviderProps is a type for the notification provider props
interface NotificationProviderProps {
  children: React.ReactNode;
}

// NotificationProvider is a provider for the notification context
export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user, supabase } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<ExpoPushToken | null>(
    null
  );
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>({
      granted: false,
      canAskAgain: true,
      status: "undetermined",
    });
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      globalEnabled: true,
      categories: {} as Record<MaintenanceCategory, NotificationPreferences>,
    });

  // Initialize default notification preferences for all categories
  const initializeDefaultPreferences = (): Record<
    MaintenanceCategory,
    NotificationPreferences
  > => {
    const defaultPrefs: Record<MaintenanceCategory, NotificationPreferences> =
      {} as Record<MaintenanceCategory, NotificationPreferences>;

    Object.keys(HOME_MAINTENANCE_CATEGORIES).forEach((category) => {
      defaultPrefs[category as MaintenanceCategory] = {
        user_id: user?.id || "",
        category: category as MaintenanceCategory,
        enabled: true,
        due_soon_reminder: true,
        overdue_reminder: true,
        daily_digest: false,
        weekly_summary: false,
        reminder_hours_before: 24, // 1 day before
      };
    });

    return defaultPrefs;
  };

  // Check current permission status
  const checkPermissionStatus = async () => {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();

    setPermissionStatus({
      granted: status === "granted",
      canAskAgain,
      status,
    });

    return { status, canAskAgain };
  };

  // Request notification permissions
  const requestPermissions =
    async (): Promise<NotificationPermissionStatus> => {
      if (Device.isDevice) {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.log("Failed to get push token for push notification!");
          return {
            granted: false,
            canAskAgain: finalStatus === "denied",
            status: finalStatus,
          };
        }
      } else {
        console.log("Must use physical device for Push Notifications");
      }

      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      const { status, canAskAgain } = await checkPermissionStatus();
      return {
        granted: status === "granted",
        canAskAgain,
        status,
      };
    };

  // Register for push notifications
  const registerForPushNotifications =
    async (): Promise<ExpoPushToken | null> => {
      try {
        const permissionResult = await requestPermissions();

        if (!permissionResult.granted) {
          return null;
        }

        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });

        setExpoPushToken(token);
        return token;
      } catch (error) {
        console.error("Error registering for push notifications:", error);
        return null;
      }
    };

  // Save push token to user profile
  const savePushToken = async (token: string) => {
    if (!user || !supabase) return;

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        push_token: token,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error saving push token:", error);
      }
    } catch (error) {
      console.error("Error saving push token:", error);
    }
  };

  // Test notification function
  const testNotification = async () => {
    if (!expoPushToken) {
      console.log("No push token available");
      return;
    }

    try {
      // Send a test notification via your edge function
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-push-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userId: user?.id,
            title: "Test Notification",
            body: "This is a test notification from HomeKeep!",
            data: { type: "test" },
          }),
        }
      );

      if (response.ok) {
        console.log("Test notification sent successfully");
      } else {
        console.error("Failed to send test notification");
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
    }
  };

  // Update notification preferences for a specific category
  const updateNotificationPreferences = async (
    category: MaintenanceCategory,
    preferences: Partial<NotificationPreferences>
  ) => {
    if (!user || !supabase) return;

    try {
      const updatedPrefs = {
        ...notificationSettings.categories[category],
        ...preferences,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      // Update local state
      setNotificationSettings((prev) => ({
        ...prev,
        categories: {
          ...prev.categories,
          [category]: updatedPrefs,
        },
      }));

      // Save to database
      const { error } = await supabase
        .from("notification_preferences")
        .upsert(updatedPrefs);

      if (error) {
        console.error("Error updating notification preferences:", error);
      }
    } catch (error) {
      console.error("Error updating notification preferences:", error);
    }
  };

  // Update global notification settings
  const updateGlobalNotificationSettings = async (enabled: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      globalEnabled: enabled,
    }));

    // Update all categories to match global setting
    Object.keys(notificationSettings.categories).forEach((category) => {
      updateNotificationPreferences(category as MaintenanceCategory, {
        enabled,
      });
    });
  };

  // Load notification preferences from database
  const loadNotificationPreferences = async () => {
    if (!user || !supabase) return;

    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error loading notification preferences:", error);
        return;
      }

      if (data && data.length > 0) {
        const categoryPrefs: Record<
          MaintenanceCategory,
          NotificationPreferences
        > = {} as Record<MaintenanceCategory, NotificationPreferences>;

        data.forEach((pref: NotificationPreferences) => {
          categoryPrefs[pref.category] = pref;
        });

        setNotificationSettings((prev) => ({
          ...prev,
          categories: {
            ...prev.categories,
            ...categoryPrefs,
          },
        }));
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    }
  };

  // Listen for notifications
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // Handle notification tap - navigate to dashboard
        console.log("Notification tapped:", response);
      });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  // Initialize when user changes
  useEffect(() => {
    if (user) {
      // Initialize default preferences
      setNotificationSettings((prev) => ({
        ...prev,
        categories: initializeDefaultPreferences(),
      }));

      // Load existing preferences
      loadNotificationPreferences();

      // Check permission status
      checkPermissionStatus();

      // Register for push notifications
      registerForPushNotifications().then((token) => {
        if (token) {
          savePushToken(token.data);
        }
      });
    }
  }, [user]);

  const value: NotificationContextType = {
    expoPushToken,
    notification,
    permissionStatus,
    notificationSettings,
    requestPermissions,
    updateNotificationPreferences,
    updateGlobalNotificationSettings,
    registerForPushNotifications,
    savePushToken,
    testNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
