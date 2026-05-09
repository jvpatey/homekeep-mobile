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
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../navigation/types";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { useGradients, useHaptics } from "../../hooks";
import { GlassCard } from "../../components/ui";
import { DesignSystem } from "../../theme/designSystem";
import {
  MAINTENANCE_PLANS,
  MaintenancePlanDefinition,
  MaintenancePlanItemTemplate,
  MaintenancePlanTag,
  filterSpringRefreshItems,
  filterColdWeatherPrepItems,
} from "../../data/maintenancePlans";
import type {
  SpringRefreshAnswers,
  ColdWeatherPrepAnswers,
} from "../../data/maintenancePlans";
import { HOME_MAINTENANCE_CATEGORIES } from "../../types/maintenance";
import { maintenancePlansStyles } from "./styles";
import { SpringRefreshQuestionnaire } from "./SpringRefreshQuestionnaire";
import { ColdWeatherPrepQuestionnaire } from "./ColdWeatherPrepQuestionnaire";

const TAG_LABELS: Record<MaintenancePlanTag, string> = {
  spring: "Spring",
  fall: "Fall",
  safety: "Safety",
  starter: "Starter",
  general: "General",
};

type FlowPhase = "list" | "questionnaire" | "pickTasks";

const QUESTIONNAIRE_PLAN_IDS = new Set([
  "spring-refresh",
  "cold-weather-prep",
]);

function formatIntervalDays(days: number): string {
  if (days === 7) return "Every week";
  if (days === 30) return "Every month";
  if (days === 60) return "Every 2 months";
  if (days === 90) return "Every 3 months";
  if (days === 180) return "Every 6 months";
  if (days === 365) return "Every year";
  return `Every ${days} days`;
}

export function MaintenancePlansScreen() {
  const { colors, isDark } = useTheme();
  const { haloGradient } = useGradients();
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
  const [selectedMask, setSelectedMask] = useState<boolean[]>([]);
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
    return detailPlan.items;
  }, [detailPlan, springAnswers, coldWeatherAnswers]);

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
        `This will add ${n} recurring task${n === 1 ? "" : "s"} to your home. Applying the same plan again may create duplicates.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add tasks",
            onPress: async () => {
              setApplying(true);
              try {
                const result = await applyMaintenancePlan(plan.id, items);
                if (result.success) {
                  Alert.alert(
                    "Plan applied",
                    `${n} recurring task${n === 1 ? "" : "s"} were added to your schedule.`,
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

  const renderPlanList = () => (
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
        {MAINTENANCE_PLANS.map((plan, index) => (
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
            <View style={maintenancePlansStyles.planRowText}>
              {plan.tag ? (
                <View
                  style={[
                    maintenancePlansStyles.tagPill,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.05)",
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
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </GlassCard>
    </ScrollView>
  );

  const renderTaskPicker = (plan: MaintenancePlanDefinition) => {
    const items = resolvedDetailItems;
    const maskOk =
      selectedMask.length === items.length && items.length > 0;

    return (
      <>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={maintenancePlansStyles.scrollContent}
        >
          <Text
            style={[maintenancePlansStyles.pickIntro, { color: colors.textSecondary }]}
          >
            Tap tasks to include them when you add this plan. Selected:{" "}
            {maskOk ? selectedCount : "…"} of {items.length}.
          </Text>

          <View style={maintenancePlansStyles.pickActionsRow}>
            <TouchableOpacity onPress={selectAllTasks} accessibilityRole="button">
              <Text style={[maintenancePlansStyles.pickActionText, { color: colors.primary }]}>
                Select all
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearAllTasks} accessibilityRole="button">
              <Text style={[maintenancePlansStyles.pickActionText, { color: colors.primary }]}>
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
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: DesignSystem.spacing.md,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              maintenancePlansStyles.applyButton,
              {
                backgroundColor:
                  applying || selectedCount === 0 ? colors.border : colors.primary,
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
            setPhase("pickTasks");
          }}
          onBack={() => {
            setDetailPlan(null);
            setSpringAnswers(null);
            setColdWeatherAnswers(null);
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
            setPhase("pickTasks");
          }}
          onBack={() => {
            setDetailPlan(null);
            setColdWeatherAnswers(null);
            setSpringAnswers(null);
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

      <LinearGradient
        colors={[...haloGradient]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={maintenancePlansStyles.heroHalo}
        pointerEvents="none"
      />

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

      {phase === "list" && renderPlanList()}
      {phase === "questionnaire" && renderQuestionnaire()}
      {phase === "pickTasks" && detailPlan ? (
        <View style={{ flex: 1 }}>{renderTaskPicker(detailPlan)}</View>
      ) : null}
    </SafeAreaView>
  );
}
