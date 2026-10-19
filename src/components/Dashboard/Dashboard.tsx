import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { format } from "date-fns";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { useNotifications } from "../../context/NotificationContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { useTasks } from "../../context/TasksContext";
import { useTaskActions } from "../../context/TaskActionsContext";
import { useAppNavigation } from "../../navigation/useAppNavigation";
import { useDevice } from "../../hooks";
import { DesignSystem } from "../../theme/designSystem";
import { accountFirstName } from "../../utils/displayName";
import { homeSeasonLabel, recommendInSeasonPlanId } from "../../utils/homeSeason";
import { nextRightThingWhy } from "../../utils/nextRightThing";
import { HomeMapZoneId } from "../../data/homeMapZones";
import {
  NotificationPermissionRequest,
  ScrollAtmosphere,
  TabHeaderAction,
  TabScreenHeader,
} from "../ui";
import { useEnter } from "../ui/hero/heroKit";
import { KeeperHeaderButton } from "../assistant/KeeperHeaderButton";
import { ProfileMenu } from "./profile";
import { AppStackParamList } from "../../navigation/types";
import { HomeSetupModal } from "../modals/home-setup";
import { HouseholdSharingModal } from "../modals/household-sharing/HouseholdSharingModal";
import { WeekendPlanPrompt, WeekendPlanStrip } from "./WeekendPlanStrip";
import { StatusHero } from "../today/StatusHero";
import { TodaySetupHero } from "../today/TodaySetupHero";
import { DoThisNext } from "../today/DoThisNext";
import {
  TodayAlertSlot,
  useCampaignProgress,
  useClimateAlert,
} from "../today/TodayAlertSlot";
import { RecordHighlights } from "../today/RecordHighlights";

/** Entrance motion plays on the first Today render of each app session. */
let enteredThisSession = false;

