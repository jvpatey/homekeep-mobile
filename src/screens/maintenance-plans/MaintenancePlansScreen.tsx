import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../navigation/types";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { useHaptics } from "../../hooks";
import { GlassCard } from "../../components/ui";
import { DesignSystem } from "../../theme/designSystem";
import {
  MAINTENANCE_PLANS,
  MaintenancePlanDefinition,
  MaintenancePlanItemTemplate,
  MaintenancePlanTag,
  filterSpringRefreshItems,
  filterColdWeatherPrepItems,
  filterNewHomeownerStarterItems,
  filterPoolSpaItems,
  getPlanTheme,
} from "../../data/maintenancePlans";
import type {
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
import { MaintenancePlanAccentProvider } from "./MaintenancePlanAccentContext";

const TAG_LABELS: Record<MaintenancePlanTag, string> = {
  spring: "Spring",
  fall: "Fall",
  safety: "Safety",
  starter: "Starter",
  general: "General",
  pool: "Pool & spa",
};

type FlowPhase = "list" | "questionnaire" | "pickTasks";

const QUESTIONNAIRE_PLAN_IDS = new Set([
  "spring-refresh",
  "cold-weather-prep",
  "new-homeowner-starter",
  "pool-spa-care",
]);

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

export function MaintenancePlansScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { triggerMedium, triggerLight } = useHaptics();
  const { applyMaintenancePlan } = useTasks();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [phase, setPhase] = useState<FlowPhase>("list");
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
  const [applying, setApplying] = useState(false);

  const planFlowAccent = useMemo(() => {
    if (
      !detailPlan ||
      (phase !== "questionnaire" && phase !== "pickTasks")
    ) {
      return undefined;
    }
    return getPlanTheme(detailPlan.id)?.primary;
  }, [detailPlan, phase]);

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
  }, [detailPlan, springAnswers, coldWeatherAnswers, starterAnswers, poolSpaAnswers]);

  useEffect(() => {
    if (phase !== "pickTasks") return;
    const n = resolvedDetailItems.length;
    setSelectedMask((prev) => {
      if (prev.length === n && n > 0) return prev;
      return Array(n).fill(true);
    });
  }, [
    phase,
    detailPlan?.id,
    springAnswers,
    coldWeatherAnswers,
    starterAnswers,
    poolSpaAnswers,
    resolvedDetailItems.length,
  ]);

  const selectedItems = useMemo(() => {
    return resolvedDetailItems.filter((_, i) => selectedMask[i]);
  }, [resolvedDetailItems, selectedMask]);

  const selectedCount = selectedItems.length;

  const openPlan = useCallback((plan: MaintenancePlanDefinition) => {
    setDetailPlan(plan);
    if (QUESTIONNAIRE_PLAN_IDS.has(plan.id)) {
      setSpringAnswers(null);
      setColdWeatherAnswers(null);
      setStarterAnswers(null);
      setPoolSpaAnswers(null);
      setPhase("questionnaire");
    } else {
      setPhase("pickTasks");
    }
  }, []);

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
    setSelectedMask((prev) => prev.map(() => true));
  }, [triggerLight]);

  const clearAllTasks = useCallback(() => {
    void triggerLight();
    setSelectedMask((prev) => prev.map(() => false));
  }, [triggerLight]);

  const handleApply = useCallback(
    (plan: MaintenancePlanDefinition, items: MaintenancePlanItemTemplate[]) => {
      const n = items.length;
      if (n === 0) {
        Alert.alert(
          "No tasks selected",
          "Choose at least one task to add to your schedule.",
          [{ text: "OK" }]
        );
        return;
      }
      Alert.alert(
        "Add recurring tasks?",
        `This will add up to ${n} recurring task${n === 1 ? "" : "s"}. Tasks that already match one on your schedule (same title, category, and repeat interval) are skipped — including tasks you added from another guided plan.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add tasks",
            onPress: async () => {
              setApplying(true);
              try {
                const result = await applyMaintenancePlan(plan.id, items);
                if (result.success) {
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
                    added === 0 && skipped > 0 ? "Nothing new to add" : "Plan applied",
                    message,
                    [
                      {
                        text: "OK",
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
    [applyMaintenancePlan, navigation]
  );

  const headerBack = () => {
    if (phase === "questionnaire") {
      setDetailPlan(null);
      setSpringAnswers(null);
      setColdWeatherAnswers(null);
      setStarterAnswers(null);
      setPoolSpaAnswers(null);
      setPhase("list");
      return;
    }
    if (phase === "pickTasks") {
      if (detailPlan && QUESTIONNAIRE_PLAN_IDS.has(detailPlan.id)) {
        setPhase("questionnaire");
        return;
      }
      setDetailPlan(null);
      setPhase("list");
      return;
    }
    navigation.goBack();
  };

  const headerTitle = () => {
    if (phase === "questionnaire" && detailPlan) {
      return detailPlan.title;
    }
    if (phase === "pickTasks" && detailPlan) {
      return detailPlan.title;
    }
    return "Maintenance plans";
  };

  const renderPlanList = () => {
    const mutedFill = isDark
      ? "rgba(255,255,255,0.08)"
      : "rgba(0,0,0,0.05)";
    const mutedBorder = isDark
      ? "rgba(255,255,255,0.12)"
      : "rgba(0,0,0,0.08)";

    return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={maintenancePlansStyles.scrollContent}
    >
      <GlassCard
        material="regular"
        radius={DesignSystem.borders.radius.glass}
        containerStyle={maintenancePlansStyles.cardContainer}
        style={maintenancePlansStyles.cardSurface}
      >
        {MAINTENANCE_PLANS.map((plan, index) => {
          const theme = getPlanTheme(plan.id);
          return (
          <TouchableOpacity
            key={plan.id}
            onPress={() => openPlan(plan)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`${plan.title}`}
            style={[
              maintenancePlansStyles.planRow,
              index < MAINTENANCE_PLANS.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.06)",
              },
            ]}
          >
            {theme ? (
              <View
                style={[
                  maintenancePlansStyles.planIconBubble,
                  { backgroundColor: mutedFill },
                ]}
              >
                <Ionicons
                  name={theme.icon}
                  size={22}
                  color={theme.primary}
                />
              </View>
            ) : null}
            <View style={maintenancePlansStyles.planRowText}>
              {plan.tag ? (
                <View
                  style={[
                    maintenancePlansStyles.tagPill,
                    {
                      backgroundColor: mutedFill,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: mutedBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      maintenancePlansStyles.tagPillText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {TAG_LABELS[plan.tag]}
                  </Text>
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
                  maintenancePlansStyles.planSubtitle,
                  {
                    color: colors.primary,
                    marginTop: DesignSystem.spacing.xs,
                  },
                ]}
              >
                {QUESTIONNAIRE_PLAN_IDS.has(plan.id)
                  ? `Questionnaire · pick tasks to add`
                  : `${plan.items.length} recurring task${
                      plan.items.length === 1 ? "" : "s"
                    }`}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme?.primary ?? colors.textSecondary}
            />
          </TouchableOpacity>
          );
        })}
      </GlassCard>
    </ScrollView>
    );
  };

  const renderTaskPicker = (plan: MaintenancePlanDefinition) => {
    const items = resolvedDetailItems;
    const maskOk =
      selectedMask.length === items.length && items.length > 0;
    const accent = getPlanTheme(plan.id)?.primary ?? colors.primary;

    return (
      <>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            maintenancePlansStyles.scrollContent,
            {
              paddingBottom:
                DesignSystem.spacing.xxxl + 72 + insets.bottom,
            },
          ]}
        >
          <Text
            style={[maintenancePlansStyles.pickIntro, { color: colors.textSecondary }]}
          >
            Tap tasks to include them when you add this plan. Selected:{" "}
            {maskOk ? selectedCount : "…"} of {items.length}.
          </Text>

          <View style={maintenancePlansStyles.pickActionsRow}>
            <TouchableOpacity onPress={selectAllTasks} accessibilityRole="button">
              <Text style={[maintenancePlansStyles.pickActionText, { color: accent }]}>
                Select all
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearAllTasks} accessibilityRole="button">
              <Text style={[maintenancePlansStyles.pickActionText, { color: accent }]}>
                Clear all
              </Text>
            </TouchableOpacity>
          </View>

          <GlassCard
            material="regular"
            radius={DesignSystem.borders.radius.glass}
            containerStyle={maintenancePlansStyles.cardContainer}
            style={maintenancePlansStyles.cardSurface}
          >
            {plan.body ? (
              <View style={{ padding: DesignSystem.spacing.md }}>
                <Text
                  style={[
                    maintenancePlansStyles.detailBody,
                    { color: colors.textSecondary },
                  ]}
                >
                  {plan.body}
                </Text>
              </View>
            ) : null}
            {items.map((item, index) => {
              const cat =
                HOME_MAINTENANCE_CATEGORIES[
                  item.category as keyof typeof HOME_MAINTENANCE_CATEGORIES
                ];
              const meta = `${cat.displayName} · ${formatIntervalDays(
                item.interval_days
              )}`;
              const isLast = index === items.length - 1;
              const checked =
                maskOk && selectedMask[index] === true;

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
                      borderBottomColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.06)",
                    },
                    isLast && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={maintenancePlansStyles.taskCheckboxHit}>
                    <Ionicons
                      name={checked ? "checkbox" : "square-outline"}
                      size={26}
                      color={checked ? accent : colors.textSecondary}
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
                  </View>
                </TouchableOpacity>
              );
            })}
          </GlassCard>
        </ScrollView>
        <View
          style={[
            maintenancePlansStyles.applyFooter,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: DesignSystem.spacing.md + insets.bottom,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              maintenancePlansStyles.applyButton,
              {
                backgroundColor:
                  applying || selectedCount === 0 ? colors.border : accent,
                opacity: applying ? 0.7 : 1,
              },
            ]}
            onPress={() => {
              void triggerMedium();
              handleApply(plan, selectedItems);
            }}
            disabled={applying || selectedCount === 0 || !maskOk}
            accessibilityRole="button"
            accessibilityLabel="Add selected tasks"
          >
            {applying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={[
                  maintenancePlansStyles.applyButtonText,
                  { color: "#FFFFFF" },
                ]}
              >
                Add {selectedCount} recurring task
                {selectedCount === 1 ? "" : "s"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </>
    );
  };

  const renderQuestionnaire = () => {
    if (!detailPlan) return null;
    if (detailPlan.id === "spring-refresh") {
      return (
        <SpringRefreshQuestionnaire
          initialAnswers={springAnswers}
          onComplete={(answers) => {
            setSpringAnswers(answers);
            setColdWeatherAnswers(null);
            setStarterAnswers(null);
            setPoolSpaAnswers(null);
            setPhase("pickTasks");
          }}
          onBack={() => {
            setDetailPlan(null);
            setSpringAnswers(null);
            setColdWeatherAnswers(null);
            setStarterAnswers(null);
            setPoolSpaAnswers(null);
            setPhase("list");
          }}
        />
      );
    }
    if (detailPlan.id === "cold-weather-prep") {
      return (
        <ColdWeatherPrepQuestionnaire
          initialAnswers={coldWeatherAnswers}
          onComplete={(answers) => {
            setColdWeatherAnswers(answers);
            setSpringAnswers(null);
            setStarterAnswers(null);
            setPoolSpaAnswers(null);
            setPhase("pickTasks");
          }}
          onBack={() => {
            setDetailPlan(null);
            setColdWeatherAnswers(null);
            setSpringAnswers(null);
            setStarterAnswers(null);
            setPoolSpaAnswers(null);
            setPhase("list");
          }}
        />
      );
    }
    if (detailPlan.id === "new-homeowner-starter") {
      return (
        <NewHomeownerStarterQuestionnaire
          initialAnswers={starterAnswers}
          onComplete={(answers) => {
            setStarterAnswers(answers);
            setSpringAnswers(null);
            setColdWeatherAnswers(null);
            setPoolSpaAnswers(null);
            setPhase("pickTasks");
          }}
          onBack={() => {
            setDetailPlan(null);
            setStarterAnswers(null);
            setSpringAnswers(null);
            setColdWeatherAnswers(null);
            setPoolSpaAnswers(null);
            setPhase("list");
          }}
        />
      );
    }
    if (detailPlan.id === "pool-spa-care") {
      return (
        <PoolSpaQuestionnaire
          initialAnswers={poolSpaAnswers}
          onComplete={(answers) => {
            setPoolSpaAnswers(answers);
            setSpringAnswers(null);
            setColdWeatherAnswers(null);
            setStarterAnswers(null);
            setPhase("pickTasks");
          }}
          onBack={() => {
            setDetailPlan(null);
            setPoolSpaAnswers(null);
            setSpringAnswers(null);
            setColdWeatherAnswers(null);
            setStarterAnswers(null);
            setPhase("list");
          }}
        />
      );
    }
    return null;
  };

  return (
    <SafeAreaView
      style={[maintenancePlansStyles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={maintenancePlansStyles.header}>
        <TouchableOpacity
          style={maintenancePlansStyles.backButton}
          onPress={headerBack}
          accessibilityRole="button"
          accessibilityLabel={
            phase === "list" ? "Go back" : "Back"
          }
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

      <MaintenancePlanAccentProvider accentHex={planFlowAccent}>
      {phase === "list" && renderPlanList()}
      {phase === "questionnaire" && renderQuestionnaire()}
      {phase === "pickTasks" && detailPlan ? (
        <View style={{ flex: 1 }}>{renderTaskPicker(detailPlan)}</View>
      ) : null}
      </MaintenancePlanAccentProvider>
    </SafeAreaView>
  );
}
