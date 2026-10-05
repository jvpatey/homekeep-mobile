import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { useProfile } from "../../context/ProfileContext";
import { useQuickActions } from "../../context/QuickActionsContext";
import { DesignSystem } from "../../theme/designSystem";
import {
  SegmentedControl,
  SegmentOption,
  TabHeaderAction,
  TabScreenHeader,
} from "../../components/ui";
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
import { PlanHeroCard } from "./PlanHeroCard";

type PlanSegment = "library" | "reminders";

const SEGMENTS: SegmentOption<PlanSegment>[] = [
  { value: "library", label: "Task library", icon: "library-outline" },
  { value: "reminders", label: "Your reminders", icon: "repeat-outline" },
];

export function PlanHomeScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProp<PlanStackParamList, "PlanHome">>();
  const { openPlanFlow, goToTab } = useAppNavigation();
  const { openCreateTask } = useQuickActions();
  const { stats, loading: tasksLoading } = useTasks();
  const { profile } = useProfile();
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

  const activeReminders = reminders.loaded
    ? reminders.routines.filter((routine) => routine.is_active).length
    : tasksLoading
      ? null
      : stats.activeRoutines;

  const header = (
    <>
      <TabScreenHeader
        title="Plan"
        subtitle="Recurring care that keeps your home on schedule"
        actions={
          <TabHeaderAction
            icon="add"
            accessibilityLabel="New reminder"
            accessibilityHint="Create a custom recurring reminder"
            onPress={() => void openCreateTask()}
          />
        }
      />
      <View style={styles.heroWrap}>
        <PlanHeroCard
          latitude={profile?.latitude}
          activeReminders={activeReminders}
          dueThisWeek={tasksLoading ? null : stats.thisWeek}
          bundlesAdded={catalog.appliedPlanIds.size}
          onPressReminders={() => setSegment("reminders")}
          onPressDue={() => goToTab("HomeTab")}
          onPressBundles={() => setSegment("library")}
        />
      </View>
      <View style={styles.segmentWrap}>
        <SegmentedControl
          options={SEGMENTS}
          value={segment}
          onChange={setSegment}
          accessibilityLabel="Plan view"
        />
      </View>
    </>
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
          header={<View style={styles.remindersHeader}>{header}</View>}
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
      <View style={styles.libraryHeader}>{header}</View>
      <PlanLibraryCards
        catalog={catalog}
        onOpenPlan={openPlan}
        showIntro={!catalog.homeSetupComplete}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  heroWrap: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.xs,
  },
  segmentWrap: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
  },
  remindersHeader: {
    // Cancels the reminders list's top padding so both segments line up with Home.
    marginTop: -DesignSystem.spacing.sm,
  },
  libraryHeader: {
    marginHorizontal: -DesignSystem.spacing.lg,
  },
  libraryContent: {
    paddingBottom: DesignSystem.spacing.xxl,
  },
});
