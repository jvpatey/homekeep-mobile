import React from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createNativeBottomTabNavigator } from "@react-navigation/bottom-tabs/unstable";
import { useTheme } from "../context/ThemeContext";
import { DashboardScreen } from "../screens/DashboardScreen";
import { RecordHomeScreen } from "../screens/record/RecordHomeScreen";
import { CompletionHistoryScreen } from "../screens/completion-history";
import { HomeSummaryPreviewScreen } from "../screens/home-summary-preview";
import { PlanHomeScreen } from "../screens/plan/PlanHomeScreen";
import { SpendLedgerScreen } from "../screens/spend-ledger/SpendLedgerScreen";
import { ProsScreen } from "../screens/pros/ProsScreen";
import { EquipmentListScreen } from "../screens/equipment/EquipmentListScreen";
import { EquipmentDetailScreen } from "../screens/equipment/EquipmentDetailScreen";
import { HomeNotesScreen } from "../screens/home-notes/HomeNotesScreen";
import { ProDetailScreen } from "../screens/pros/ProDetailScreen";
import {
  AppTabsParamList,
  HomeStackParamList,
  PlanStackParamList,
  RecordStackParamList,
} from "./types";
import { useTabStackScreenOptions } from "./stackScreenOptions";
import { useTabIcons } from "./useTabIcons";

const Tabs = createNativeBottomTabNavigator<AppTabsParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const RecordStack = createNativeStackNavigator<RecordStackParamList>();
const PlanStack = createNativeStackNavigator<PlanStackParamList>();

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
        options={{ title: "Record", headerShown: false }}
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
        name="HomeNotes"
        component={HomeNotesScreen}
        options={{ title: "Paint and notes" }}
      />
      <RecordStack.Screen
        name="HomeSummaryPreview"
        component={HomeSummaryPreviewScreen}
        options={{ title: "Home history", headerLargeTitleEnabled: false }}
      />
    </RecordStack.Navigator>
  );
}

function PlanStackNavigator() {
  const screenOptions = useTabStackScreenOptions();
  return (
    <PlanStack.Navigator screenOptions={screenOptions}>
      <PlanStack.Screen
        name="PlanHome"
        component={PlanHomeScreen}
        options={{ title: "Plan", headerShown: false }}
      />
    </PlanStack.Navigator>
  );
}

export function AppTabs() {
  const { colors } = useTheme();
  const icon = useTabIcons();

  return (
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
        options={{ title: "Home", tabBarIcon: icon("home") }}
      />
      <Tabs.Screen
        name="RecordTab"
        component={RecordStackNavigator}
        options={{ title: "Record", tabBarIcon: icon("record") }}
      />
      <Tabs.Screen
        name="PlanTab"
        component={PlanStackNavigator}
        options={{ title: "Plan", tabBarIcon: icon("plan") }}
      />
    </Tabs.Navigator>
  );
}
