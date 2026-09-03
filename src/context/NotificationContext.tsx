import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { AppState, Platform } from "react-native";
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
import {
  buildDefaultNotificationPreferences,
  MAINTENANCE_CATEGORY_COUNT,
} from "../utils/notificationDefaults";

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

export type NotificationOpenTarget = {
  action: "view" | "household";
  instanceId?: string;
};

interface NotificationContextType {
  notification: Notifications.Notification | null;
  permissionStatus: NotificationPermissionStatus;
  notificationSettings: NotificationSettings;
  pendingOpen: NotificationOpenTarget | null;
  clearPendingOpen: () => void;
  requestPermissions: () => Promise<NotificationPermissionStatus>;
  updateNotificationPreferences: (
    category: MaintenanceCategory,
    preferences: Partial<NotificationPreferences>
  ) => Promise<void>;
  updateNotificationTypeForAllCategories: (
    type: keyof NotificationPreferences,
    enabled: boolean
  ) => Promise<void>;
  updateGlobalNotificationSettings: (enabled: boolean) => Promise<void>;
  registerForPushNotifications: () => Promise<ExpoPushToken | null>;
  savePushToken: (token: string) => Promise<void>;
  /** Refresh Expo token if OS permission is already granted. Does not prompt. */
  refreshPushTokenIfGranted: () => Promise<boolean>;
  /** Request permission, obtain Expo push token, and persist it to Supabase. */
  syncPushToken: () => Promise<boolean>;
  pushTokenError: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

function permissionFromExpo(
  status: Notifications.PermissionStatus,
  canAskAgain: boolean
): NotificationPermissionStatus {
  const normalized: NotificationPermissionStatus["status"] =
    status === "granted" || status === "denied" || status === "undetermined"
      ? status
      : "denied";
  return {
    granted: normalized === "granted",
    canAskAgain,
    status: normalized,
  };
}

function parseOpenTarget(
  data: Record<string, unknown> | undefined | null
): NotificationOpenTarget | null {
  if (!data) return null;
  if (data.action === "household") {
    return { action: "household" };
  }
  const instanceId =
    typeof data.instance_id === "string" && data.instance_id
      ? data.instance_id
      : undefined;
  const instanceIds = Array.isArray(data.instance_ids)
    ? data.instance_ids.filter((id): id is string => typeof id === "string")
    : [];
  const single = instanceId ?? (instanceIds.length === 1 ? instanceIds[0] : undefined);
  if (single) return { action: "view", instanceId: single };
  return { action: "view" };
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user, supabase } = useAuth();
  const [, setExpoPushToken] = useState<ExpoPushToken | null>(null);
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
  const [pushTokenError, setPushTokenError] = useState<string | null>(null);
  const [pendingOpen, setPendingOpen] = useState<NotificationOpenTarget | null>(
    null
  );
  const handledResponseIds = useRef<Set<string>>(new Set());

  const initializeDefaultPreferences = useCallback((): Record<
    MaintenanceCategory,
    NotificationPreferences
  > => {
    const rows = buildDefaultNotificationPreferences(user?.id || "");
    return rows.reduce(
      (acc, row) => {
        acc[row.category] = row;
        return acc;
      },
      {} as Record<MaintenanceCategory, NotificationPreferences>
    );
  }, [user?.id]);

  const checkPermissionStatus = useCallback(async () => {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    const next = permissionFromExpo(status, canAskAgain);
    setPermissionStatus(next);
    return next;
  }, []);

