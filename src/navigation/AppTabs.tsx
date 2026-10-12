import React from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createNativeBottomTabNavigator } from "@react-navigation/bottom-tabs/unstable";
import { useTheme } from "../context/ThemeContext";
import { DashboardScreen } from "../screens/DashboardScreen";
import { RecordHomeScreen } from "../screens/record/RecordHomeScreen";
import { CompletionHistoryScreen } from "../screens/completion-history";
import { HomeSummaryPreviewScreen } from "../screens/home-summary-preview";
import { TasksHomeScreen } from "../screens/tasks/TasksHomeScreen";
import { TaskActionsProvider } from "../context/TaskActionsContext";
import { SpendLedgerScreen } from "../screens/spend-ledger/SpendLedgerScreen";
import { YearInReviewScreen } from "../screens/year-in-review/YearInReviewScreen";
import { ProsScreen } from "../screens/pros/ProsScreen";
import { EquipmentListScreen } from "../screens/equipment/EquipmentListScreen";
import { EquipmentDetailScreen } from "../screens/equipment/EquipmentDetailScreen";
import {
  HouseNotesScreen,
  PaintColorsScreen,
} from "../screens/home-notes/HomeNotesScreen";
import { ProDetailScreen } from "../screens/pros/ProDetailScreen";
import { EmergencyInfoScreen } from "../screens/emergency/EmergencyInfoScreen";
import { DocumentVaultScreen } from "../screens/documents/DocumentVaultScreen";
import { InspectionImportScreen } from "../screens/documents/InspectionImportScreen";
import {
  AppTabsParamList,
  HomeStackParamList,
  RecordStackParamList,
  TasksStackParamList,
} from "./types";
import { useTabStackScreenOptions } from "./stackScreenOptions";
import { useTabIcons } from "./useTabIcons";

const Tabs = createNativeBottomTabNavigator<AppTabsParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const RecordStack = createNativeStackNavigator<RecordStackParamList>();
const TasksStack = createNativeStackNavigator<TasksStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
    </HomeStack.Navigator>
  );
}

function RecordStackNavigator() {
  const screenOptions = useTabStackScreenOptions();
  return (
    <RecordStack.Navigator screenOptions={screenOptions}>
      <RecordStack.Screen
        name="RecordHome"
        component={RecordHomeScreen}
        options={{ title: "My Home", headerShown: false }}
      />
      <RecordStack.Screen
        name="CompletionHistory"
        component={CompletionHistoryScreen}
        options={{ title: "History" }}
      />
      <RecordStack.Screen
        name="SpendLedger"
        component={SpendLedgerScreen}
        options={{ title: "Spend" }}
      />
      <RecordStack.Screen
        name="YearInReview"
        component={YearInReviewScreen}
        options={{ title: "Year in review", headerLargeTitleEnabled: false }}
      />
      <RecordStack.Screen
        name="Pros"
        component={ProsScreen}
        options={{ title: "Pros" }}
      />
      <RecordStack.Screen name="ProDetail" component={ProDetailScreen} />
      <RecordStack.Screen
        name="EquipmentList"
        component={EquipmentListScreen}
        options={{ title: "Equipment" }}
      />
      <RecordStack.Screen
        name="EquipmentDetail"
        component={EquipmentDetailScreen}
      />
      <RecordStack.Screen
        name="PaintColors"
        component={PaintColorsScreen}
        options={{ title: "Paint colours" }}
      />
      <RecordStack.Screen
        name="HouseNotes"
        component={HouseNotesScreen}
        options={{ title: "House notes" }}
      />
      <RecordStack.Screen
        name="EmergencyInfo"
        component={EmergencyInfoScreen}
        options={{ title: "Emergency info" }}
      />
      <RecordStack.Screen
        name="DocumentVault"
        component={DocumentVaultScreen}
        options={{ title: "Documents" }}
      />
      <RecordStack.Screen
        name="InspectionImport"
        component={InspectionImportScreen}
        options={{ title: "Inspection report", headerLargeTitleEnabled: false }}
      />
      <RecordStack.Screen
        name="HomeSummaryPreview"
        component={HomeSummaryPreviewScreen}
        options={{ title: "Home history", headerLargeTitleEnabled: false }}
      />
    </RecordStack.Navigator>
  );
}

function TasksStackNavigator() {
  const screenOptions = useTabStackScreenOptions();
  return (
    <TasksStack.Navigator screenOptions={screenOptions}>
      <TasksStack.Screen
        name="TasksHome"
        component={TasksHomeScreen}
        options={{ title: "Tasks", headerShown: false }}
      />
    </TasksStack.Navigator>
  );
}

export function AppTabs() {
  const { colors } = useTheme();
  const icon = useTabIcons();

  return (
    <TaskActionsProvider>
      <Tabs.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarActiveIndicatorColor: colors.primary + "22",
          tabBarStyle:
            Platform.OS === "android"
              ? { backgroundColor: colors.surface }
              : undefined,
          popToTopOnBlur: false,
          tabBarMinimizeBehavior: "onScrollDown",
        }}
      >
        <Tabs.Screen
          name="HomeTab"
          component={HomeStackNavigator}
          options={{ title: "Today", tabBarIcon: icon("today") }}
        />
        <Tabs.Screen
          name="TasksTab"
          component={TasksStackNavigator}
          options={{ title: "Tasks", tabBarIcon: icon("tasks") }}
        />
        <Tabs.Screen
          name="RecordTab"
          component={RecordStackNavigator}
          options={{ title: "My Home", tabBarIcon: icon("myHome") }}
        />
      </Tabs.Navigator>
    </TaskActionsProvider>
  );
}
