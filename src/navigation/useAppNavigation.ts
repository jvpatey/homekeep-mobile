import { useMemo } from "react";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import {
  AppStackParamList,
  AppTabsParamList,
  PlanStackParamList,
  RecordStackParamList,
} from "./types";

type RecordRoute = keyof RecordStackParamList;

/**
 * Cross-tab navigation. Stack routes resolve by bubbling to ancestors, so
 * root-stack routes (Settings, MaintenancePlans) work from any tab; routes in
 * a sibling tab need the nested `Tabs > Tab > Screen` path built here.
 */
export function useAppNavigation() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  return useMemo(
    () => ({
      navigation,
      goToTab(tab: keyof AppTabsParamList) {
        navigation.navigate("Tabs", { screen: tab });
      },
      openRecord<K extends RecordRoute>(
        screen: K,
        ...params: undefined extends RecordStackParamList[K]
          ? [RecordStackParamList[K]?]
          : [RecordStackParamList[K]]
      ) {
        navigation.navigate("Tabs", {
          screen: "RecordTab",
          params: {
            screen,
            params: params[0],
            initial: screen === "RecordHome",
          } as never,
        });
      },
      openPlan(params?: PlanStackParamList["PlanHome"]) {
        navigation.navigate("Tabs", {
          screen: "PlanTab",
          params: { screen: "PlanHome", params },
        });
      },
      openPlanFlow(planId?: string) {
        navigation.navigate("MaintenancePlans", planId ? { planId } : undefined);
      },
      openSettings() {
        navigation.navigate("Settings");
      },
    }),
    [navigation]
  );
}
