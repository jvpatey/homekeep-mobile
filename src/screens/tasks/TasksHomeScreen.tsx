import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { useTaskActions } from "../../context/TaskActionsContext";
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
import { TasksSegment, TasksStackParamList } from "../../navigation/types";
import { useAppNavigation } from "../../navigation/useAppNavigation";
import { KeeperHeaderButton } from "../../components/assistant/KeeperHeaderButton";
import {
  DashboardScheduleList,
  DashboardScheduleListRef,
} from "../../components/Dashboard/DashboardScheduleList";
import { buildDashboardSections } from "../../components/Dashboard/dashboardSections";
import {
  WeekendPlanPrompt,
  WeekendPlanStrip,
} from "../../components/Dashboard/WeekendPlanStrip";
import { ZoneFilterChips } from "../../components/tasks/ZoneFilterChips";
import { HomeMapZoneId, taskMatchesZone } from "../../data/homeMapZones";
import { isHomeSystemsComplete } from "../../data/maintenancePlans";
import { ZoneUpkeep, zoneUpkeep } from "../../utils/upkeep";

const SEGMENTS: SegmentOption<TasksSegment>[] = [
  { value: "schedule", label: "Schedule", icon: "calendar-outline" },
  { value: "routines", label: "Routines", icon: "repeat-outline" },
  { value: "library", label: "Library", icon: "library-outline" },
];

type Nav = NativeStackNavigationProp<TasksStackParamList, "TasksHome">;

export function TasksHomeScreen() {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const route = useRoute<RouteProp<TasksStackParamList, "TasksHome">>();
  const navigation = useNavigation<Nav>();
  const { openPlanFlow } = useAppNavigation();
  const actions = useTaskActions();
  const listRef = useRef<DashboardScheduleListRef>(null);

  const [segment, setSegment] = useState<TasksSegment>(
    route.params?.segment ?? "schedule"
  );
  const [zone, setZone] = useState<HomeMapZoneId | null>(
    route.params?.zone ?? null
  );

  useEffect(() => {
    const params = route.params;
    if (!params) return;
    if (params.segment) setSegment(params.segment);
    if (params.zone !== undefined || params.focus) setZone(params.zone ?? null);
    if (params.focus) {
      const target = params.focus === "overdue" ? "overdue" : "__today__";
      const timer = setTimeout(
        () => listRef.current?.scrollToSection(target),
        250
      );
      navigation.setParams({ focus: undefined });
      return () => clearTimeout(timer);
    }
  }, [route.params, navigation]);

  const catalog = usePlanCatalog();
  const reminders = useReminderRoutines();

  const { zones, seasonalTasks, seasonalOverdue, upkeep } = actions;
  const selectedZone = zones.find((z) => z.id === zone) ?? null;

  const filteredUpcoming = useMemo(
    () =>
      selectedZone
        ? seasonalTasks.filter((t) => taskMatchesZone(t, selectedZone))
        : seasonalTasks,
    [seasonalTasks, selectedZone]
  );
  const filteredOverdue = useMemo(
    () =>
      selectedZone
        ? seasonalOverdue.filter((t) => taskMatchesZone(t, selectedZone))
        : seasonalOverdue,
    [seasonalOverdue, selectedZone]
  );
  const sections = useMemo(
    () => buildDashboardSections(filteredUpcoming, filteredOverdue),
    [filteredUpcoming, filteredOverdue]
  );

  const zoneData = useMemo(() => {
    const statuses: Partial<Record<HomeMapZoneId, ZoneUpkeep>> = {};
    const counts: Partial<Record<HomeMapZoneId, number>> = {};
    const all = buildDashboardSections(seasonalTasks, seasonalOverdue).flatMap(
      (s) => s.data
    );
    for (const z of zones) {
      statuses[z.id] = zoneUpkeep(upkeep.routines, z.id);
      counts[z.id] = all.filter((t) => taskMatchesZone(t, z)).length;
    }
    return { statuses, counts, total: all.length };
  }, [zones, upkeep.routines, seasonalTasks, seasonalOverdue]);

  const header = (
    <>
      <TabScreenHeader
        title="Tasks"
        subtitle="Your schedule, routines, and the task library"
        actions={
          <>
            <KeeperHeaderButton />
            <TabHeaderAction
              icon="add"
              accessibilityLabel="Add"
              accessibilityHint="Add a reminder, schedule or log a repair, or browse the library"
              onPress={actions.openAddMenu}
            />
          </>
        }
      />
      <View style={styles.segmentWrap}>
        <SegmentedControl
          options={SEGMENTS}
          value={segment}
          onChange={setSegment}
          accessibilityLabel="Tasks view"
        />
      </View>
    </>
  );

  if (segment === "routines") {
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

  if (segment === "library") {
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
          onOpenPlan={(plan) => openPlanFlow(plan.id)}
          showIntro={!catalog.homeSetupComplete}
        />
      </ScrollView>
    );
  }

  const scheduleHeader = (
    <View style={styles.scheduleHeader}>
      {header}
      {zones.length > 0 ? (
        <ZoneFilterChips
          zones={zones}
          statuses={zoneData.statuses}
          counts={zoneData.counts}
          totalCount={zoneData.total}
          value={zone}
          onChange={setZone}
        />
      ) : null}
      <View style={styles.weekendWrap}>
        {actions.activeWeekendPlan ? (
          <WeekendPlanStrip
            plan={actions.activeWeekendPlan}
            onPress={actions.openWeekendPlanner}
            onEndPlan={actions.endWeekendPlan}
          />
        ) : (
          <WeekendPlanPrompt onPress={actions.openWeekendPlanner} />
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <DashboardScheduleList
        ref={listRef}
        sections={sections}
        ListHeaderComponent={scheduleHeader}
        onRefresh={() => void actions.refresh()}
        refreshing={actions.refreshing}
        onCompleteTask={(instanceId) => actions.completeTask(instanceId)}
        completingInstanceIds={actions.completingInstanceIds}
        onTaskPress={actions.openTaskById}
        onSkipOccurrence={actions.skipOccurrence}
        onPauseTask={actions.pauseTask}
        onAddTask={() => void actions.openCreate()}
        onBrowseMaintenancePlans={() => setSegment("library")}
        homeSetupIncomplete={!isHomeSystemsComplete(profile?.home_systems)}
        contentPaddingBottom={DesignSystem.spacing.xxl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  segmentWrap: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
  },
  scheduleHeader: {
    paddingBottom: DesignSystem.spacing.xs,
  },
  weekendWrap: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.md,
  },
  remindersHeader: {
    marginTop: -DesignSystem.spacing.sm,
  },
  libraryHeader: {
    marginHorizontal: -DesignSystem.spacing.lg,
  },
  libraryContent: {
    paddingBottom: DesignSystem.spacing.xxl,
  },
});
