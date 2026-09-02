import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  BackHandler,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../navigation/types";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { useProfile } from "../../context/ProfileContext";
import { useHaptics, useScreenInsets } from "../../hooks";
import { Button, HearthScreen, HearthSurfaceCard } from "../../components/ui";
import { DesignSystem } from "../../theme/designSystem";
import { MaintenanceService } from "../../services/maintenanceService";
import {
  QUESTIONNAIRE_PLAN_IDS,
  MaintenancePlanDefinition,
  MaintenancePlanItemTemplate,
  MaintenancePlanTag,
  filterSpringRefreshItems,
  filterColdWeatherPrepItems,
  filterNewHomeownerStarterItems,
  filterPoolSpaItems,
  getPlanTheme,
  getPlanIconBubbleStyle,
  getPlanTagPillStyle,
  routineIdentityKey,
  recommendMaintenancePlanId,
  getAppliedPlanIds,
  getVisibleMaintenancePlans,
  getMaintenancePlanById,
  answersForPlan,
  partialSpringAnswers,
  partialStarterAnswers,
  partialPoolSpaAnswers,
  mergeFromSpringAnswers,
  mergeFromStarterAnswers,
  mergeFromPoolSpaAnswers,
} from "../../data/maintenancePlans";
import type {
  HomeSystems,
  SpringRefreshAnswers,
  ColdWeatherPrepAnswers,
  NewHomeownerStarterAnswers,
  PoolSpaAnswers,
} from "../../data/maintenancePlans";
import { HOME_MAINTENANCE_CATEGORIES } from "../../types/maintenance";
import { maintenancePlansStyles } from "./styles";
import { SpringRefreshQuestionnaire } from "./SpringRefreshQuestionnaire";
import { ColdWeatherPrepQuestionnaire } from "./ColdWeatherPrepQuestionnaire";
import { NewHomeownerStarterQuestionnaire } from "./NewHomeownerStarterQuestionnaire";
import { PoolSpaQuestionnaire } from "./PoolSpaQuestionnaire";

const TAG_LABELS: Record<MaintenancePlanTag, string> = {
  spring: "Spring",
  fall: "Fall",
  safety: "Safety",
  starter: "Starter",
  general: "General",
  pool: "Pool & spa",
};

type FlowPhase = "list" | "questionnaire" | "pickTasks";

function formatIntervalDays(days: number): string {
  if (days === 7) return "Every week";
  if (days === 30) return "Every month";
  if (days === 60) return "Every 2 months";
  if (days === 90) return "Every 3 months";
  if (days === 180) return "Every 6 months";
  if (days === 365) return "Every year";
  if (days === 730) return "Every 2 years";
  if (days === 1095) return "Every 3 years";
  if (days === 1825) return "Every 5 years";
  return `Every ${days} days`;
}

function itemIdentityKey(item: MaintenancePlanItemTemplate): string {
  return routineIdentityKey(item.title, item.category, item.interval_days);
}

function categoryLabel(category: MaintenancePlanItemTemplate["category"]) {
  return (
    HOME_MAINTENANCE_CATEGORIES[
      category as keyof typeof HOME_MAINTENANCE_CATEGORIES
    ]?.displayName ?? category
  );
}

