import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  FadeIn,
  FadeInLeft,
  FadeInRight,
} from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { useNotifications } from "../../../context/NotificationContext";
import { useSubscription } from "../../../context/SubscriptionContext";
import { useHaptics, useReducedMotion } from "../../../hooks";
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
  isHeatPumpFamily,
  diffHomeSchedule,
  HomeScheduleDiff,
  isValidYearBuilt,
  FireplaceType,
} from "../../../data/maintenancePlans";
import { MaintenanceService } from "../../../services/maintenanceService";
import {
  CategoryKey,
  HOME_MAINTENANCE_CATEGORIES,
} from "../../../types/maintenance";
import {
  InlineChoice,
  OptionGrid,
  OptionTile,
  SetupLead,
  SetupProgress,
  SetupSection,
} from "./setupChrome";
import { SetupWelcome } from "./SetupWelcome";
import { YearBuiltPicker } from "./YearBuiltPicker";
import { SetupNotify } from "./SetupNotify";
import {
  ScheduleGroup,
  ScheduleSummary,
  categoryIcon,
  formatDuration,
} from "./ScheduleReview";
import {
  FIREPLACE_FUEL_CHOICES,
  HEAT_SOURCE_TILES,
  HOME_HAS_GROUPS,
  HomeHasKey,
  POOL_SANITIZER_CHOICES,
  PoolSanitizer,
  PROPERTY_TYPE_TILES,
  savedHomeHasKeys,
} from "./homeSetupOptions";
import {
  HomeAddressFields,
  HomeAddressFieldsHandle,
} from "../home-address-onboarding/HomeAddressFields";
import { EquipmentManualService } from "../../../services/EquipmentManualService";
import {
  EquipmentType,
  EQUIPMENT_TYPE_LABELS,
  equipmentTypeIcon,
} from "../../../types/equipmentManual";
import {
  hintsForEquipmentName,
} from "../../../data/equipmentTaskHints";
import {
  buildRoutinePayloadsFromItems,
} from "../../../data/maintenancePlans";
import type { MaintenancePlanItemTemplate } from "../../../data/maintenancePlans/types";

type Phase =
  | "welcome"
  | "address"
  | "basics"
  | "features"
  | "equipment"
  | "confirm"
  | "hints"
  | "notify"
  | "homeshare";

const FIRST_RUN_STEPS: Phase[] = [
  "address",
  "basics",
  "features",
  "equipment",
  "confirm",
  "homeshare",
];
const EDIT_STEPS: Phase[] = ["address", "basics", "features", "confirm"];
const PHASE_ORDER: Phase[] = [
  "welcome",
  "address",
  "basics",
  "features",
  "equipment",
  "confirm",
  "hints",
  "notify",
  "homeshare",
];
const STEP_EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

const FURNACE_HEAT: HomeHeatSource[] = ["gas_furnace", "oil", "propane"];

/** Equipment tiles that fit this home's answers, heating first. */
function setupEquipmentTypes(
  heatSources: HomeHeatSource[],
  homeHas: HomeHasKey[]
): EquipmentType[] {
  const types: EquipmentType[] = [];
  if (heatSources.some((source) => FURNACE_HEAT.includes(source))) {
    types.push("furnace");
  }
  if (heatSources.some(isHeatPumpFamily)) types.push("heat_pump");
  types.push("ac", "water_heater", "fridge", "dishwasher", "washer", "dryer");
  if (homeHas.includes("hasWaterSoftener")) types.push("water_softener");
  if (homeHas.includes("hasLawn")) types.push("lawn_mower");
  return types;
}

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

function taskMeta(item: MaintenancePlanItemTemplate): string {
  return `${formatIntervalDays(item.interval_days)} · ${formatDuration(
    item.estimated_duration_minutes
  )}`;
}

