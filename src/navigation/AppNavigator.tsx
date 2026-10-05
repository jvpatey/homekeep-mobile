import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NotificationPreferencesScreen } from "../screens/notification-preferences";
import { SettingsScreen } from "../screens/settings";
import { MaintenancePlansScreen } from "../screens/maintenance-plans";
import { TasksProvider } from "../context/TasksContext";
import { QuickActionsProvider } from "../context/QuickActionsContext";
import { resetRecordData } from "../hooks/useRecordData";
import { resetEquipmentIndex } from "../hooks/useEquipmentIndex";
import { resetHomeContacts } from "../hooks/useHomeContacts";
import { AppStackParamList } from "./types";
import { AppTabs } from "./AppTabs";
import { useTabStackScreenOptions } from "./stackScreenOptions";
import { ActionMenuHost } from "../components/ui";

const Stack = createNativeStackNavigator<AppStackParamList>();

/**
 * Authenticated app: native tabs at the root, with full-screen flows
 * (settings, plan questionnaires) pushed above so they cover the tab bar.
 */
export function AppNavigator() {
  const stackOptions = useTabStackScreenOptions();

  useEffect(
    () => () => {
      resetRecordData();
      resetEquipmentIndex();
      resetHomeContacts();
    },
    []
  );

  return (
    <TasksProvider>
      <QuickActionsProvider>
        <Stack.Navigator
          initialRouteName="Tabs"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Tabs" component={AppTabs} />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              ...stackOptions,
              headerShown: true,
              title: "Settings",
            }}
          />
          <Stack.Screen
            name="NotificationPreferences"
            component={NotificationPreferencesScreen}
          />
          <Stack.Screen
            name="MaintenancePlans"
            component={MaintenancePlansScreen}
          />
        </Stack.Navigator>
        <ActionMenuHost />
      </QuickActionsProvider>
    </TasksProvider>
  );
}
