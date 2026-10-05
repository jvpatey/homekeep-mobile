import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { useProfile } from "../../context/ProfileContext";
import { HearthSurfaceCard } from "../../components/ui";
import {
  refreshRoutines,
  useRoutineSnapshot,
} from "../../components/all-reminders/useReminderRoutines";
import {
  QUESTIONNAIRE_PLAN_IDS,
  MaintenancePlanDefinition,
  MaintenancePlanTag,
  getPlanTheme,
  getPlanIconBubbleStyle,
  getPlanTagPillStyle,
  recommendMaintenancePlanId,
  getAppliedPlanIds,
  getVisibleMaintenancePlans,
  answersForPlan,
} from "../../data/maintenancePlans";
import { maintenancePlansStyles } from "./styles";

const TAG_LABELS: Record<MaintenancePlanTag, string> = {
  spring: "Spring",
  fall: "Fall",
  safety: "Safety",
  starter: "Starter",
  general: "General",
  pool: "Pool & spa",
};

/** Visible plans (suggested first) plus which are already applied. */
export function usePlanCatalog() {
  const { stats } = useTasks();
  const { profile } = useProfile();
  const { routines } = useRoutineSnapshot();
  const [justApplied, setJustApplied] = useState<Set<string>>(() => new Set());

  useFocusEffect(
    useCallback(() => {
      void refreshRoutines();
    }, [])
  );

  useEffect(() => {
    setJustApplied((prev) => (prev.size === 0 ? prev : new Set()));
  }, [routines]);

  const appliedPlanIds = useMemo(() => {
    const ids = getAppliedPlanIds(
      routines.filter((routine) => routine.is_active)
    );
    justApplied.forEach((id) => ids.add(id));
    return ids;
  }, [routines, justApplied]);

  const homeSetupComplete = Boolean(profile?.home_setup_set_at);

  const suggestedPlanId = useMemo(
    () =>
      recommendMaintenancePlanId({
        month: new Date().getMonth(),
        latitude: profile?.latitude,
        activeRoutineCount: stats.activeRoutines,
        homeSetupComplete,
        appliedPlanIds,
        homeSystems: profile?.home_systems,
      }),
    [
      profile?.latitude,
      profile?.home_systems,
      stats.activeRoutines,
      homeSetupComplete,
      appliedPlanIds,
    ]
  );

  const catalogPlans = useMemo(() => {
    const visible = getVisibleMaintenancePlans({ homeSetupComplete });
    const suggested = visible.find((plan) => plan.id === suggestedPlanId);
    const rest = visible.filter((plan) => plan.id !== suggestedPlanId);
    return suggested ? [suggested, ...rest] : visible;
  }, [homeSetupComplete, suggestedPlanId]);

  const markApplied = useCallback((planId: string) => {
    setJustApplied((prev) => new Set(prev).add(planId));
  }, []);

  return {
    catalogPlans,
    suggestedPlanId,
    appliedPlanIds,
    homeSetupComplete,
    markApplied,
  };
}

export function PlanLibraryCards({
  catalog,
  onOpenPlan,
  showIntro = true,
}: {
  catalog: ReturnType<typeof usePlanCatalog>;
  onOpenPlan: (plan: MaintenancePlanDefinition) => void;
  showIntro?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const { profile } = useProfile();
  const { catalogPlans, suggestedPlanId, appliedPlanIds, homeSetupComplete } =
    catalog;

  return (
    <>
      {showIntro ? (
        <Text
          style={[
            maintenancePlansStyles.listIntro,
            { color: colors.textSecondary },
          ]}
        >
          {homeSetupComplete
            ? "Add more recurring tasks tailored to your home. Your home profile is already saved—we'll skip the questionnaire when we can."
            : "Choose a bundle and pick what to add. For a full schedule at once, finish Set up your home on the dashboard."}
        </Text>
      ) : null}
      {catalogPlans.map((plan) => {
        const theme = getPlanTheme(plan.id);
        const bubble = theme
          ? getPlanIconBubbleStyle(theme, isDark)
          : { backgroundColor: colors.fieldFill };
        const pill = theme ? getPlanTagPillStyle(theme, isDark) : null;
        const isSuggested = plan.id === suggestedPlanId;
        const isApplied = appliedPlanIds.has(plan.id);
        const usesHomeProfile = Boolean(
          answersForPlan(plan.id, profile?.home_systems)
        );

        return (
          <HearthSurfaceCard
            key={plan.id}
            containerStyle={maintenancePlansStyles.cardContainer}
            style={maintenancePlansStyles.cardSurface}
          >
            <TouchableOpacity
              onPress={() => onOpenPlan(plan)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={plan.title}
              style={maintenancePlansStyles.planRow}
            >
              {theme ? (
                <View style={[maintenancePlansStyles.planIconBubble, bubble]}>
                  <Ionicons name={theme.icon} size={22} color={theme.primary} />
                </View>
              ) : null}
              <View style={maintenancePlansStyles.planRowText}>
                {isSuggested || isApplied || (plan.tag && pill) ? (
                  <View style={maintenancePlansStyles.pillRow}>
                    {isSuggested ? (
                      <View
                        style={[
                          maintenancePlansStyles.suggestedPill,
                          {
                            backgroundColor: colors.primary + "18",
                            borderColor: colors.primary,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            maintenancePlansStyles.suggestedPillText,
                            { color: colors.primary },
                          ]}
                        >
                          Suggested
                        </Text>
                      </View>
                    ) : null}
                    {isApplied ? (
                      <View
                        style={[
                          maintenancePlansStyles.suggestedPill,
                          {
                            backgroundColor: colors.success + "18",
                            borderColor: colors.success,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            maintenancePlansStyles.suggestedPillText,
                            { color: colors.success },
                          ]}
                        >
                          On your schedule
                        </Text>
                      </View>
                    ) : null}
                    {plan.tag && pill ? (
                      <View
                        style={[
                          maintenancePlansStyles.tagPill,
                          {
                            backgroundColor: pill.backgroundColor,
                            borderColor: pill.borderColor,
                            marginBottom: 0,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            maintenancePlansStyles.tagPillText,
                            { color: pill.color },
                          ]}
                        >
                          {TAG_LABELS[plan.tag]}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
                <Text
                  style={[maintenancePlansStyles.planTitle, { color: colors.text }]}
                >
                  {plan.title}
                </Text>
                <Text
                  style={[
                    maintenancePlansStyles.planSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {plan.shortDescription}
                </Text>
                <Text
                  style={[
                    maintenancePlansStyles.planCaption,
                    { color: colors.primary },
                  ]}
                >
                  {usesHomeProfile
                    ? "Using your home profile"
                    : QUESTIONNAIRE_PLAN_IDS.has(plan.id)
                      ? "Questionnaire"
                      : `${plan.items.length} recurring task${
                          plan.items.length === 1 ? "" : "s"
                        }`}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
                style={maintenancePlansStyles.chevron}
              />
            </TouchableOpacity>
          </HearthSurfaceCard>
        );
      })}
    </>
  );
}
