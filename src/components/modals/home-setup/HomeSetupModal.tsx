import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useProfile } from "../../../context/ProfileContext";
import { useTasks } from "../../../context/TasksContext";
import { HearthSheet } from "../../ui/HearthSheet";
import { Button } from "../../ui/Button";
import { DesignSystem } from "../../../theme/designSystem";
import {
  HomeHeatSource,
  HomePropertyType,
  HomeSystems,
  generateHomeScheduleItems,
  ScheduledHomeItem,
  isHomeSystemsComplete,
  homeHeatSources,
  HOME_HEAT_SOURCE_OPTIONS,
  isHeatPumpFamily,
  diffHomeSchedule,
  HomeScheduleDiff,
} from "../../../data/maintenancePlans";
import { MaintenanceService } from "../../../services/maintenanceService";
import {
  CategoryKey,
  HOME_MAINTENANCE_CATEGORIES,
} from "../../../types/maintenance";
import {
  QuestionCard,
  QuestionLabel,
  QuestionHint,
  ChoiceRow,
} from "../../../screens/maintenance-plans/questionnaireChrome";
import {
  HomeAddressFields,
  HomeAddressFieldsHandle,
} from "../home-address-onboarding/HomeAddressFields";

type Phase = "address" | "questions" | "confirm";

interface HomeSetupModalProps {
  visible: boolean;
  onClose: () => void;
  /** Settings edit — hide skip, still offer to add missing tasks. */
  hideSkip?: boolean;
  /** After first-run dismiss, open household join (Dashboard). */
  onJoinHousehold?: () => void;
  /** Overlay a parent sheet route instead of opening a nested RN Modal. */
  embedded?: boolean;
}

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

function categoryLabel(category: ScheduledHomeItem["category"]) {
  return (
    HOME_MAINTENANCE_CATEGORIES[
      category as keyof typeof HOME_MAINTENANCE_CATEGORIES
    ]?.displayName ?? category
  );
}