function toggleMask(
  setMask: React.Dispatch<React.SetStateAction<boolean[]>>,
  index: number
) {
  setMask((prev) => {
    const next = [...prev];
    next[index] = !next[index];
    return next;
  });
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
  const basicsScrollRef = useRef<ScrollView>(null);
  const [addressCanSubmit, setAddressCanSubmit] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(visible);
  const finishActionRef = useRef<"invite" | "join" | "done" | null>(null);

  const [phase, setPhaseState] = useState<Phase>(
    hideSkip ? "address" : "welcome"
  );
  // 0 = no slide, so the first step doesn't animate under the sheet's own entrance.
  const [stepDirection, setStepDirection] = useState<-1 | 0 | 1>(0);
  const [propertyType, setPropertyType] = useState<HomePropertyType | null>(
    null
  );
  const [heatSources, setHeatSources] = useState<HomeHeatSource[]>([]);
  const [yearBuiltText, setYearBuiltText] = useState("");
  const [homeHas, setHomeHas] = useState<HomeHasKey[]>([]);
  const [poolSanitizer, setPoolSanitizer] = useState<PoolSanitizer | null>(
    null
  );
  const [fireplaceFuel, setFireplaceFuel] = useState<
    Exclude<FireplaceType, "none"> | null
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

  const reducedMotion = useReducedMotion();
  const { triggerLight, triggerSuccess } = useHaptics();
  const { permissionStatus, syncPushToken } = useNotifications();
  const { isPlus } = useSubscription();
  const shouldAskNotifications =
    !hideSkip && permissionStatus.status === "undetermined";

  const setPhase = (next: Phase) => {
    if (next === phase) return;
    triggerLight();
    setStepDirection(
      PHASE_ORDER.indexOf(next) > PHASE_ORDER.indexOf(phase) ? 1 : -1
    );
    setPhaseState(next);
  };

  const resetPhase = () => {
    setStepDirection(0);
    setPhaseState(hideSkip ? "address" : "welcome");
  };

  const stepEntering =
    stepDirection === 0
      ? undefined
      : reducedMotion
        ? FadeIn.duration(160)
        : (stepDirection > 0 ? FadeInRight : FadeInLeft)
            .duration(340)
            .easing(STEP_EASE_OUT);

  useEffect(() => {
    setSheetVisible(visible);
  }, [visible]);

  // Hydrate once per open. Saving the address updates the profile and must
  // not snap the wizard back to step 1.
  useEffect(() => {
    if (!visible) {
      resetPhase();
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
    setPropertyType(home?.propertyType ?? null);
    setHeatSources(homeHeatSources(home));
    setYearBuiltText(home?.yearBuilt ? String(home.yearBuilt) : "");
    setHomeHas(savedHomeHasKeys(home));
    setPoolSanitizer(
      home?.hasPool !== true
        ? null
        : home.poolUsesSaltChlorination === true
          ? "salt"
          : home.poolUsesSaltChlorination === false
            ? "chlorine"
            : null
    );
    const savedFireplace = home?.fireplaceType;
    setFireplaceFuel(
      savedFireplace && savedFireplace !== "none" ? savedFireplace : null
    );
    setSessionEquipment([]);
    setPendingHints([]);
    setPendingFinishCopy(null);
    resetPhase();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the sheet opens
  }, [visible]);

  const toggleHeatSource = (source: HomeHeatSource) => {
    setHeatSources((prev) =>
      prev.includes(source)
        ? prev.filter((item) => item !== source)
        : [...prev, source]
    );
  };

  const has = (key: HomeHasKey) => homeHas.includes(key);

  const toggleHomeHas = (key: HomeHasKey) => {
    setHomeHas((prev) =>
      prev.includes(key)
        ? prev.filter((item) => item !== key)
        : [...prev, key]
    );
    if (key === "fireplace") setFireplaceFuel(null);
    if (key === "hasPool") setPoolSanitizer(null);
  };

  const trimmedYearBuilt = yearBuiltText.trim();
  const parsedYearBuilt = trimmedYearBuilt
    ? Number(trimmedYearBuilt)
    : undefined;
  const yearBuiltValid =
    parsedYearBuilt === undefined || isValidYearBuilt(parsedYearBuilt);
  const yearBuilt = yearBuiltValid ? parsedYearBuilt : undefined;

  const canContinueBasics =
    yearBuiltValid && propertyType !== null && heatSources.length > 0;
  const needsFireplaceFuel = homeHas.includes("fireplace") && !fireplaceFuel;
  const needsPoolSanitizer = homeHas.includes("hasPool") && !poolSanitizer;
  const canContinueFeatures = !needsFireplaceFuel && !needsPoolSanitizer;

  // Unselected tiles on the "what's here" step are explicit "no" answers.
  const draftSystems = useMemo<HomeSystems | null>(() => {
    if (!canContinueBasics || !canContinueFeatures) return null;
    const yes = (key: HomeHasKey) => homeHas.includes(key);
    return {
      hasLawn: yes("hasLawn"),
      propertyType: propertyType!,
      heatSource: heatSources[0],
      heatSources,
      hasHeatPump: heatSources.some(isHeatPumpFamily),
      hasAirExchanger: yes("hasAirExchanger"),
      hasWaterSoftener: yes("hasWaterSoftener"),
      hasRefrigeratorWaterFilter: yes("hasRefrigeratorWaterFilter"),
      hasVentHoodFilters: yes("hasVentHoodFilters"),
      hasSeptic: yes("hasSeptic"),
      hasPool: yes("hasPool"),
      hasSpa: yes("hasSpa"),
      poolUsesSaltChlorination: yes("hasPool") && poolSanitizer === "salt",
      yearBuilt,
      hasSumpPump: yes("hasSumpPump"),
      hasWell: yes("hasWell"),
      hasIrrigation: yes("hasIrrigation"),
      hasGarageDoor: yes("hasGarageDoor"),
      hasGenerator: yes("hasGenerator"),
      hasSolar: yes("hasSolar"),
      hasEvCharger: yes("hasEvCharger"),
      hasDeck: yes("hasDeck"),
      fireplaceType:
        yes("fireplace") && fireplaceFuel ? fireplaceFuel : "none",
    };
  }, [
    canContinueBasics,
    canContinueFeatures,
    homeHas,
    propertyType,
    heatSources,
    poolSanitizer,
    yearBuilt,
    fireplaceFuel,
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
    if (phase === "welcome" || phase === "address") {
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
    // Setup already finished — just dismiss.
    if (phase === "notify" || phase === "homeshare") {
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
      if (ok) setPhase("basics");
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

  /** After the schedule is saved: notifications ask (if needed), then HomeShare. */
  const goToFinishSteps = (title: string, message: string) => {
    if (shouldAskNotifications) {
      setPendingFinishCopy({ title, message });
      setPhase("notify");
      return;
    }
    goToHomeShareStep(title, message);
  };

  const finishNotifyStep = async (enable: boolean) => {
    if (saving) return;
    if (enable) {
      setSaving(true);
      try {
        const registered = await syncPushToken();
        if (registered) triggerSuccess();
      } finally {
        setSaving(false);
      }
    }
    if (!canOfferInvite) {
      closeSheet("done");
      return;
    }
    // The ready banner already showed on the notify step.
    setPendingFinishCopy(null);
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
    goToFinishSteps(title, message);
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
      goToFinishSteps(copy.title, copy.message);
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
    goToFinishSteps(copy.title, copy.message);
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

  const handleContinueFromFeatures = async () => {
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

  const steps = hideSkip ? EDIT_STEPS : FIRST_RUN_STEPS;
  const stepIndex = Math.max(
    0,
    steps.indexOf(phase === "hints" || phase === "notify" ? "confirm" : phase)
  );
  const progress = (
    <SetupProgress total={steps.length} current={stepIndex} />
  );

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
            "I have an invite code",
            () => void handleJoinHousehold(),
            "Skip setup and join someone else's home with an invite code"
          )}
          {footerLink("Skip for now", () => void handleSkip())}
        </>
      );

  const footer =
    phase === "welcome" ? (
      <View style={styles.footerInner}>
        <Button
          label="Get started"
          onPress={() => setPhase("address")}
          disabled={saving}
          accessibilityLabel="Get started with home setup"
        />
        <View style={styles.footerLinks}>{firstRunExits}</View>
      </View>
    ) : phase === "address" ? (
      <View style={styles.footerInner}>
        <Button
          label={saving ? "Saving…" : "Continue"}
          onPress={() => void handleContinueFromAddress()}
          disabled={!addressCanSubmit || saving}
          accessibilityLabel="Save address and continue"
        />
        <View style={styles.footerLinks}>{firstRunExits}</View>
      </View>
    ) : phase === "basics" ? (
      <View style={styles.footerInner}>
        <Button
          label="Continue"
          onPress={() => setPhase("features")}
          disabled={!canContinueBasics}
          accessibilityLabel="Continue"
        />
        <View style={styles.footerLinks}>
          {footerLink("Back", () => setPhase("address"))}
        </View>
      </View>
    ) : phase === "features" ? (
      <View style={styles.footerInner}>
        <Button
          label={
            saving
              ? "Saving…"
              : hideSkip
                ? "Review schedule"
                : homeHas.length === 0
                  ? "None of these"
                  : "Continue"
          }
          onPress={() => void handleContinueFromFeatures()}
          disabled={!canContinueFeatures || saving}
          accessibilityLabel="Continue"
        />
        <View style={styles.footerLinks}>
          {footerLink("Back", () => setPhase("basics"))}
        </View>
      </View>
    ) : phase === "equipment" ? (
      <View style={styles.footerInner}>
        <Button
          label={
            saving
              ? "Loading…"
              : sessionEquipment.length === 0
                ? "Skip for now"
                : "Continue"
          }
          onPress={() => void handleContinueFromEquipment()}
          disabled={saving}
          accessibilityLabel="Continue to suggested schedule"
        />
        <View style={styles.footerLinks}>
          {footerLink("Back", () => setPhase("features"))}
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
    ) : phase === "notify" ? (
      <View style={styles.footerInner}>
        <Button
          label={saving ? "Turning on…" : "Turn on notifications"}
          onPress={() => void finishNotifyStep(true)}
          disabled={saving}
          accessibilityLabel="Turn on notifications"
        />
        <View style={styles.footerLinks}>
          {footerLink("Not now", () => void finishNotifyStep(false))}
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
            setPhase(hideSkip ? "features" : "equipment")
          )}
        </View>
      </View>
    );

  const SHEET_TITLES: Record<Phase, string> = {
    welcome: "",
    address: "Where's your home?",
    basics: "About your home",
    features: "What's at your home?",
    equipment: "Track your equipment",
    confirm: isReconcile ? "What changed" : "Your schedule",
    hints: "Equipment reminders",
    notify: "Notifications",
    homeshare: "Share this home",
  };
  const sheetTitle = SHEET_TITLES[phase];

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
      <View style={styles.stage}>
        {phase !== "welcome" ? (
          <Animated.View
            entering={
              reducedMotion || stepDirection === 0
                ? undefined
                : FadeIn.duration(240)
            }
          >
            {progress}
          </Animated.View>
        ) : null}
        <Animated.View
          key={phase}
          entering={stepEntering}
          style={styles.stage}
        >
          {phase === "welcome" ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.welcomeScroll}
            >
              <SetupWelcome />
            </ScrollView>
          ) : phase === "address" ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              <SetupLead>Used for local seasons and weather.</SetupLead>
              <HomeAddressFields
                ref={addressRef}
                active={sheetVisible && phase === "address"}
                onCanSubmitChange={setAddressCanSubmit}
              />
            </ScrollView>
          ) : phase === "basics" ? (
            <ScrollView
              ref={basicsScrollRef}
              showsVerticalScrollIndicator={false}
            >
              <SetupSection title="Type of home">
                <OptionGrid>
                  {PROPERTY_TYPE_TILES.map((option) => (
                    <OptionTile
                      key={option.id}
                      icon={option.icon}
                      label={option.label}
                      selected={propertyType === option.id}
                      onPress={() => setPropertyType(option.id)}
                      multiple={false}
                    />
                  ))}
                </OptionGrid>
              </SetupSection>

              <SetupSection title="Heating" hint="Select all that apply.">
                <OptionGrid>
                  {HEAT_SOURCE_TILES.map((option) => (
                    <OptionTile
                      key={option.id}
                      icon={option.icon}
                      label={option.label}
                      selected={heatSources.includes(option.id)}
                      onPress={() => toggleHeatSource(option.id)}
                    />
                  ))}
                </OptionGrid>
              </SetupSection>

              <SetupSection
                title="Year built"
                hint="Optional. Older homes get a few extra safety checks."
              >
                <YearBuiltPicker
                  value={yearBuilt ?? null}
                  onChange={(year) =>
                    setYearBuiltText(year === null ? "" : String(year))
                  }
                  onOpen={() =>
                    setTimeout(() => {
                      basicsScrollRef.current?.scrollToEnd({ animated: true });
                    }, 60)
                  }
                />
              </SetupSection>
            </ScrollView>
          ) : phase === "features" ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <SetupLead>Tap everything you have. We'll skip the rest.</SetupLead>
              {HOME_HAS_GROUPS.map((group) => (
                <SetupSection key={group.title} title={group.title}>
                  <OptionGrid>
                    {group.items.map((item) => (
                      <OptionTile
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        selected={has(item.id)}
                        onPress={() => toggleHomeHas(item.id)}
                      />
                    ))}
                  </OptionGrid>
                  {group.items.some((item) => item.id === "fireplace") &&
                  has("fireplace") ? (
                    <InlineChoice
                      label="Fireplace fuel"
                      options={FIREPLACE_FUEL_CHOICES}
                      value={fireplaceFuel}
                      onChange={setFireplaceFuel}
                    />
                  ) : null}
                  {group.items.some((item) => item.id === "hasPool") &&
                  has("hasPool") ? (
                    <InlineChoice
                      label="Pool water"
                      options={POOL_SANITIZER_CHOICES}
                      value={poolSanitizer}
                      onChange={setPoolSanitizer}
                    />
                  ) : null}
                </SetupSection>
              ))}
            </ScrollView>
          ) : phase === "equipment" ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <SetupLead>Add what you have and we'll suggest reminders for it.</SetupLead>
              <OptionGrid>
                {setupEquipmentTypes(heatSources, homeHas).map((type) => (
                  <OptionTile
                    key={type}
                    icon={equipmentTypeIcon(type)}
                    label={EQUIPMENT_TYPE_LABELS[type]}
                    selected={sessionEquipment.some(
                      (e) => e.equipment_type === type
                    )}
                    onPress={() => void toggleSessionEquipmentType(type)}
                  />
                ))}
              </OptionGrid>
              <Text style={[styles.footnote, { color: colors.textSecondary }]}>
                You can add model numbers, manuals, and more later.
              </Text>
            </ScrollView>
          ) : phase === "hints" ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <SetupLead>Suggested for the equipment you added.</SetupLead>
              {sessionEquipment.map((equipment) => {
                const rows = pendingHints
                  .map((row, index) => ({ row, index }))
                  .filter(({ row }) => row.equipmentId === equipment.id);
                if (rows.length === 0) return null;
                return (
                  <ScheduleGroup
                    key={equipment.id}
                    title={equipment.name}
                    icon={equipmentTypeIcon(equipment.equipment_type)}
                    initiallyOpen
                    rows={rows.map(({ row, index }) => ({
                      key: row.key,
                      title: row.item.title,
                      meta: taskMeta(row.item),
                      selected: row.selected,
                      onToggle: () =>
                        setPendingHints((prev) => {
                          const next = [...prev];
                          next[index] = {
                            ...next[index],
                            selected: !next[index].selected,
                          };
                          return next;
                        }),
                      accessibilityLabel: `${row.item.title} for ${row.equipmentName}`,
                    }))}
                  />
                );
              })}
            </ScrollView>
          ) : phase === "notify" ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {pendingFinishCopy ? (
                <View
                  style={[
                    styles.readyCard,
                    { backgroundColor: colors.success + "14" },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.success}
                  />
                  <Text style={[styles.readyBanner, { color: colors.text }]}>
                    {pendingFinishCopy.message}
                  </Text>
                </View>
              ) : null}
              <SetupNotify isPlus={isPlus} />
            </ScrollView>
          ) : phase === "homeshare" ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {pendingFinishCopy ? (
                <View
                  style={[
                    styles.readyCard,
                    { backgroundColor: colors.success + "14" },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.success}
                  />
                  <Text style={[styles.readyBanner, { color: colors.text }]}>
                    {pendingFinishCopy.message}
                  </Text>
                </View>
              ) : null}
              <SetupLead>
                Live with someone? Share this home so you both see the same tasks
                and can check them off.
              </SetupLead>
              <Text style={[styles.footnote, { color: colors.textSecondary }]}>
                Sending an invite needs HomeKeep+. Joining is free. You can also do
                this later in Settings.
              </Text>
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {isReconcile && reconcileDiff ? (
                <>
                  <SetupLead>
                    Based on your changes. Uncheck anything you want to keep as is.
                  </SetupLead>
                  {reconcileDiff.toAdd.length > 0 ? (
                    <ScheduleGroup
                      title="New tasks"
                      icon="add-circle-outline"
                      initiallyOpen
                      rows={reconcileDiff.toAdd.map((item, index) => ({
                        key: `add-${item.source_plan_id}-${item.title}-${index}`,
                        title: item.title,
                        meta: taskMeta(item),
                        selected: !!addMask[index],
                        onToggle: () => toggleMask(setAddMask, index),
                        accessibilityLabel: `Add ${item.title}`,
                      }))}
                    />
                  ) : null}
                  {reconcileDiff.toPause.length > 0 ? (
                    <ScheduleGroup
                      title="No longer applies"
                      icon="pause-circle-outline"
                      tint={colors.warning}
                      selectedIcon="pause-circle"
                      initiallyOpen
                      rows={reconcileDiff.toPause.map((item, index) => ({
                        key: `pause-${item.id}`,
                        title: item.title,
                        meta: `${formatIntervalDays(item.interval_days)} · Pausing keeps its history`,
                        selected: !!pauseMask[index],
                        onToggle: () => toggleMask(setPauseMask, index),
                        accessibilityLabel: `Pause ${item.title}`,
                      }))}
                    />
                  ) : null}
                </>
              ) : (
                <>
                  <ScheduleSummary items={selectedItems} />
                  <SetupLead>Tap a group to review or turn tasks off.</SetupLead>
                  {confirmSections.map((section) => (
                    <ScheduleGroup
                      key={section.key}
                      title={section.title}
                      icon={categoryIcon(section.key)}
                      rows={section.rows.map(({ item, index }) => ({
                        key: `${item.source_plan_id}-${item.title}-${index}`,
                        title: item.title,
                        meta: taskMeta(item),
                        selected: !!selectedMask[index],
                        onToggle: () => toggleMask(setSelectedMask, index),
                      }))}
                    />
                  ))}
                </>
              )}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </HearthSheet>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    minHeight: 0,
  },
  welcomeScroll: {
    flexGrow: 1,
    justifyContent: "center",
  },
  footnote: {
    ...DesignSystem.typography.caption,
    lineHeight: 18,
    marginTop: DesignSystem.spacing.md,
  },
  readyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    marginBottom: DesignSystem.spacing.lg,
  },
  readyBanner: {
    ...DesignSystem.typography.callout,
    fontWeight: "600",
    lineHeight: 22,
    flex: 1,
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
});