export function TodayDashboard() {
  const { colors } = useTheme();
  const { getTabContentStyle } = useDevice();
  const tabColumn = getTabContentStyle();
  const { user } = useAuth();
  const { addressNeeded, homeSetupNeeded, profile } = useProfile();
  const { pendingOpen, clearPendingOpen } = useNotifications();
  const { isPlus, offerPaywallAfterSetup } = useSubscription();
  const { upcomingTasks, overdueTasks, loading: tasksLoading } = useTasks();
  const actions = useTaskActions();
  const { openTasks, openPlanFlow } = useAppNavigation();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const climate = useClimateAlert();
  const campaign = useCampaignProgress();
  const enter = useEnter();

  const [animateIn] = useState(() => !enteredThisSession);
  useEffect(() => {
    enteredThisSession = true;
  }, []);
  const entering = (index: number) =>
    animateIn ? enter(80 + index * 70) : undefined;

  const [showHomeSetupModal, setShowHomeSetupModal] = useState(false);
  // Setup asks for notifications itself; don't re-prompt in the same session.
  const [setupFinishedThisSession, setSetupFinishedThisSession] =
    useState(false);
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [homeShareIntent, setHomeShareIntent] = useState<
    "invite" | "join" | null
  >(null);

  useEffect(() => {
    if (!addressNeeded && !homeSetupNeeded) return;
    const timer = setTimeout(
      () => setShowHomeSetupModal(true),
      DesignSystem.motion.duration.base + 200
    );
    return () => clearTimeout(timer);
  }, [addressNeeded, homeSetupNeeded]);

  useEffect(() => {
    if (pendingOpen?.action !== "household") return;
    setShowHouseholdModal(true);
    clearPendingOpen();
  }, [pendingOpen, clearPendingOpen]);

  const {
    seasonalTasks,
    seasonalOverdue,
    nextTask,
    upkeep,
    zones,
    dueTodayCount,
  } = actions;

  const userName = accountFirstName({
    authFullName: user?.user_metadata?.full_name as string | undefined,
    profileFullName: profile?.full_name,
    email: user?.email ?? profile?.email ?? null,
  });
  const month = new Date().getMonth();
  const seasonLabel = useMemo(
    () => homeSeasonLabel(month, profile?.latitude),
    [month, profile?.latitude]
  );
  const inSeasonPlanId = recommendInSeasonPlanId(month, profile?.latitude);

  const isNewHome =
    upkeep.state === "empty" &&
    !tasksLoading &&
    upcomingTasks.length === 0 &&
    overdueTasks.length === 0;

  const why = nextTask
    ? nextRightThingWhy(nextTask, {
        inSeasonPlanId,
        weatherWhy:
          climate.current &&
          (nextTask.category === "EXTERIOR" || nextTask.category === "PLUMBING")
            ? climate.current.label
            : null,
      })
    : "";

  const handleStatusChip = useCallback(
    (kind: "overdue" | "today") => {
      const today = new Date().toDateString();
      const matching =
        kind === "overdue"
          ? seasonalOverdue
          : [...seasonalOverdue, ...seasonalTasks].filter(
              (t) =>
                !t.is_completed &&
                new Date(t.due_date).toDateString() === today
            );
      if (matching.length === 1) {
        actions.openTask(matching[0]);
        return;
      }
      openTasks({ segment: "schedule", focus: kind });
    },
    [actions, openTasks, seasonalOverdue, seasonalTasks]
  );

  const handleZonePress = useCallback(
    (zone: HomeMapZoneId) => openTasks({ segment: "schedule", zone }),
    [openTasks]
  );

  return (
    <>
      <ScrollView
        style={[styles.flex, { backgroundColor: colors.background }]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actions.refreshing}
            onRefresh={() => void actions.refresh()}
            tintColor={colors.primary}
          />
        }
      >
        <ScrollAtmosphere />
        <TabScreenHeader
          eyebrow={format(new Date(), "EEEE, MMM d")}
          title="Today"
          actions={
            <>
              <KeeperHeaderButton />
              <TabHeaderAction
                icon="add"
                accessibilityLabel="Add"
                accessibilityHint="Add a reminder, schedule or log a repair, or browse the library"
                onPress={actions.openAddMenu}
              />
              <ProfileMenu navigation={navigation} />
            </>
          }
        />

        <View style={[styles.content, tabColumn]}>
          <Animated.View entering={entering(0)}>
            {isNewHome ? (
              <TodaySetupHero
                userName={userName}
                needsHomeSetup={homeSetupNeeded || addressNeeded}
                onSetUpHome={() => setShowHomeSetupModal(true)}
                onBrowseLibrary={() => openTasks({ segment: "library" })}
              />
            ) : (
              <StatusHero
                userName={userName}
                upkeep={upkeep}
                trendDelta={actions.upkeepTrend}
                zones={zones}
                seasonLabel={seasonLabel}
                overdueCount={seasonalOverdue.length}
                dueTodayCount={dueTodayCount}
                onZonePress={handleZonePress}
                onStatusChipPress={handleStatusChip}
                onAddressPress={() => setShowHomeSetupModal(true)}
              />
            )}
          </Animated.View>

          <Animated.View entering={entering(1)}>
            <TodayAlertSlot
              climate={climate}
              campaign={campaign}
              onOpenCampaign={openPlanFlow}
              onOpenHomeShareInvite={() => {
                setHomeShareIntent("invite");
                setShowHouseholdModal(true);
              }}
            />
          </Animated.View>

          {!isNewHome ? (
            <Animated.View entering={entering(2)}>
              <DoThisNext
                nextTask={nextTask}
                why={why}
                overdue={seasonalOverdue}
                upcoming={seasonalTasks}
                completingInstanceIds={actions.completingInstanceIds}
                onOpenTask={actions.openTask}
                onMarkDone={actions.markDone}
                onSeeAll={() => openTasks({ segment: "schedule" })}
              />
            </Animated.View>
          ) : null}

          {!isNewHome ? (
            <Animated.View entering={entering(3)}>
              {actions.activeWeekendPlan ? (
                <WeekendPlanStrip
                  plan={actions.activeWeekendPlan}
                  onPress={actions.openWeekendPlanner}
                  onEndPlan={actions.endWeekendPlan}
                />
              ) : (
                <WeekendPlanPrompt onPress={actions.openWeekendPlanner} />
              )}
            </Animated.View>
          ) : null}

          <Animated.View entering={entering(4)}>
            <RecordHighlights />
          </Animated.View>
        </View>
      </ScrollView>

      <HomeSetupModal
        visible={showHomeSetupModal}
        onClose={() => {
          setShowHomeSetupModal(false);
          setSetupFinishedThisSession(true);
        }}
        onFirstRunFinished={(action) => {
          if (action === "invite" || action === "join") {
            setHomeShareIntent(action);
            setShowHouseholdModal(true);
            return;
          }
          // Soft paywall only when they skip HomeShare — not stacked after Invite.
          if (profile?.home_setup_set_at && !isPlus) {
            setTimeout(() => offerPaywallAfterSetup(), 320);
          }
        }}
      />

      <HouseholdSharingModal
        visible={showHouseholdModal}
        initialIntent={homeShareIntent}
        onClose={() => {
          setShowHouseholdModal(false);
          setHomeShareIntent(null);
        }}
      />

      <NotificationPermissionRequest
        suppressed={
          addressNeeded ||
          homeSetupNeeded ||
          showHomeSetupModal ||
          showHouseholdModal ||
          setupFinishedThisSession
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.xs,
    paddingBottom: DesignSystem.spacing.xxl,
    gap: DesignSystem.spacing.lg,
  },
});
