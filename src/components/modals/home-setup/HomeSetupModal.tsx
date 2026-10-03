import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
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
import { EquipmentManualService } from "../../../services/EquipmentManualService";
import {
  EquipmentType,
  EQUIPMENT_TYPE_LABELS,
} from "../../../types/equipmentManual";
import {
  hintsForEquipmentName,
} from "../../../data/equipmentTaskHints";
import {
  buildRoutinePayloadsFromItems,
} from "../../../data/maintenancePlans";
import type { MaintenancePlanItemTemplate } from "../../../data/maintenancePlans/types";

type Phase =
  | "address"
  | "questions"
  | "equipment"
  | "confirm"
  | "hints"
  | "homeshare";

const SETUP_EQUIPMENT_TYPES: EquipmentType[] = [
  "furnace",
  "ac",
  "water_heater",
  "fridge",
];

type SessionEquipment = {
  id: string;
  name: string;
  equipment_type: EquipmentType;
};

type PendingHintRow = {
  key: string;
  equipmentId: string;
  equipmentName: string;
  item: MaintenancePlanItemTemplate;
  selected: boolean;
};

interface HomeSetupModalProps {
  visible: boolean;
  onClose: () => void;
  /** Settings edit — hide skip, still offer to add missing tasks. */
  hideSkip?: boolean;
  /**
   * First-run only. Fired after the sheet exit animation finishes so a follow-up
   * Modal (HomeShare / Plus) does not stack on top of setup and block touches.
   */
  onFirstRunFinished?: (action: "invite" | "join" | "done") => void;
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
  onFirstRunFinished,
  embedded = false,
}: HomeSetupModalProps) {
  const { colors } = useTheme();
  const {
    profile,
    updateHomeSystems,
    markHomeSetupDone,
    skipAddressOnboarding,
    canEditHome,
  } = useProfile();
  const {
    applyGeneratedHomeSchedule,
    reconcileHomeSchedule,
    createTask,
  } = useTasks();
  const addressRef = useRef<HomeAddressFieldsHandle>(null);
  const [addressCanSubmit, setAddressCanSubmit] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(visible);
  const finishActionRef = useRef<"invite" | "join" | "done" | null>(null);

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
  const [sessionEquipment, setSessionEquipment] = useState<SessionEquipment[]>(
    []
  );
  const [pendingHints, setPendingHints] = useState<PendingHintRow[]>([]);
  const [pendingFinishCopy, setPendingFinishCopy] = useState<{
    title: string;
    message: string;
  } | null>(null);

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
      setSessionEquipment([]);
      setPendingHints([]);
      setPendingFinishCopy(null);
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
    setSessionEquipment([]);
    setPendingHints([]);
    setPendingFinishCopy(null);
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

  const closeSheet = (action?: "invite" | "join" | "done") => {
    if (!hideSkip && action) {
      finishActionRef.current = action;
    } else if (!hideSkip && finishActionRef.current == null) {
      finishActionRef.current = "done";
    }
    setSheetVisible(false);
  };

  const handleSkip = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await persistFirstRunSkip();
      closeSheet("done");
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
    // Setup already finished (HomeShare step) — just dismiss.
    if (phase === "homeshare") {
      closeSheet("done");
      return;
    }
    void handleSkip();
  };

  const handleJoinHousehold = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await persistFirstRunSkip();
      closeSheet("join");
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

  const canOfferInvite =
    !hideSkip && canEditHome && !profile?.household_id;

  const goToHomeShareStep = (title: string, message: string) => {
    if (!canOfferInvite) {
      Alert.alert(title, message);
      closeSheet("done");
      return;
    }
    setPendingFinishCopy({ title, message });
    setPhase("homeshare");
  };

  const finishHomeShareInvite = () => {
    closeSheet("invite");
  };

  const finishHomeShareJoin = () => {
    closeSheet("join");
  };

  const finishHomeShareSkip = () => {
    closeSheet("done");
  };

  const buildPendingHints = (equipment: SessionEquipment[]): PendingHintRow[] => {
    const rows: PendingHintRow[] = [];
    for (const eq of equipment) {
      const hints = hintsForEquipmentName(eq.name, eq.equipment_type);
      for (const item of hints) {
        rows.push({
          key: `${eq.id}:${item.title}:${item.category}:${item.interval_days}`,
          equipmentId: eq.id,
          equipmentName: eq.name,
          item,
          selected: true,
        });
      }
    }
    return rows;
  };

  const finishAfterSchedule = (title: string, message: string) => {
    const hints = buildPendingHints(sessionEquipment);
    if (!hideSkip && hints.length > 0) {
      setPendingHints(hints);
      setPendingFinishCopy({ title, message });
      setPhase("hints");
      return;
    }
    goToHomeShareStep(title, message);
  };

  const applySelectedHints = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const selected = pendingHints.filter((row) => row.selected);
      for (const row of selected) {
        const [payload] = buildRoutinePayloadsFromItems([row.item]);
        const result = await createTask({
          ...payload,
          equipment_id: row.equipmentId,
        });
        if (!result.success) {
          throw new Error(result.error ?? "Could not add reminder");
        }
      }
      const copy = pendingFinishCopy ?? {
        title: "Schedule ready",
        message: "Your home is set up.",
      };
      setPendingHints([]);
      goToHomeShareStep(copy.title, copy.message);
    } catch (e) {
      Alert.alert(
        "Could not add reminders",
        e instanceof Error ? e.message : "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const skipHintsAndFinish = () => {
    const copy = pendingFinishCopy ?? {
      title: "Schedule ready",
      message: "Your home is set up.",
    };
    setPendingHints([]);
    goToHomeShareStep(copy.title, copy.message);
  };

  const toggleSessionEquipmentType = async (type: EquipmentType) => {
    if (saving) return;
    const existing = sessionEquipment.find((e) => e.equipment_type === type);
    if (existing) {
      setSaving(true);
      try {
        await EquipmentManualService.deleteEquipmentManual(existing.id);
        setSessionEquipment((prev) =>
          prev.filter((e) => e.equipment_type !== type)
        );
      } catch {
        Alert.alert("Couldn't remove", "Please try again.");
      } finally {
        setSaving(false);
      }
      return;
    }
    setSaving(true);
    try {
      const name = EQUIPMENT_TYPE_LABELS[type];
      const result = await EquipmentManualService.createEquipmentManual({
        name,
        equipment_type: type,
      });
      if (result.error || !result.data) {
        Alert.alert(
          "Couldn't add equipment",
          result.error?.message ?? "Please try again."
        );
        return;
      }
      setSessionEquipment((prev) => [
        ...prev,
        {
          id: result.data!.id,
          name: result.data!.name,
          equipment_type: type,
        },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const proceedToConfirmPhase = async () => {
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
      finishAfterSchedule(
        "You're set",
        "Your schedule already matches this home."
      );
      return;
    }
    setReconcileDiff(diff);
    setAddMask(diff.toAdd.map(() => true));
    setPauseMask(diff.toPause.map(() => true));
    setConfirmMode("reconcile");
    setPhase("confirm");
  };

  const handleContinueFromQuestions = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (!hideSkip) {
        // First-run: optional equipment before schedule confirm.
        if (!draftSystems) return;
        const result = await updateHomeSystems(draftSystems);
        if (!result.success) {
          Alert.alert("Couldn't save", result.error ?? "Please try again.");
          return;
        }
        systemsBeforeEdit.current = draftSystems;
        setPhase("equipment");
        return;
      }
      await proceedToConfirmPhase();
    } finally {
      setSaving(false);
    }
  };

  const handleContinueFromEquipment = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await proceedToConfirmPhase();
    } finally {
      setSaving(false);
    }
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
            parts.push(`Added ${added} task${added === 1 ? "" : "s"}`);
          }
          if (paused > 0) {
            parts.push(
              `paused ${paused} reminder${paused === 1 ? "" : "s"}`
            );
          }
          if (hideSkip) {
            Alert.alert("Home updated", `${parts.join(", ")}.`);
            closeSheet();
          } else {
            finishAfterSchedule("Home updated", `${parts.join(", ")}.`);
          }
        } else {
          closeSheet();
        }
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
      let title = "You're set";
      let message = "Those routines are already on your schedule.";
      if (added > 0) {
        title = "Schedule ready";
        message =
          skipped > 0
            ? `Added ${added} tasks. ${skipped} were already tracked.`
            : `Added ${added} tasks for this home.`;
      } else if (added === 0 && skipped === 0) {
        title = "You're set";
        message = "Your home details are saved.";
      }
      if (hideSkip) {
        Alert.alert(title, message);
        closeSheet();
      } else {
        finishAfterSchedule(title, message);
      }
    } finally {
      setSaving(false);
    }
  };

  const questionCount = 10 + (saltNeeded ? 1 : 0);

  const footerLink = (
    label: string,
    onPress: () => void,
    accessibilityLabel?: string
  ) => (
    <Pressable
      onPress={onPress}
      disabled={saving}
      hitSlop={8}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: saving }}
      style={[styles.footerLink, saving && styles.footerLinkDisabled]}
    >
      <Text style={[styles.footerLinkText, { color: colors.primary }]}>
        {label}
      </Text>
    </Pressable>
  );

  const firstRunExits = hideSkip
    ? footerLink("Cancel", handleRequestClose)
    : (
        <>
          {footerLink(
            "Join a HomeShare",
            () => void handleJoinHousehold(),
            "Skip setup and join someone else's home"
          )}
          {footerLink("Skip for now", () => void handleSkip())}
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
        <View style={styles.footerLinks}>{firstRunExits}</View>
      </View>
    ) : phase === "questions" ? (
      <View style={styles.footerInner}>
        <Button
          label={
            hideSkip
              ? "See what this house needs"
              : saving
                ? "Saving…"
                : "Continue"
          }
          onPress={() => void handleContinueFromQuestions()}
          disabled={!canContinueQuestions || saving}
          accessibilityLabel="Continue"
        />
        <View style={styles.footerLinks}>
          {footerLink("Back", () => setPhase("address"))}
        </View>
      </View>
    ) : phase === "equipment" ? (
      <View style={styles.footerInner}>
        <Button
          label={saving ? "Loading…" : "See what this house needs"}
          onPress={() => void handleContinueFromEquipment()}
          disabled={saving}
          accessibilityLabel="Continue to suggested schedule"
        />
        <View style={styles.footerLinks}>
          {footerLink("Skip equipment", () => void handleContinueFromEquipment())}
          {footerLink("Back", () => setPhase("questions"))}
        </View>
      </View>
    ) : phase === "hints" ? (
      <View style={styles.footerInner}>
        <Button
          label={
            saving
              ? "Adding…"
              : `Add ${pendingHints.filter((h) => h.selected).length} reminders`
          }
          onPress={() => void applySelectedHints()}
          disabled={
            saving || pendingHints.filter((h) => h.selected).length === 0
          }
          accessibilityLabel="Add selected equipment reminders"
        />
        <View style={styles.footerLinks}>
          {footerLink("Skip reminders", skipHintsAndFinish)}
        </View>
      </View>
    ) : phase === "homeshare" ? (
      <View style={styles.footerInner}>
        <Button
          label="Invite someone"
          onPress={finishHomeShareInvite}
          accessibilityLabel="Invite someone with HomeShare"
        />
        <Button
          label="I have an invite code"
          variant="ghost"
          onPress={finishHomeShareJoin}
          accessibilityLabel="Join a HomeShare with a code"
        />
        <View style={styles.footerLinks}>
          {footerLink("Done for now", finishHomeShareSkip)}
        </View>
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
        <View style={styles.footerLinks}>
          {footerLink("Back", () =>
            setPhase(hideSkip ? "questions" : "equipment")
          )}
        </View>
      </View>
    );

  const sheetTitle =
    phase === "confirm"
      ? isReconcile
        ? "What changed"
        : "Here's what this house needs"
      : phase === "equipment"
        ? "Key equipment"
        : phase === "hints"
          ? "Equipment reminders"
          : phase === "homeshare"
            ? "HomeShare"
            : "Set up your home";

  return (
    <HearthSheet
      visible={sheetVisible}
      onClose={handleRequestClose}
      onDismissed={() => {
        onClose();
        if (hideSkip) return;
        const action = finishActionRef.current ?? "done";
        finishActionRef.current = null;
        // Let the setup Modal fully leave the native hierarchy before opening
        // another Modal (HomeShare / Plus), or iOS can leave an invisible
        // touch-blocking overlay.
        setTimeout(() => {
          onFirstRunFinished?.(action);
        }, 320);
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
            {hideSkip ? "1 of 3 · Address" : "1 of 5 · Address"}
          </Text>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            Start with where you live. We'll use this for weather, seasons, and
            your schedule. If someone already set up this home, join their
            HomeShare instead.
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
            {hideSkip
              ? `2 of 3 · Home systems · ${answered} of ${questionCount} answered`
              : `2 of 5 · Home systems · ${answered} of ${questionCount} answered`}
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
      ) : phase === "equipment" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.progress, { color: colors.textSecondary }]}>
            3 of 5 · Equipment
          </Text>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            Add key systems so we can suggest reminders. You can skip this and
            add equipment later.
          </Text>
          <View style={styles.chipWrap}>
            {SETUP_EQUIPMENT_TYPES.map((type) => {
              const selected = sessionEquipment.some(
                (e) => e.equipment_type === type
              );
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected
                        ? colors.primary + "14"
                        : colors.fieldFill,
                    },
                  ]}
                  onPress={() => void toggleSessionEquipmentType(type)}
                  disabled={saving}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected, disabled: saving }}
                  accessibilityLabel={EQUIPMENT_TYPE_LABELS[type]}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      { color: selected ? colors.primary : colors.text },
                    ]}
                  >
                    {EQUIPMENT_TYPE_LABELS[type]}
                  </Text>
                  <Ionicons
                    name={selected ? "checkmark-circle" : "add-circle-outline"}
                    size={18}
                    color={selected ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : phase === "hints" ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            Suggested reminders for the equipment you just added. Uncheck any
            you don’t want.
          </Text>
          {pendingHints.map((row, index) => (
            <TouchableOpacity
              key={row.key}
              style={[
                styles.taskRow,
                {
                  borderColor: row.selected ? colors.primary : colors.border,
                  backgroundColor: row.selected
                    ? colors.primary + "12"
                    : "transparent",
                },
              ]}
              onPress={() => {
                setPendingHints((prev) => {
                  const next = [...prev];
                  next[index] = {
                    ...next[index],
                    selected: !next[index].selected,
                  };
                  return next;
                });
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: row.selected }}
              accessibilityLabel={`${row.item.title} for ${row.equipmentName}`}
            >
              <View style={styles.taskText}>
                <Text style={[styles.taskTitle, { color: colors.text }]}>
                  {row.item.title}
                </Text>
                <Text
                  style={[styles.taskMeta, { color: colors.textSecondary }]}
                >
                  {row.equipmentName} ·{" "}
                  {formatIntervalDays(row.item.interval_days)}
                </Text>
              </View>
              <Ionicons
                name={row.selected ? "checkmark-circle" : "ellipse-outline"}
                size={22}
                color={row.selected ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : phase === "homeshare" ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.progress, { color: colors.textSecondary }]}>
            5 of 5 · Share this home
          </Text>
          {pendingFinishCopy ? (
            <Text style={[styles.readyBanner, { color: colors.text }]}>
              {pendingFinishCopy.message}
            </Text>
          ) : null}
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            HomeShare lets people who live here use the same schedule — complete
            reminders, see the same address and equipment, and keep one home in
            sync.
          </Text>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            Invite with a code (HomeKeep + to create). Joining with a code is
            free. You can always do this later in Settings → HomeShare.
          </Text>
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.progress, { color: colors.textSecondary }]}>
            {hideSkip ? "3 of 3 · Schedule" : "4 of 5 · Schedule"}
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
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipLabel: {
    ...DesignSystem.typography.callout,
    fontWeight: "600",
  },
  readyBanner: {
    ...DesignSystem.typography.callout,
    fontWeight: "600",
    marginBottom: DesignSystem.spacing.md,
    lineHeight: 22,
  },
  footerInner: {
    paddingTop: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.lg,
  },
  footerLink: {
    paddingVertical: DesignSystem.spacing.xs,
    minHeight: DesignSystem.components.minTouchTarget,
    justifyContent: "center",
  },
  footerLinkDisabled: {
    opacity: 0.55,
  },
  footerLinkText: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
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