  const ensureAndroidChannel = useCallback(async () => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
  }, []);

  const requestPermissions =
    useCallback(async (): Promise<NotificationPermissionStatus> => {
      if (Device.isDevice) {
        const existing = await Notifications.getPermissionsAsync();
        let status = existing.status;
        let canAskAgain = existing.canAskAgain;

        if (status !== "granted") {
          const requested = await Notifications.requestPermissionsAsync();
          status = requested.status;
          canAskAgain = requested.canAskAgain;
        }

        if (status !== "granted") {
          const next = permissionFromExpo(status, canAskAgain);
          setPermissionStatus(next);
          return next;
        }
      } else {
        console.log("Must use physical device for Push Notifications");
      }

      await ensureAndroidChannel();
      return checkPermissionStatus();
    }, [checkPermissionStatus, ensureAndroidChannel]);

  const savePushToken = useCallback(
    async (token: string) => {
      if (!user || !supabase) {
        return;
      }

      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            push_token: token,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (error) {
          console.error("Error saving push token to database:", error);
          setPushTokenError(error.message);
        } else {
          setPushTokenError(null);
        }
      } catch (error) {
        console.error("Error saving push token:", error);
        setPushTokenError(
          error instanceof Error ? error.message : "Failed to save push token"
        );
      }
    },
    [supabase, user]
  );

  const fetchAndSaveToken = useCallback(async (): Promise<ExpoPushToken | null> => {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error(
          "No project ID found in app.json - push notifications will not work"
        );
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      setExpoPushToken(token);
      setPushTokenError(null);
      await savePushToken(token.data);
      return token;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown registration error";
      console.error("Error registering for push notifications:", error);
      setPushTokenError(message);
      return null;
    }
  }, [savePushToken]);

  const registerForPushNotifications =
    useCallback(async (): Promise<ExpoPushToken | null> => {
      const permissionResult = await requestPermissions();
      if (!permissionResult.granted) {
        console.log("Notification permissions not granted");
        return null;
      }
      return fetchAndSaveToken();
    }, [fetchAndSaveToken, requestPermissions]);

  const seedNotificationPreferences = useCallback(async () => {
    if (!user || !supabase) return;

    try {
      const { count, error: countError } = await supabase
        .from("notification_preferences")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (countError) {
        console.error("Error counting notification preferences:", countError);
        return;
      }

      if ((count ?? 0) >= MAINTENANCE_CATEGORY_COUNT) {
        return;
      }

      const rows = buildDefaultNotificationPreferences(user.id);
      const { error } = await supabase
        .from("notification_preferences")
        .upsert(rows, { onConflict: "user_id,category" });

      if (error) {
        console.error("Error seeding notification preferences:", error);
      }
    } catch (error) {
      console.error("Error seeding notification preferences:", error);
    }
  }, [supabase, user]);

  const refreshPushTokenIfGranted = useCallback(async (): Promise<boolean> => {
    const status = await checkPermissionStatus();
    if (!status.granted) return false;
    await ensureAndroidChannel();
    const token = await fetchAndSaveToken();
    if (!token) return false;
    await seedNotificationPreferences();
    return true;
  }, [
    checkPermissionStatus,
    ensureAndroidChannel,
    fetchAndSaveToken,
    seedNotificationPreferences,
  ]);

  const syncPushToken = useCallback(async (): Promise<boolean> => {
    const token = await registerForPushNotifications();
    if (!token) {
      return false;
    }
    await seedNotificationPreferences();
    return true;
  }, [registerForPushNotifications, seedNotificationPreferences]);

  const updateNotificationPreferences = useCallback(
    async (
      category: MaintenanceCategory,
      preferences: Partial<NotificationPreferences>
    ) => {
      if (!user || !supabase) return;

      try {
        let updatedPrefs: NotificationPreferences | null = null;
        setNotificationSettings((prev) => {
          updatedPrefs = {
            ...prev.categories[category],
            ...preferences,
            user_id: user.id,
            category,
            updated_at: new Date().toISOString(),
          };
          const categories = {
            ...prev.categories,
            [category]: updatedPrefs,
          };
          return {
            ...prev,
            categories,
            globalEnabled: Object.values(categories).some(
              (pref) => pref?.enabled
            ),
          };
        });

        if (!updatedPrefs) return;

        const { error } = await supabase
          .from("notification_preferences")
          .upsert(updatedPrefs, { onConflict: "user_id,category" });

        if (error) {
          console.error("Error updating notification preferences:", error);
        }
      } catch (error) {
        console.error("Error updating notification preferences:", error);
      }
    },
    [supabase, user]
  );

  const updateNotificationTypeForAllCategories = useCallback(
    async (type: keyof NotificationPreferences, enabled: boolean) => {
      const categories = Object.keys(
        notificationSettings.categories
      ) as MaintenanceCategory[];
      await Promise.all(
        categories.map((category) =>
          updateNotificationPreferences(category, { [type]: enabled })
        )
      );
    },
    [notificationSettings.categories, updateNotificationPreferences]
  );

  const updateGlobalNotificationSettings = useCallback(
    async (enabled: boolean) => {
      setNotificationSettings((prev) => ({
        ...prev,
        globalEnabled: enabled,
      }));

      const categories = Object.keys(
        HOME_MAINTENANCE_CATEGORIES
      ) as MaintenanceCategory[];
      await Promise.all(
        categories.map((category) =>
          updateNotificationPreferences(category, { enabled })
        )
      );
    },
    [updateNotificationPreferences]
  );

  const loadNotificationPreferences = useCallback(async () => {
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

        const globalEnabled = data.some(
          (pref: NotificationPreferences) => pref.enabled
        );

        setNotificationSettings((prev) => ({
          ...prev,
          globalEnabled,
          categories: {
            ...prev.categories,
            ...categoryPrefs,
          },
        }));
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    }
  }, [supabase, user]);

  const clearPendingOpen = useCallback(() => {
    setPendingOpen(null);
  }, []);

  const consumeResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const id = response.notification.request.identifier;
      if (handledResponseIds.current.has(id)) return;
      handledResponseIds.current.add(id);
      const data = response.notification.request.content.data as
        | Record<string, unknown>
        | undefined;
      const target = parseOpenTarget(data);
      if (target) setPendingOpen(target);
    },
    []
  );

  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(
      (received) => {
        setNotification(received);
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener(consumeResponse);

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) consumeResponse(response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [consumeResponse]);

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      setNotificationSettings((prev) => ({
        ...prev,
        categories: initializeDefaultPreferences(),
      }));

      await seedNotificationPreferences();
      await loadNotificationPreferences();
      await refreshPushTokenIfGranted();
    };

    void init();
  }, [
    initializeDefaultPreferences,
    loadNotificationPreferences,
    refreshPushTokenIfGranted,
    seedNotificationPreferences,
    user,
  ]);

  useEffect(() => {
    if (!user) return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshPushTokenIfGranted();
      }
    });

    return () => subscription.remove();
  }, [refreshPushTokenIfGranted, user]);

  const value: NotificationContextType = {
    notification,
    permissionStatus,
    notificationSettings,
    pendingOpen,
    clearPendingOpen,
    requestPermissions,
    updateNotificationPreferences,
    updateNotificationTypeForAllCategories,
    updateGlobalNotificationSettings,
    registerForPushNotifications,
    savePushToken,
    refreshPushTokenIfGranted,
    syncPushToken,
    pushTokenError,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
}