export function MaintenancePlansScreen() {
  const { colors, isDark } = useTheme();
  const { scrollPaddingBottom, footerPaddingBottom } = useScreenInsets();
  const { triggerMedium, triggerLight } = useHaptics();
  const { applyMaintenancePlan, stats } = useTasks();
  const { profile, updateHomeSystems } = useProfile();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, "MaintenancePlans">>();
  const [phase, setPhase] = useState<FlowPhase>("list");
  const [appliedPlanIds, setAppliedPlanIds] = useState<Set<string>>(
    () => new Set()
  );
  const [detailPlan, setDetailPlan] =
    useState<MaintenancePlanDefinition | null>(null);
  const [springAnswers, setSpringAnswers] =
    useState<SpringRefreshAnswers | null>(null);
  const [coldWeatherAnswers, setColdWeatherAnswers] =
    useState<ColdWeatherPrepAnswers | null>(null);
  const [starterAnswers, setStarterAnswers] =
    useState<NewHomeownerStarterAnswers | null>(null);
  const [poolSpaAnswers, setPoolSpaAnswers] =
    useState<PoolSpaAnswers | null>(null);
  const [selectedMask, setSelectedMask] = useState<boolean[]>([]);
  const [existingRoutineKeys, setExistingRoutineKeys] = useState<Set<string>>(
    new Set()
  );
  const [usedHomeProfile, setUsedHomeProfile] = useState(false);
  const [applying, setApplying] = useState(false);

  const resolvedDetailItems = useMemo((): MaintenancePlanItemTemplate[] => {
    if (!detailPlan) return [];
    if (detailPlan.id === "spring-refresh") {
      if (!springAnswers) return [];
      return filterSpringRefreshItems(springAnswers);
    }
    if (detailPlan.id === "cold-weather-prep") {
      if (!coldWeatherAnswers) return [];
      return filterColdWeatherPrepItems(coldWeatherAnswers);
    }
    if (detailPlan.id === "new-homeowner-starter") {
      if (!starterAnswers) return [];
      return filterNewHomeownerStarterItems(starterAnswers);
    }
    if (detailPlan.id === "pool-spa-care") {
      if (!poolSpaAnswers) return [];
      return filterPoolSpaItems(poolSpaAnswers);
    }
    return detailPlan.items;
  }, [
    detailPlan,
    springAnswers,
    coldWeatherAnswers,
    starterAnswers,
    poolSpaAnswers,
  ]);

  const resolvedDetailItemsFingerprint = useMemo(
    () =>
      resolvedDetailItems
        .map((item) => `${item.category}|${item.interval_days}|${item.title}`)
        .join("\x1e"),
    [resolvedDetailItems]
  );

  useEffect(() => {
    if (phase !== "pickTasks") return;
    let cancelled = false;

    const load = async () => {
      const { data } = await MaintenanceService.getMaintenanceRoutines({
        is_active: true,
      });
      if (cancelled) return;
      const keys = new Set(
        (data ?? []).map((routine) =>
          routineIdentityKey(
            routine.title,
            routine.category,
            routine.interval_days
          )
        )
      );
      setExistingRoutineKeys(keys);
      setSelectedMask(
        resolvedDetailItems.map((item) => !keys.has(itemIdentityKey(item)))
      );
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    phase,
    detailPlan?.id,
    resolvedDetailItemsFingerprint,
    resolvedDetailItems,
  ]);

  useEffect(() => {
    let cancelled = false;
    const loadApplied = async () => {
      const { data } = await MaintenanceService.getMaintenanceRoutines({
        is_active: true,
      });
      if (cancelled) return;
      setAppliedPlanIds(getAppliedPlanIds(data ?? []));
    };
    void loadApplied();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedItems = useMemo(() => {
    return resolvedDetailItems.filter((_, i) => selectedMask[i]);
  }, [resolvedDetailItems, selectedMask]);

  const newSelectedItems = useMemo(
    () =>
      selectedItems.filter(
        (item) => !existingRoutineKeys.has(itemIdentityKey(item))
      ),
    [selectedItems, existingRoutineKeys]
  );
  const newSelectedCount = newSelectedItems.length;

  const groupedPickerItems = useMemo(() => {
    const groups: {
      key: string;
      label: string;
      entries: { item: MaintenancePlanItemTemplate; index: number }[];
    }[] = [];
    const indexByKey = new Map<string, number>();

    resolvedDetailItems.forEach((item, index) => {
      const key = item.category;
      const existing = indexByKey.get(key);
      if (existing == null) {
        indexByKey.set(key, groups.length);
        groups.push({
          key,
          label: categoryLabel(item.category),
          entries: [{ item, index }],
        });
        return;
      }
      groups[existing].entries.push({ item, index });
    });

    return groups;
  }, [resolvedDetailItems]);

  const showCategoryHeaders = groupedPickerItems.length > 1;

  const resetToList = useCallback(() => {
    setDetailPlan(null);
    setSpringAnswers(null);
    setColdWeatherAnswers(null);
    setStarterAnswers(null);
    setPoolSpaAnswers(null);
    setSelectedMask([]);
    setExistingRoutineKeys(new Set());
    setUsedHomeProfile(false);
    setPhase("list");
  }, []);

  const persistHomeFromAnswers = useCallback(
    (patchHome: HomeSystems) => {
      void updateHomeSystems(patchHome);
    },
    [updateHomeSystems]
  );

  const springPrefill = useMemo(
    () => partialSpringAnswers(profile?.home_systems),
    [profile?.home_systems]
  );
  const starterPrefill = useMemo(
    () => partialStarterAnswers(profile?.home_systems),
    [profile?.home_systems]
  );
  const poolPrefill = useMemo(
    () => partialPoolSpaAnswers(profile?.home_systems),
    [profile?.home_systems]
  );

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

  const openPlan = useCallback(
    (plan: MaintenancePlanDefinition) => {
      setDetailPlan(plan);
      setUsedHomeProfile(false);
      const home = profile?.home_systems;

      if (!QUESTIONNAIRE_PLAN_IDS.has(plan.id)) {
        setPhase("pickTasks");
        return;
      }

      const complete = answersForPlan(plan.id, home);
      if (complete) {
        if (complete.kind === "spring") setSpringAnswers(complete.answers);
        if (complete.kind === "cold") setColdWeatherAnswers(complete.answers);
        if (complete.kind === "starter") setStarterAnswers(complete.answers);
        if (complete.kind === "pool") setPoolSpaAnswers(complete.answers);
        setUsedHomeProfile(true);
        setPhase("pickTasks");
        return;
      }

      setSpringAnswers(null);
      setColdWeatherAnswers(null);
      setStarterAnswers(null);
      setPoolSpaAnswers(null);
      setPhase("questionnaire");
    },
    [profile?.home_systems]
  );

  const openedDeepLink = useRef<string | null>(null);
  useEffect(() => {
    const planId = route.params?.planId;
    if (!planId || openedDeepLink.current === planId) return;
    const plan = getMaintenancePlanById(planId);
    if (!plan) return;
    openedDeepLink.current = planId;
    openPlan(plan);
  }, [route.params?.planId, openPlan]);

  const toggleTaskAt = useCallback(
    (index: number) => {
      void triggerLight();
      setSelectedMask((prev) => {
        const next = [...prev];
        next[index] = !next[index];
        return next;
      });
    },
    [triggerLight]
  );

  const selectAllTasks = useCallback(() => {
    void triggerLight();
    setSelectedMask(
      resolvedDetailItems.map(
        (item) => !existingRoutineKeys.has(itemIdentityKey(item))
      )
    );
  }, [triggerLight, resolvedDetailItems, existingRoutineKeys]);

  const clearAllTasks = useCallback(() => {
    void triggerLight();
    setSelectedMask((prev) => prev.map(() => false));
  }, [triggerLight]);

  const handleApply = useCallback(
    (plan: MaintenancePlanDefinition, items: MaintenancePlanItemTemplate[]) => {
      const n = items.filter(
        (item) => !existingRoutineKeys.has(itemIdentityKey(item))
      ).length;
      if (n === 0) {
        Alert.alert(
          items.length > 0 ? "Already on your schedule" : "No tasks selected",
          items.length > 0
            ? "Those tasks already match recurring tasks on your schedule."
            : "Choose at least one task to add to your schedule.",
          [{ text: "OK" }]
        );
        return;
      }
      Alert.alert(
        "Add recurring tasks?",
        `This will add up to ${n} new recurring task${n === 1 ? "" : "s"}. Tasks that already match one on your schedule are skipped.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add tasks",
            onPress: async () => {
              if (applying) return;
              setApplying(true);
              try {
                const result = await applyMaintenancePlan(plan.id, items);
                if (result.success) {
                  setAppliedPlanIds((prev) => {
                    const next = new Set(prev);
                    next.add(plan.id);
                    return next;
                  });
                  const added = result.addedCount ?? n;
                  const skipped = result.skippedCount ?? 0;
                  let message: string;
                  if (added === 0 && skipped > 0) {
                    message =
                      skipped === 1
                        ? "That task is already on your schedule."
                        : `All ${skipped} selected tasks already match recurring tasks on your schedule.`;
                  } else if (skipped > 0) {
                    message = `${added} recurring task${added === 1 ? "" : "s"} ${added === 1 ? "was" : "were"} added. ${skipped} skipped — already on your schedule.`;
                  } else {
                    message = `${added} recurring task${added === 1 ? "" : "s"} ${added === 1 ? "was" : "were"} added to your schedule.`;
                  }
                  Alert.alert(
                    added === 0 && skipped > 0
                      ? "Nothing new to add"
                      : "Plan applied",
                    message,
                    [
                      {
                        text: "Add another plan",
                        onPress: resetToList,
                      },
                      {
                        text: "Done",
                        style: "cancel",
                        onPress: () => navigation.goBack(),
                      },
                    ]
                  );
                } else {
                  Alert.alert(
                    "Could not apply plan",
                    result.error || "Please try again.",
                    [{ text: "OK" }]
                  );
                }
              } finally {
                setApplying(false);
              }
            },
          },
        ]
      );
    },
    [
      applyMaintenancePlan,
      applying,
      existingRoutineKeys,
      navigation,
      resetToList,
    ]
  );

  const headerBack = useCallback(() => {
    if (phase === "questionnaire") {
      resetToList();
      return;
    }
    if (phase === "pickTasks") {
      if (
        detailPlan &&
        QUESTIONNAIRE_PLAN_IDS.has(detailPlan.id) &&
        !usedHomeProfile
      ) {
        setPhase("questionnaire");
        return;
      }
      resetToList();
      return;
    }
    navigation.goBack();
  }, [phase, detailPlan, navigation, resetToList, usedHomeProfile]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      headerBack();
      return true;
    });
    return () => sub.remove();
  }, [headerBack]);

  const headerTitle = () => {
    if (phase === "questionnaire" && detailPlan) {
      return detailPlan.title;
    }
    if (phase === "pickTasks" && detailPlan) {
      return detailPlan.title;
    }
    return "Task library";
  };

  const renderPlanList = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        maintenancePlansStyles.listScroll,
        { paddingBottom: scrollPaddingBottom },
      ]}
    >
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
      {catalogPlans.map((plan) => {
        const theme = getPlanTheme(plan.id);
        const bubble = theme
          ? getPlanIconBubbleStyle(theme, isDark)
          : { backgroundColor: colors.fieldFill };
        const pill = theme ? getPlanTagPillStyle(theme, isDark) : null;
        const isSuggested = plan.id === suggestedPlanId;
        const isApplied = appliedPlanIds.has(plan.id);
        const usesHomeProfile = Boolean(answersForPlan(plan.id, profile?.home_systems));

        return (
          <HearthSurfaceCard
            key={plan.id}
            containerStyle={maintenancePlansStyles.cardContainer}
            style={maintenancePlansStyles.cardSurface}
          >
            <TouchableOpacity
              onPress={() => openPlan(plan)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={plan.title}
              style={maintenancePlansStyles.planRow}
            >
              {theme ? (
                <View
                  style={[
                    maintenancePlansStyles.planIconBubble,
                    bubble,
                  ]}
                >
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
                  style={[
                    maintenancePlansStyles.planTitle,
                    { color: colors.text },
                  ]}
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
    </ScrollView>
  );

  const renderTaskRow = (
    plan: MaintenancePlanDefinition,
    item: MaintenancePlanItemTemplate,
    index: number,
    isLast: boolean
  ) => {
    const maskOk =
      selectedMask.length === resolvedDetailItems.length &&
      resolvedDetailItems.length > 0;
    const checked = maskOk && selectedMask[index] === true;
    const alreadyScheduled = existingRoutineKeys.has(itemIdentityKey(item));
    const meta = `${categoryLabel(item.category)} · ${formatIntervalDays(
      item.interval_days
    )}`;

    return (
      <TouchableOpacity
        key={`${plan.id}-${item.title}-${index}`}
        activeOpacity={0.85}
        onPress={() => toggleTaskAt(index)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={[
          maintenancePlansStyles.taskRowSelectable,
          !isLast && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={maintenancePlansStyles.taskCheckboxHit}>
          <Ionicons
            name={checked ? "checkbox" : "square-outline"}
            size={26}
            color={checked ? colors.primary : colors.textSecondary}
          />
        </View>
        <View style={maintenancePlansStyles.taskRowMain}>
          <Text
            style={[maintenancePlansStyles.taskTitle, { color: colors.text }]}
          >
            {item.title}
          </Text>
          <Text
            style={[
              maintenancePlansStyles.taskMeta,
              { color: colors.textSecondary },
            ]}
          >
            {meta}
          </Text>
          {alreadyScheduled ? (
            <Text
              style={[
                maintenancePlansStyles.alreadyScheduled,
                { color: colors.primary },
              ]}
            >
              Already on your schedule
            </Text>
          ) : null}
          {item.description ? (
            <Text
              style={[
                maintenancePlansStyles.taskDescription,
                { color: colors.textSecondary },
              ]}
            >
              {item.description}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTaskPicker = (plan: MaintenancePlanDefinition) => {
    const items = resolvedDetailItems;
    const maskOk = selectedMask.length === items.length && items.length > 0;
    const hasQuestionnaire = QUESTIONNAIRE_PLAN_IDS.has(plan.id);

    if (items.length === 0) {
      return (
        <View style={{ flex: 1 }}>
          <View style={maintenancePlansStyles.emptyState}>
            <View
              style={[
                maintenancePlansStyles.emptyIconCircle,
                { backgroundColor: colors.primary + "14" },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={32}
                color={colors.primary}
              />
            </View>
            <Text
              style={[
                maintenancePlansStyles.emptyTitle,
                { color: colors.text },
              ]}
            >
              Nothing matches these answers
            </Text>
            <Text
              style={[
                maintenancePlansStyles.emptySubtext,
                { color: colors.textSecondary },
              ]}
            >
              Change your answers and we’ll tailor a different set of recurring
              tasks.
            </Text>
            {hasQuestionnaire ? (
              <View style={maintenancePlansStyles.emptyAction}>
                <Button
                  label="Change answers"
                  onPress={() => setPhase("questionnaire")}
                />
              </View>
            ) : null}
          </View>
        </View>
      );
    }

    return (
      <>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            maintenancePlansStyles.pickerScroll,
            { paddingBottom: DesignSystem.spacing.lg },
          ]}
        >
          <Text
            style={[
              maintenancePlansStyles.pickIntro,
              { color: colors.textSecondary },
            ]}
          >
            We’ll add these as recurring tasks. Uncheck anything that does not
            apply.
          </Text>
          {hasQuestionnaire && usedHomeProfile ? (
            <View style={maintenancePlansStyles.profileBanner}>
              <Text
                style={[
                  maintenancePlansStyles.profileBannerText,
                  { color: colors.primary },
                ]}
              >
                Based on your home
              </Text>
              <TouchableOpacity
                onPress={() => setPhase("questionnaire")}
                accessibilityRole="button"
                accessibilityLabel="Edit answers"
              >
                <Text
                  style={[
                    maintenancePlansStyles.pickActionText,
                    { color: colors.primary },
                  ]}
                >
                  Edit answers
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <Text
            style={[maintenancePlansStyles.pickCount, { color: colors.text }]}
          >
            Selected {maskOk ? newSelectedCount : "…"} of {items.length}
          </Text>

          <View style={maintenancePlansStyles.pickActionsRow}>
            <TouchableOpacity
              onPress={selectAllTasks}
              accessibilityRole="button"
              accessibilityLabel="Select all tasks"
            >
              <Text
                style={[
                  maintenancePlansStyles.pickActionText,
                  { color: colors.primary },
                ]}
              >
                Select all
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={clearAllTasks}
              accessibilityRole="button"
              accessibilityLabel="Clear all tasks"
            >
              <Text
                style={[
                  maintenancePlansStyles.pickActionText,
                  { color: colors.primary },
                ]}
              >
                Clear all
              </Text>
            </TouchableOpacity>
          </View>

          {showCategoryHeaders
            ? groupedPickerItems.map((group) => (
                <View key={group.key}>
                  <Text
                    style={[
                      maintenancePlansStyles.categoryHeader,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {group.label}
                  </Text>
                  <HearthSurfaceCard
                    containerStyle={maintenancePlansStyles.cardContainer}
                    style={maintenancePlansStyles.cardSurface}
                  >
                    {group.entries.map((entry, i) =>
                      renderTaskRow(
                        plan,
                        entry.item,
                        entry.index,
                        i === group.entries.length - 1
                      )
                    )}
                  </HearthSurfaceCard>
                </View>
              ))
            : (
              <HearthSurfaceCard
                containerStyle={maintenancePlansStyles.cardContainer}
                style={maintenancePlansStyles.cardSurface}
              >
                {items.map((item, index) =>
                  renderTaskRow(plan, item, index, index === items.length - 1)
                )}
              </HearthSurfaceCard>
            )}
        </ScrollView>
        <View
          style={[
            maintenancePlansStyles.applyFooter,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: footerPaddingBottom,
            },
          ]}
        >
          <Button
            label={`Add ${newSelectedCount} recurring task${
              newSelectedCount === 1 ? "" : "s"
            }`}
            onPress={() => {
              void triggerMedium();
              handleApply(plan, selectedItems);
            }}
            disabled={applying || newSelectedCount === 0 || !maskOk}
            loading={applying}
            accessibilityLabel="Add selected tasks"
          />
        </View>
      </>
    );
  };

  const renderQuestionnaire = () => {
    if (!detailPlan) return null;
    if (detailPlan.id === "spring-refresh") {
      return (
        <SpringRefreshQuestionnaire
          initialAnswers={springAnswers ?? springPrefill}
          onComplete={(answers) => {
            setSpringAnswers(answers);
            setColdWeatherAnswers(null);
            setStarterAnswers(null);
            setPoolSpaAnswers(null);
            setUsedHomeProfile(false);
            persistHomeFromAnswers(
              mergeFromSpringAnswers(profile?.home_systems, answers)
            );
            setPhase("pickTasks");
          }}
          onBack={resetToList}
        />
      );
    }
    if (detailPlan.id === "cold-weather-prep") {
      return (
        <ColdWeatherPrepQuestionnaire
          initialAnswers={coldWeatherAnswers ?? springPrefill}
          onComplete={(answers) => {
            setColdWeatherAnswers(answers);
            setSpringAnswers(null);
            setStarterAnswers(null);
            setPoolSpaAnswers(null);
            setUsedHomeProfile(false);
            persistHomeFromAnswers(
              mergeFromSpringAnswers(profile?.home_systems, answers)
            );
            setPhase("pickTasks");
          }}
          onBack={resetToList}
        />
      );
    }
    if (detailPlan.id === "new-homeowner-starter") {
      return (
        <NewHomeownerStarterQuestionnaire
          initialAnswers={starterAnswers ?? starterPrefill}
          onComplete={(answers) => {
            setStarterAnswers(answers);
            setSpringAnswers(null);
            setColdWeatherAnswers(null);
            setPoolSpaAnswers(null);
            setUsedHomeProfile(false);
            persistHomeFromAnswers(
              mergeFromStarterAnswers(profile?.home_systems, answers)
            );
            setPhase("pickTasks");
          }}
          onBack={resetToList}
        />
      );
    }
    if (detailPlan.id === "pool-spa-care") {
      return (
        <PoolSpaQuestionnaire
          initialAnswers={poolSpaAnswers ?? poolPrefill}
          onComplete={(answers) => {
            setPoolSpaAnswers(answers);
            setSpringAnswers(null);
            setColdWeatherAnswers(null);
            setStarterAnswers(null);
            setUsedHomeProfile(false);
            persistHomeFromAnswers(
              mergeFromPoolSpaAnswers(profile?.home_systems, answers)
            );
            setPhase("pickTasks");
          }}
          onBack={resetToList}
        />
      );
    }
    return null;
  };

  return (
    <HearthScreen style={maintenancePlansStyles.container}>
      <View style={maintenancePlansStyles.header}>
        <TouchableOpacity
          style={maintenancePlansStyles.backButton}
          onPress={headerBack}
          accessibilityRole="button"
          accessibilityLabel={phase === "list" ? "Go back" : "Back"}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[maintenancePlansStyles.headerTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {headerTitle()}
        </Text>
        <View style={maintenancePlansStyles.headerRightSpacer} />
      </View>

      {phase === "list" && renderPlanList()}
      {phase === "questionnaire" && renderQuestionnaire()}
      {phase === "pickTasks" && detailPlan ? (
        <View style={{ flex: 1 }}>{renderTaskPicker(detailPlan)}</View>
      ) : null}
    </HearthScreen>
  );
}