export function HomeSetupModal({
  visible,
  onClose,
  hideSkip = false,
  onJoinHousehold,
  embedded = false,
}: HomeSetupModalProps) {
  const { colors } = useTheme();
  const { profile, updateHomeSystems, markHomeSetupDone, skipAddressOnboarding } =
    useProfile();
  const { applyGeneratedHomeSchedule, reconcileHomeSchedule } = useTasks();
  const addressRef = useRef<HomeAddressFieldsHandle>(null);
  const [addressCanSubmit, setAddressCanSubmit] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(visible);
  const joinAfterDismissRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("address");
  const [hasLawn, setHasLawn] = useState<boolean | null>(null);
  const [propertyType, setPropertyType] = useState<HomePropertyType | null>(
    null
  );
  const [heatSources, setHeatSources] = useState<HomeHeatSource[]>([]);
  const [hasAirExchanger, setHasAirExchanger] = useState<boolean | null>(null);
  const [hasWaterSoftener, setHasWaterSoftener] = useState<boolean | null>(
    null
  );
  const [hasRefrigeratorWaterFilter, setHasRefrigeratorWaterFilter] =
    useState<boolean | null>(null);
  const [hasVentHoodFilters, setHasVentHoodFilters] = useState<boolean | null>(
    null
  );
  const [hasSeptic, setHasSeptic] = useState<boolean | null>(null);
  const [hasPool, setHasPool] = useState<boolean | null>(null);
  const [hasSpa, setHasSpa] = useState<boolean | null>(null);
  const [poolUsesSaltChlorination, setPoolUsesSaltChlorination] = useState<
    boolean | null
  >(null);
  const [selectedMask, setSelectedMask] = useState<boolean[]>([]);
  const [addMask, setAddMask] = useState<boolean[]>([]);
  const [pauseMask, setPauseMask] = useState<boolean[]>([]);
  const [reconcileDiff, setReconcileDiff] = useState<HomeScheduleDiff | null>(
    null
  );
  const [confirmMode, setConfirmMode] = useState<"generate" | "reconcile">(
    "generate"
  );
  const [saving, setSaving] = useState(false);
  const systemsBeforeEdit = useRef<HomeSystems | null>(null);

  const home = profile?.home_systems;
  const isReconcile = confirmMode === "reconcile";

  useEffect(() => {
    setSheetVisible(visible);
  }, [visible]);

  // Hydrate once per open. Saving the address updates the profile and must
  // not snap the wizard back to step 1.
  useEffect(() => {
    if (!visible) {
      setPhase("address");
      setSaving(false);
      setReconcileDiff(null);
      setConfirmMode("generate");
      setAddMask([]);
      setPauseMask([]);
      systemsBeforeEdit.current = null;
      return;
    }
    setHasLawn(home?.hasLawn ?? null);
    setPropertyType(home?.propertyType ?? null);
    setHeatSources(homeHeatSources(home));
    setHasAirExchanger(home?.hasAirExchanger ?? null);
    setHasWaterSoftener(home?.hasWaterSoftener ?? null);
    setHasRefrigeratorWaterFilter(home?.hasRefrigeratorWaterFilter ?? null);
    setHasVentHoodFilters(home?.hasVentHoodFilters ?? null);
    setHasSeptic(home?.hasSeptic ?? null);
    setHasPool(home?.hasPool ?? null);
    setHasSpa(home?.hasSpa ?? null);
    setPoolUsesSaltChlorination(home?.poolUsesSaltChlorination ?? null);
    setPhase("address");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the sheet opens
  }, [visible]);

  useEffect(() => {
    if (hasPool === false) setPoolUsesSaltChlorination(false);
  }, [hasPool]);

  const toggleHeatSource = (source: HomeHeatSource) => {
    setHeatSources((prev) =>
      prev.includes(source)
        ? prev.filter((item) => item !== source)
        : [...prev, source]
    );
  };

  const saltNeeded = hasPool === true;

  const answered =
    Number(hasLawn !== null) +
    Number(propertyType !== null) +
    Number(heatSources.length > 0) +
    Number(hasAirExchanger !== null) +
    Number(hasWaterSoftener !== null) +
    Number(hasRefrigeratorWaterFilter !== null) +
    Number(hasVentHoodFilters !== null) +
    Number(hasSeptic !== null) +
    Number(hasPool !== null) +
    Number(hasSpa !== null) +
    Number(!saltNeeded || poolUsesSaltChlorination !== null);

  const canContinueQuestions =
    hasLawn !== null &&
    propertyType !== null &&
    heatSources.length > 0 &&
    hasAirExchanger !== null &&
    hasWaterSoftener !== null &&
    hasRefrigeratorWaterFilter !== null &&
    hasVentHoodFilters !== null &&
    hasSeptic !== null &&
    hasPool !== null &&
    hasSpa !== null &&
    (!saltNeeded || poolUsesSaltChlorination !== null);

  const draftSystems = useMemo<HomeSystems | null>(() => {
    if (!canContinueQuestions) return null;
    return {
      hasLawn: hasLawn!,
      propertyType: propertyType!,
      heatSource: heatSources[0],
      heatSources,
      hasHeatPump: heatSources.some(isHeatPumpFamily),
      hasAirExchanger: hasAirExchanger!,
      hasWaterSoftener: hasWaterSoftener!,
      hasRefrigeratorWaterFilter: hasRefrigeratorWaterFilter!,
      hasVentHoodFilters: hasVentHoodFilters!,
      hasSeptic: hasSeptic!,
      hasPool: hasPool!,
      hasSpa: hasSpa!,
      poolUsesSaltChlorination: hasPool
        ? Boolean(poolUsesSaltChlorination)
        : false,
    };
  }, [
    canContinueQuestions,
    hasLawn,
    propertyType,
    heatSources,
    hasAirExchanger,
    hasWaterSoftener,
    hasRefrigeratorWaterFilter,
    hasVentHoodFilters,
    hasSeptic,
    hasPool,
    hasSpa,
    poolUsesSaltChlorination,
  ]);

  const generatedItems = useMemo(() => {
    if (!draftSystems || !isHomeSystemsComplete(draftSystems)) return [];
    return generateHomeScheduleItems(draftSystems, {
      month: new Date().getMonth(),
      latitude: profile?.latitude,
    });
  }, [draftSystems, profile?.latitude]);

  const confirmSections = useMemo(() => {
    const categoryOrder = Object.keys(
      HOME_MAINTENANCE_CATEGORIES
    ) as CategoryKey[];
    const buckets = new Map<
      string,
      { item: ScheduledHomeItem; index: number }[]
    >();
    generatedItems.forEach((item, index) => {
      const key = item.category;
      const rows = buckets.get(key) ?? [];
      rows.push({ item, index });
      buckets.set(key, rows);
    });
    const known = categoryOrder
      .filter((key) => buckets.has(key))
      .map((key) => ({
        key,
        title: categoryLabel(key),
        rows: buckets.get(key) ?? [],
      }));
    const extras = [...buckets.entries()]
      .filter(([key]) => !categoryOrder.includes(key as CategoryKey))
      .map(([key, rows]) => ({
        key,
        title: categoryLabel(key as ScheduledHomeItem["category"]),
        rows,
      }));
    return [...known, ...extras];
  }, [generatedItems]);

  useEffect(() => {
    if (phase !== "confirm") return;
    const next = generatedItems.map(() => true);
    setSelectedMask((prev) => {
      if (
        prev.length === next.length &&
        prev.every((value, index) => value === next[index])
      ) {
        return prev;
      }
      return next;
    });
  }, [phase, generatedItems]);

  const selectedItems = generatedItems.filter((_, i) => selectedMask[i]);
  const selectedAdds = (reconcileDiff?.toAdd ?? []).filter(
    (_, i) => addMask[i]
  );
  const selectedPauses = (reconcileDiff?.toPause ?? []).filter(
    (_, i) => pauseMask[i]
  );

  const persistFirstRunSkip = async () => {
    if (phase === "address") {
      await skipAddressOnboarding();
    }
    await markHomeSetupDone();
  };

  const closeSheet = () => setSheetVisible(false);

  const handleSkip = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await persistFirstRunSkip();
      closeSheet();
    } finally {
      setSaving(false);
    }
  };

  const handleRequestClose = () => {
    if (saving) return;
    if (hideSkip) {
      closeSheet();
      return;
    }
    void handleSkip();
  };

  const handleJoinHousehold = async () => {
    if (saving) return;
    setSaving(true);
    try {
      joinAfterDismissRef.current = true;
      await persistFirstRunSkip();
      closeSheet();
    } finally {
      setSaving(false);
    }
  };

  const handleContinueFromAddress = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const ok = await addressRef.current?.save({ quietGeocodeMiss: true });
      if (ok) setPhase("questions");
    } finally {
      setSaving(false);
    }
  };

  const handleContinueToConfirm = async () => {
    if (!draftSystems) return;
    systemsBeforeEdit.current = profile?.home_systems ?? {};
    const result = await updateHomeSystems(draftSystems);
    if (!result.success) {
      Alert.alert("Couldn't save", result.error ?? "Please try again.");
      return;
    }

    const { data, error } = await MaintenanceService.getMaintenanceRoutines({
      is_active: true,
    });
    if (error) {
      Alert.alert("Couldn't load schedule", error.message);
      return;
    }
    const existing = data ?? [];

    // Empty schedule (e.g. after reset) → full generated picker, not a
    // systems-only diff that would say "already matches" and add nothing.
    if (existing.length === 0) {
      setReconcileDiff(null);
      setConfirmMode("generate");
      setPhase("confirm");
      return;
    }

    const diff = diffHomeSchedule({
      oldHome: systemsBeforeEdit.current,
      newHome: draftSystems,
      existingRoutines: existing,
      month: new Date().getMonth(),
      latitude: profile?.latitude,
    });
    if (diff.toAdd.length === 0 && diff.toPause.length === 0) {
      await markHomeSetupDone();
      Alert.alert("You're set", "Your schedule already matches this home.");
      closeSheet();
      return;
    }
    setReconcileDiff(diff);
    setAddMask(diff.toAdd.map(() => true));
    setPauseMask(diff.toPause.map(() => true));
    setConfirmMode("reconcile");
    setPhase("confirm");
  };

  const handleApply = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (isReconcile) {
        const result = await reconcileHomeSchedule({
          toAdd: selectedAdds,
          pauseIds: selectedPauses.map((row) => row.id),
        });
        if (!result.success) {
          Alert.alert(
            "Couldn't update schedule",
            result.error ?? "Please try again."
          );
          return;
        }
        await markHomeSetupDone();
        const added = result.addedCount ?? 0;
        const paused = result.pausedCount ?? 0;
        if (added > 0 || paused > 0) {
          const parts: string[] = [];
          if (added > 0) {
            parts.push(
              `Added ${added} task${added === 1 ? "" : "s"}`
            );
          }
          if (paused > 0) {
            parts.push(
              `paused ${paused} reminder${paused === 1 ? "" : "s"}`
            );
          }
          Alert.alert("Home updated", `${parts.join(", ")}.`);
        }
        closeSheet();
        return;
      }

      const result = await applyGeneratedHomeSchedule(selectedItems);
      if (!result.success) {
        Alert.alert("Couldn't add tasks", result.error ?? "Please try again.");
        return;
      }
      await markHomeSetupDone();
      const added = result.addedCount ?? 0;
      const skipped = result.skippedCount ?? 0;
      if (added === 0 && skipped > 0) {
        Alert.alert(
          "You're set",
          "Those routines are already on your schedule."
        );
      } else if (added > 0) {
        Alert.alert(
          "Schedule ready",
          skipped > 0
            ? `Added ${added} tasks. ${skipped} were already tracked.`
            : `Added ${added} tasks for this home.`
        );
      }
      closeSheet();
    } finally {
      setSaving(false);
    }
  };

  const questionCount = 10 + (saltNeeded ? 1 : 0);

  const skipOrCancel = hideSkip ? (
    <Button label="Cancel" onPress={handleRequestClose} variant="ghost" />
  ) : (
    <>
      <Button
        label="Join a household instead"
        onPress={() => void handleJoinHousehold()}
        variant="ghost"
        disabled={saving}
        accessibilityLabel="Skip setup and join someone else's household"
      />
      <Button
        label="Skip for now"
        onPress={() => void handleSkip()}
        variant="ghost"
        disabled={saving}
      />
    </>
  );

  const footer =
    phase === "address" ? (
      <View style={styles.footerInner}>
        <Button
          label={saving ? "Saving…" : "Continue"}
          onPress={() => void handleContinueFromAddress()}
          disabled={!addressCanSubmit || saving}
          accessibilityLabel="Save address and continue"
        />
        {skipOrCancel}
      </View>
    ) : phase === "questions" ? (
      <View style={styles.footerInner}>
        <Button
          label="See what this house needs"
          onPress={() => void handleContinueToConfirm()}
          disabled={!canContinueQuestions}
          accessibilityLabel="Continue to suggested schedule"
        />
        <Button
          label="Back"
          onPress={() => setPhase("address")}
          variant="ghost"
          disabled={saving}
        />
        {skipOrCancel}
      </View>
    ) : (
      <View style={styles.footerInner}>
        <Button
          label={
            saving
              ? isReconcile
                ? "Updating…"
                : "Adding…"
              : isReconcile
                ? selectedAdds.length === 0 && selectedPauses.length === 0
                  ? "Save without changing tasks"
                  : "Update schedule"
                : selectedItems.length === 0
                  ? "Save home without tasks"
                  : `Add ${selectedItems.length} tasks`
          }
          onPress={() => void handleApply()}
          disabled={saving}
          accessibilityLabel={
            isReconcile
              ? "Update schedule for this home"
              : "Apply generated schedule"
          }
        />
        <Button
          label="Back"
          onPress={() => setPhase("questions")}
          variant="ghost"
          disabled={saving}
        />
      </View>
    );

  const sheetTitle =
    phase === "confirm"
      ? isReconcile
        ? "What changed"
        : "Here's what this house needs"
      : "Set up your home";

  return (
    <HearthSheet
      visible={sheetVisible}
      onClose={handleRequestClose}
      onDismissed={() => {
        onClose();
        if (joinAfterDismissRef.current) {
          joinAfterDismissRef.current = false;
          onJoinHousehold?.();
        }
      }}
      title={sheetTitle}
      fillMaxHeight
      embedded={embedded}
      footer={footer}
    >
      {phase === "address" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <Text style={[styles.progress, { color: colors.textSecondary }]}>
            1 of 3 · Address
          </Text>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            Start with where you live. We'll use this for weather, seasons, and
            your schedule. If someone already set up this home, join their
            household instead.
          </Text>
          <HomeAddressFields
            ref={addressRef}
            active={sheetVisible && phase === "address"}
            onCanSubmitChange={setAddressCanSubmit}
          />
        </ScrollView>
      ) : phase === "questions" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.progress, { color: colors.textSecondary }]}>
            2 of 3 · Home systems · {answered} of {questionCount} answered
          </Text>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            Answer a few questions once. We'll build a maintenance schedule that
            matches this house.
          </Text>

          <QuestionCard>
            <QuestionLabel>Do you have a lawn?</QuestionLabel>
            <ChoiceRow
              label="Yes"
              selected={hasLawn === true}
              onPress={() => setHasLawn(true)}
              accessibilityLabel="Yes, I have a lawn"
            />
            <ChoiceRow
              label="No"
              selected={hasLawn === false}
              onPress={() => setHasLawn(false)}
              accessibilityLabel="No lawn"
            />
          </QuestionCard>

          <QuestionCard>
            <QuestionLabel>What best describes your home?</QuestionLabel>
            <ChoiceRow
              label="House (I maintain my own exterior)"
              selected={propertyType === "house"}
              onPress={() => setPropertyType("house")}
              accessibilityLabel="House"
            />
            <ChoiceRow
              label="Condo or townhome"
              selected={propertyType === "condo_townhome"}
              onPress={() => setPropertyType("condo_townhome")}
              accessibilityLabel="Condo or townhome"
            />
          </QuestionCard>

          <QuestionCard>
            <QuestionLabel>How do you heat your home?</QuestionLabel>
            <QuestionHint>Select all that apply.</QuestionHint>
            {HOME_HEAT_SOURCE_OPTIONS.map((option) => (
              <ChoiceRow
                key={option.id}
                label={option.label}
                selected={heatSources.includes(option.id)}
                onPress={() => toggleHeatSource(option.id)}
                accessibilityLabel={option.label}
                multiple
              />
            ))}
          </QuestionCard>

          <QuestionCard>
            <QuestionLabel>HRV, ERV, or whole-home air exchanger?</QuestionLabel>
            <ChoiceRow
              label="Yes"
              selected={hasAirExchanger === true}
              onPress={() => setHasAirExchanger(true)}
              accessibilityLabel="Yes, air exchanger"
            />
            <ChoiceRow
              label="No"
              selected={hasAirExchanger === false}
              onPress={() => setHasAirExchanger(false)}
              accessibilityLabel="No air exchanger"
            />
          </QuestionCard>

          <QuestionCard>
            <QuestionLabel>Water softener?</QuestionLabel>
            <ChoiceRow
              label="Yes"
              selected={hasWaterSoftener === true}
              onPress={() => setHasWaterSoftener(true)}
              accessibilityLabel="Yes, water softener"
            />
            <ChoiceRow
              label="No"
              selected={hasWaterSoftener === false}
              onPress={() => setHasWaterSoftener(false)}
              accessibilityLabel="No water softener"
            />
          </QuestionCard>

          <QuestionCard>
            <QuestionLabel>Refrigerator with a water filter?</QuestionLabel>
            <ChoiceRow
              label="Yes"
              selected={hasRefrigeratorWaterFilter === true}
              onPress={() => setHasRefrigeratorWaterFilter(true)}
              accessibilityLabel="Yes, fridge filter"
            />
            <ChoiceRow
              label="No"
              selected={hasRefrigeratorWaterFilter === false}
              onPress={() => setHasRefrigeratorWaterFilter(false)}
              accessibilityLabel="No fridge filter"
            />
          </QuestionCard>

          <QuestionCard>
            <QuestionLabel>Vent hood or microwave grease filters?</QuestionLabel>
            <ChoiceRow
              label="Yes"
              selected={hasVentHoodFilters === true}
              onPress={() => setHasVentHoodFilters(true)}
              accessibilityLabel="Yes, vent hood filters"
            />
            <ChoiceRow
              label="No"
              selected={hasVentHoodFilters === false}
              onPress={() => setHasVentHoodFilters(false)}
              accessibilityLabel="No vent hood filters"
            />
          </QuestionCard>

          <QuestionCard>
            <QuestionLabel>Private septic system?</QuestionLabel>
            <ChoiceRow
              label="Yes"
              selected={hasSeptic === true}
              onPress={() => setHasSeptic(true)}
              accessibilityLabel="Yes, septic"
            />
            <ChoiceRow
              label="No"
              selected={hasSeptic === false}
              onPress={() => setHasSeptic(false)}
              accessibilityLabel="No septic"
            />
          </QuestionCard>

          <QuestionCard>
            <QuestionLabel>Swimming pool?</QuestionLabel>
            <ChoiceRow
              label="Yes"
              selected={hasPool === true}
              onPress={() => setHasPool(true)}
              accessibilityLabel="Yes, pool"
            />
            <ChoiceRow
              label="No"
              selected={hasPool === false}
              onPress={() => setHasPool(false)}
              accessibilityLabel="No pool"
            />
          </QuestionCard>

          <QuestionCard>
            <QuestionLabel>Hot tub or spa?</QuestionLabel>
            <ChoiceRow
              label="Yes"
              selected={hasSpa === true}
              onPress={() => setHasSpa(true)}
              accessibilityLabel="Yes, spa"
            />
            <ChoiceRow
              label="No"
              selected={hasSpa === false}
              onPress={() => setHasSpa(false)}
              accessibilityLabel="No spa"
            />
          </QuestionCard>

          {saltNeeded ? (
            <QuestionCard>
              <QuestionLabel>Does your pool use salt chlorination?</QuestionLabel>
              <QuestionHint>
                Choose No if you use tablets, liquid chlorine, or a non-salt
                sanitizer.
              </QuestionHint>
              <ChoiceRow
                label="Yes"
                selected={poolUsesSaltChlorination === true}
                onPress={() => setPoolUsesSaltChlorination(true)}
                accessibilityLabel="Yes, salt chlorination"
              />
              <ChoiceRow
                label="No"
                selected={poolUsesSaltChlorination === false}
                onPress={() => setPoolUsesSaltChlorination(false)}
                accessibilityLabel="No salt chlorination"
              />
            </QuestionCard>
          ) : null}
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.progress, { color: colors.textSecondary }]}>
            3 of 3 · Schedule
          </Text>
          {isReconcile && reconcileDiff ? (
            <>
              <Text style={[styles.intro, { color: colors.textSecondary }]}>
                Because this home changed, add new reminders or pause ones that
                no longer apply.
              </Text>
              {reconcileDiff.toAdd.length > 0 ? (
                <View style={styles.sectionBlock}>
                  <Text
                    style={[
                      styles.sectionHeading,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Add
                  </Text>
                  {reconcileDiff.toAdd.map((item, index) => {
                    const selected = !!addMask[index];
                    return (
                      <TouchableOpacity
                        key={`add-${item.source_plan_id}-${item.title}-${index}`}
                        style={[
                          styles.taskRow,
                          {
                            borderColor: selected
                              ? colors.primary
                              : colors.border,
                            backgroundColor: selected
                              ? colors.primary + "12"
                              : "transparent",
                          },
                        ]}
                        onPress={() => {
                          setAddMask((prev) => {
                            const next = [...prev];
                            next[index] = !next[index];
                            return next;
                          });
                        }}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        accessibilityLabel={`Add ${item.title}`}
                      >
                        <View style={styles.taskText}>
                          <Text
                            style={[styles.taskTitle, { color: colors.text }]}
                          >
                            {item.title}
                          </Text>
                          <Text
                            style={[
                              styles.taskMeta,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {formatIntervalDays(item.interval_days)}
                          </Text>
                        </View>
                        <Ionicons
                          name={
                            selected ? "checkmark-circle" : "ellipse-outline"
                          }
                          size={22}
                          color={
                            selected ? colors.primary : colors.textSecondary
                          }
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
              {reconcileDiff.toPause.length > 0 ? (
                <View style={styles.sectionBlock}>
                  <Text
                    style={[
                      styles.sectionHeading,
                      { color: colors.textSecondary },
                    ]}
                  >
                    No longer applies
                  </Text>
                  <Text
                    style={[styles.pauseHint, { color: colors.textSecondary }]}
                  >
                    Pause these reminders. History stays in completion history.
                  </Text>
                  {reconcileDiff.toPause.map((item, index) => {
                    const selected = !!pauseMask[index];
                    return (
                      <TouchableOpacity
                        key={`pause-${item.id}`}
                        style={[
                          styles.taskRow,
                          {
                            borderColor: selected
                              ? colors.warning
                              : colors.border,
                            backgroundColor: selected
                              ? colors.warning + "14"
                              : "transparent",
                          },
                        ]}
                        onPress={() => {
                          setPauseMask((prev) => {
                            const next = [...prev];
                            next[index] = !next[index];
                            return next;
                          });
                        }}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        accessibilityLabel={`Pause ${item.title}`}
                      >
                        <View style={styles.taskText}>
                          <Text
                            style={[styles.taskTitle, { color: colors.text }]}
                          >
                            {item.title}
                          </Text>
                          <Text
                            style={[
                              styles.taskMeta,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {formatIntervalDays(item.interval_days)}
                          </Text>
                        </View>
                        <Ionicons
                          name={
                            selected ? "pause-circle" : "ellipse-outline"
                          }
                          size={22}
                          color={
                            selected ? colors.warning : colors.textSecondary
                          }
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </>
          ) : (
            <>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            We'll add these as recurring tasks. Uncheck anything that does not
            apply.
          </Text>
          {confirmSections.map((section) => (
            <View key={section.key} style={styles.sectionBlock}>
              <Text
                style={[styles.sectionHeading, { color: colors.textSecondary }]}
              >
                {section.title}
              </Text>
              {section.rows.map(({ item, index }) => {
                const selected = !!selectedMask[index];
                return (
                  <TouchableOpacity
                    key={`${item.source_plan_id}-${item.title}-${index}`}
                    style={[
                      styles.taskRow,
                      {
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected
                          ? colors.primary + "12"
                          : "transparent",
                      },
                    ]}
                    onPress={() => {
                      setSelectedMask((prev) => {
                        const next = [...prev];
                        next[index] = !next[index];
                        return next;
                      });
                    }}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={item.title}
                  >
                    <View style={styles.taskText}>
                      <Text style={[styles.taskTitle, { color: colors.text }]}>
                        {item.title}
                      </Text>
                      <Text
                        style={[
                          styles.taskMeta,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {formatIntervalDays(item.interval_days)}
                      </Text>
                    </View>
                    <Ionicons
                      name={selected ? "checkmark-circle" : "ellipse-outline"}
                      size={22}
                      color={selected ? colors.primary : colors.textSecondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
            </>
          )}
        </ScrollView>
      )}
    </HearthSheet>
  );
}

const styles = StyleSheet.create({
  progress: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: DesignSystem.spacing.sm,
  },
  intro: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
    marginBottom: DesignSystem.spacing.lg,
  },
  sectionBlock: {
    marginBottom: DesignSystem.spacing.md,
  },
  sectionHeading: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: DesignSystem.spacing.sm,
  },
  pauseHint: {
    ...DesignSystem.typography.footnote,
    lineHeight: 18,
    marginBottom: DesignSystem.spacing.sm,
  },
  footerInner: {
    gap: DesignSystem.spacing.xs,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: DesignSystem.spacing.sm,
    gap: DesignSystem.spacing.sm,
  },
  taskText: {
    flex: 1,
  },
  taskTitle: {
    ...DesignSystem.typography.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  taskMeta: {
    ...DesignSystem.typography.footnote,
  },
});
