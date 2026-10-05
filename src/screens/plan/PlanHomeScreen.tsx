import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";
import { SegmentedControl, SegmentOption } from "../../components/ui";
import {
  AllRemindersList,
  useReminderRoutines,
} from "../../components/all-reminders";
import {
  PlanLibraryCards,
  usePlanCatalog,
} from "../maintenance-plans/PlanLibraryCards";
import { maintenancePlansStyles } from "../maintenance-plans/styles";
import { PlanStackParamList } from "../../navigation/types";
import { useAppNavigation } from "../../navigation/useAppNavigation";

type PlanSegment = "library" | "reminders";

const SEGMENTS: SegmentOption<PlanSegment>[] = [
  { value: "library", label: "Task library", icon: "library-outline" },
  { value: "reminders", label: "Your reminders", icon: "repeat-outline" },
];

export function PlanHomeScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProp<PlanStackParamList, "PlanHome">>();
  const { openPlanFlow } = useAppNavigation();
  const [segment, setSegment] = useState<PlanSegment>(
    route.params?.segment ?? "library"
  );

  useEffect(() => {
    if (route.params?.segment) setSegment(route.params.segment);
  }, [route.params?.segment]);

  const catalog = usePlanCatalog();
  const reminders = useReminderRoutines();

  const openPlan = useCallback(
    (plan: { id: string }) => openPlanFlow(plan.id),
    [openPlanFlow]
  );

  const segmented = (
    <View style={styles.segmentWrap}>
      <SegmentedControl
        options={SEGMENTS}
        value={segment}
        onChange={setSegment}
        accessibilityLabel="Plan view"
      />
    </View>
  );

  if (segment === "reminders") {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <AllRemindersList
          routines={reminders.routines}
          deletingIds={reminders.deletingIds}
          resumingIds={reminders.resumingIds}
          onResume={(id) => void reminders.resume(id)}
          onDelete={(id, title) => void reminders.remove(id, title)}
          refreshing={reminders.refreshing}
          onRefresh={() => void reminders.refresh()}
          loading={!reminders.loaded}
          header={segmented}
          automaticInsets
          contentPaddingBottom={DesignSystem.spacing.xxl}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        maintenancePlansStyles.listScroll,
        styles.libraryContent,
      ]}
    >
      <View style={styles.librarySegment}>{segmented}</View>
      <PlanLibraryCards catalog={catalog} onOpenPlan={openPlan} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  segmentWrap: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.md,
  },
  librarySegment: {
    marginHorizontal: -DesignSystem.spacing.lg,
  },
  libraryContent: {
    paddingBottom: DesignSystem.spacing.xxl,
  },
});
