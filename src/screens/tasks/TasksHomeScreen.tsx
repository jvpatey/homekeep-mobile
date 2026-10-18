import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import {
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProfile } from "../../context/ProfileContext";
import { useTaskActions } from "../../context/TaskActionsContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { DesignSystem } from "../../theme/designSystem";
import {
  HearthCanvas,
  SegmentedControl,
  SegmentOption,
  TabFocusReveal,
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
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
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

  const chrome = (
    <View
      style={[
        styles.chrome,
        {
          paddingTop:
            (Platform.OS === "ios" ? insets.top : 0) + DesignSystem.spacing.sm,
        },
      ]}
    >
      <TabScreenHeader
        title="Tasks"
        subtitle="Your schedule, routines, and the task library"
        style={styles.pinnedHeader}
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
    </View>
  );

  const scheduleHeader = (
    <View style={styles.scheduleHeader}>
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

  const body =
    segment === "routines" ? (
      <AllRemindersList
        routines={reminders.routines}
        deletingIds={reminders.deletingIds}
        resumingIds={reminders.resumingIds}
        onResume={(id) => void reminders.resume(id)}
        onDelete={(id, title) => void reminders.remove(id, title)}
        refreshing={reminders.refreshing}
        onRefresh={() => void reminders.refresh()}
        loading={!reminders.loaded}
        automaticInsets={false}
        contentPaddingBottom={DesignSystem.spacing.xxl}
      />
    ) : segment === "library" ? (
      <ScrollView
        style={styles.flex}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          maintenancePlansStyles.listScroll,
          styles.libraryContent,
        ]}
      >
        <PlanLibraryCards
          catalog={catalog}
          onOpenPlan={(plan) => openPlanFlow(plan.id)}
          showIntro={!catalog.homeSetupComplete}
        />
      </ScrollView>
    ) : (
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
        onClearOverdue={(tasks) => void actions.clearOverdue(tasks)}
        clearingOverdue={actions.clearingOverdue}
        onAddTask={() => void actions.openCreate()}
        onBrowseMaintenancePlans={() => setSegment("library")}
        homeSetupIncomplete={!isHomeSystemsComplete(profile?.home_systems)}
        contentPaddingBottom={DesignSystem.spacing.xxl}
        automaticInsets={false}
      />
    );

  return (
    <HearthCanvas>
      <TabFocusReveal>
        {chrome}
        <Animated.View
          key={segment}
          style={styles.flex}
          entering={
            reduceMotion
              ? undefined
              : FadeIn.duration(DesignSystem.motion.duration.fast)
          }
          exiting={
            reduceMotion
              ? undefined
              : FadeOut.duration(DesignSystem.motion.duration.instant)
          }
        >
          {body}
        </Animated.View>
      </TabFocusReveal>
    </HearthCanvas>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  chrome: {
    zIndex: 1,
  },
  pinnedHeader: {
    // Safe-area padding lives on the chrome; don't double it.
    paddingTop: 0,
  },
  segmentWrap: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
  },
  scheduleHeader: {
    paddingBottom: DesignSystem.spacing.xs,
    paddingTop: DesignSystem.spacing.sm,
  },
  weekendWrap: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.md,
  },
  libraryContent: {
    paddingBottom: DesignSystem.spacing.xxl,
    paddingTop: DesignSystem.spacing.sm,
  },
});
