import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  ScrollView,
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  Platform,
  Pressable,
  InputAccessoryView,
  useWindowDimensions,
  TextInput as RNTextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHaptics } from "../../../../hooks/useHaptics";
import { useDevice } from "../../../../hooks";
import { useTasks } from "../../../../context/TasksContext";
import { useTheme } from "../../../../context/ThemeContext";
import { DesignSystem } from "../../../../theme/designSystem";
import { HearthSheet } from "../../../ui/HearthSheet";
import { FormField } from "./FormField";
import { CategorySelector } from "./CategorySelector";
import { PrioritySelector } from "./PrioritySelector";
import { IntervalSelector } from "./IntervalSelector";
import { StartDateSelector } from "./StartDateSelector";
import { SubmitButton } from "./SubmitButton";
import {
  categories,
  priorities,
} from "../../../Dashboard/modals/create-task-modal/data";
import {
  CreateMaintenanceRoutineData,
  MaintenanceCategory,
  Priority,
} from "../../../../types/maintenance";

const ESTIMATED_DURATION_INPUT_ACCESSORY_ID =
  "createTaskEstimatedDurationInputAccessory";

// CreateTaskModalProps
interface CreateTaskModalProps {
  onClose: () => void;
  onTaskCreated: () => void;
  // Optional edit mode support
  initialValues?: Partial<MaintenanceRoutineForm> & { id?: string };
  isEdit?: boolean;
}

// MaintenanceRoutineForm
interface MaintenanceRoutineForm {
  title: string;
  category: MaintenanceCategory;
  interval_days: number;
  startDate: Date;
  priority: Priority;
  estimated_duration_minutes: number;
  description?: string;
}

function getIntervalLabel(interval: number): string {
  switch (interval) {
    case 0:
      return "day";
    case 7:
      return "week";
    case 30:
      return "month";
    case 90:
      return "quarter";
    case 365:
      return "year";
    default:
      return "day";
  }
}

// CreateTaskModal component
export function CreateTaskModal({
  onClose,
  onTaskCreated,
  initialValues,
  isEdit = false,
}: CreateTaskModalProps) {
  const { triggerLight, triggerMedium } = useHaptics();
  const { createTask, updateTask } = useTasks();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const { height: windowHeight } = useWindowDimensions();
  const sheetMaxHeight = windowHeight * 0.85;
  /** Reserve space for sheet chrome so ScrollView doesn't collapse. */
  const sheetChromeOverhead =
    DesignSystem.spacing.sm +
    4 +
    DesignSystem.spacing.md * 2 +
    56 +
    DesignSystem.spacing.lg * 2 +
    DesignSystem.spacing.md;
  const scrollViewportMaxHeight = Math.max(
    280,
    sheetMaxHeight - sheetChromeOverhead
  );
  const descriptionFieldRef = useRef<RNTextInput | null>(null);
  const durationFieldRef = useRef<RNTextInput | null>(null);
  const formScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const scrollTitleFieldIntoView = useCallback(() => {
    /** Title sits at the top of the sheet ScrollView; after the keyboard opens,
     * iOS can clip it unless we scroll to offset 0 and let inset adjustment land. */
    setTimeout(() => {
      formScrollRef.current?.scrollTo({ y: 0, animated: true });
    }, 50);
  }, []);

  const [form, setForm] = useState<MaintenanceRoutineForm>({
    title: initialValues?.title ?? "",
    category: (initialValues?.category ?? "GENERAL") as MaintenanceCategory,
    interval_days: initialValues?.interval_days ?? 30,
    startDate: (() => {
      const base = initialValues?.startDate
        ? new Date(initialValues.startDate)
        : new Date();
      base.setHours(12, 0, 0, 0);
      return base;
    })(),
    priority: (initialValues?.priority ?? "medium") as Priority,
    estimated_duration_minutes: initialValues?.estimated_duration_minutes ?? 30,
    description: initialValues?.description ?? "",
  });

  // Separate state for interval management
  const [selectedInterval, setSelectedInterval] = useState<number>(
    // seed from existing interval if editing
    (() => {
      const days = initialValues?.interval_days ?? 30;
      // Snap to common presets if divisible
      const presets = [7, 30, 90, 365];
      for (const p of presets) {
        if (days % p === 0) return p;
      }
      return 0; // custom
    })()
  );
  const [intervalValue, setIntervalValue] = useState<number>(
    (() => {
      const days = initialValues?.interval_days ?? 30;
      if (selectedInterval === 0) return days;
      return Math.max(1, Math.round(days / (selectedInterval || 1)));
    })()
  );

  const [errors, setErrors] = useState<
    Partial<{ [K in keyof MaintenanceRoutineForm]: string }>
  >({});

  const [dismissChromeToken, setDismissChromeToken] = useState(0);
  const dismissFormChrome = useCallback(() => {
    Keyboard.dismiss();
    setDismissChromeToken((t) => t + 1);
  }, []);

  const capitalizeFirst = (input: string) => {
    if (!input) return "";
    return input.replace(/^\s*([a-zA-Z])/, (m, p1) => p1.toUpperCase());
  };

  /** Matches interval math in handleSubmit */
  const getEffectiveIntervalDays = (): number => {
    if (selectedInterval === 0) {
      return intervalValue;
    }
    return selectedInterval * intervalValue;
  };

  const validateForm = (): { ok: boolean; firstError?: string } => {
    const newErrors: Partial<{ [K in keyof MaintenanceRoutineForm]: string }> =
      {};

    if (!form.title.trim()) {
      newErrors.title = "Task title is required";
    }

    if (!form.category) {
      newErrors.category = "Please select a category";
    }

    if (
      !form.estimated_duration_minutes ||
      form.estimated_duration_minutes <= 0
    ) {
      newErrors.estimated_duration_minutes = "Duration must be greater than 0";
    }

    const effectiveDays = getEffectiveIntervalDays();
    if (!effectiveDays || effectiveDays <= 0) {
      newErrors.interval_days = "Interval must be greater than 0";
    }

    setErrors(newErrors);
    const firstError = Object.values(newErrors).find(
      (v): v is string => Boolean(v)
    );
    return {
      ok: Object.keys(newErrors).length === 0,
      firstError,
    };
  };

  const handleSubmit = async () => {
    const { ok, firstError } = validateForm();
    if (!ok) {
      triggerMedium();
      Alert.alert(
        "Check your task",
        firstError ?? "Please fix the highlighted fields and try again."
      );
      return;
    }

    try {
      const actualIntervalDays = getEffectiveIntervalDays();

      // Ensure we persist start_date at local noon (stable day boundary)
      const startAtNoon = new Date(form.startDate);
      startAtNoon.setHours(12, 0, 0, 0);

      const taskData: CreateMaintenanceRoutineData = {
        title: form.title.trim(),
        category: form.category,
        priority: form.priority,
        estimated_duration_minutes: form.estimated_duration_minutes,
        interval_days: actualIntervalDays,
        start_date: startAtNoon.toISOString(),
        description: form.description?.trim() || undefined,
      };

      if (isEdit && initialValues?.id) {
        const result = await updateTask(initialValues.id, taskData);
        if (result.success) {
          triggerLight();
          onTaskCreated();
        } else {
          Alert.alert("Error", result.error || "Failed to update task");
        }
        return;
      }

      const result = await createTask(taskData);

      if (result.success) {
        triggerLight();
        onTaskCreated();
      } else {
        Alert.alert("Error", result.error || "Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      Alert.alert("Error", "Failed to create task");
    }
  };

  const updateForm = (
    field: keyof MaintenanceRoutineForm,
    value: MaintenanceRoutineForm[keyof MaintenanceRoutineForm]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const isFormValid =
    Boolean(form.title.trim()) &&
    Boolean(form.category) &&
    form.estimated_duration_minutes > 0 &&
    getEffectiveIntervalDays() > 0;

  const summaryPreviewText = useMemo(() => {
    return `"${form.title}" will be scheduled every ${intervalValue} ${getIntervalLabel(selectedInterval)}${intervalValue > 1 ? "s" : ""} starting ${form.startDate.toLocaleDateString()}.`;
  }, [form.title, intervalValue, selectedInterval, form.startDate]);

  const scrollBottomPadding =
    insets.bottom + DesignSystem.spacing.xxxl + DesignSystem.spacing.md;

  const handleSheetClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <>
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={ESTIMATED_DURATION_INPUT_ACCESSORY_ID}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              alignItems: "center",
              paddingHorizontal: DesignSystem.spacing.md,
              paddingVertical: DesignSystem.spacing.sm,
              backgroundColor: colors.surface,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.border,
            }}
          >
            <TouchableOpacity
              onPress={dismissFormChrome}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text
                style={{
                  fontSize: DesignSystem.typography.bodyMedium.fontSize,
                  fontWeight: "600",
                  color: colors.primary,
                }}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
      <HearthSheet
        visible
        onClose={handleSheetClose}
        title={isEdit ? "Edit task" : "Add a task"}
        maxHeightRatio={0.85}
        accessibilityLabel={isEdit ? "Close edit task" : "Close add task"}
        contentStyle={{ paddingHorizontal: 0 }}
      >
        <ScrollView
          ref={formScrollRef}
          style={{ maxHeight: scrollViewportMaxHeight }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: DesignSystem.spacing.lg,
            paddingBottom: scrollBottomPadding,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          onScrollBeginDrag={dismissFormChrome}
        >
          <FormField
            label="Task Title"
            value={form.title}
            onChangeText={(text) => updateForm("title", text)}
            placeholder="e.g., Change air filter, Clean gutters..."
            error={errors.title}
            autoCapitalize="words"
            required
            returnKeyType="next"
            onSubmitEditing={() => descriptionFieldRef.current?.focus()}
            onFocusExtra={scrollTitleFieldIntoView}
          />

          <CategorySelector
            categories={categories}
            selectedCategory={form.category}
            dismissChromeToken={dismissChromeToken}
            onSelectCategory={(categoryId) => {
              updateForm("category", categoryId);
            }}
            error={errors.category}
          />

          <PrioritySelector
            priorities={priorities}
            selectedPriority={form.priority}
            dismissChromeToken={dismissChromeToken}
            onSelectPriority={(priorityId) => updateForm("priority", priorityId)}
          />

          <FormField
            ref={descriptionFieldRef}
            label="Instructions (Optional)"
            value={form.description || ""}
            onChangeText={(text) =>
              updateForm("description", capitalizeFirst(text))
            }
            placeholder="Add detailed instructions for this task..."
            multiline
            numberOfLines={3}
            autoCapitalize="sentences"
            blurOnSubmit={false}
          />

          <FormField
            ref={durationFieldRef}
            label="Estimated Duration (minutes)"
            value={form.estimated_duration_minutes.toString()}
            onChangeText={(text) => {
              const num = parseInt(text) || 0;
              setForm((prev) => ({
                ...prev,
                estimated_duration_minutes: num,
              }));
            }}
            placeholder="e.g., 30"
            keyboardType="numeric"
            inputAccessoryViewID={
              Platform.OS === "ios"
                ? ESTIMATED_DURATION_INPUT_ACCESSORY_ID
                : undefined
            }
            error={errors.estimated_duration_minutes?.toString()}
            required
            returnKeyType="done"
            onSubmitEditing={dismissFormChrome}
          />

          <IntervalSelector
            selectedInterval={selectedInterval}
            intervalValue={intervalValue}
            dismissChromeToken={dismissChromeToken}
            onSelectInterval={(interval: number) => setSelectedInterval(interval)}
            onIntervalValueChange={(value) => setIntervalValue(value)}
            error={errors.interval_days?.toString()}
          />

          <StartDateSelector
            startDate={form.startDate}
            dismissChromeToken={dismissChromeToken}
            onStartDateChange={(date) => updateForm("startDate", date)}
          />

          <Pressable onPress={dismissFormChrome}>
            <View
              style={[
                styles.summaryContainer,
                {
                  backgroundColor: colors.fieldFill,
                  borderColor: colors.border,
                },
                isTablet && {
                  padding: getResponsiveValue(
                    DesignSystem.spacing.md,
                    DesignSystem.spacing.lg,
                    DesignSystem.spacing.xl
                  ),
                },
              ]}
            >
              <Text
                style={[
                  styles.summaryTitle,
                  { color: colors.text },
                  isTablet && {
                    fontSize:
                      (styles.summaryTitle.fontSize ||
                        DesignSystem.typography.callout.fontSize) *
                      getFontMultiplier(),
                  },
                ]}
              >
                Summary
              </Text>
              <Text
                style={[
                  styles.summaryText,
                  { color: colors.textSecondary },
                  isTablet && {
                    fontSize:
                      (styles.summaryText.fontSize ||
                        DesignSystem.typography.body.fontSize) *
                      getFontMultiplier(),
                  },
                ]}
              >
                {summaryPreviewText}
              </Text>
            </View>
          </Pressable>

          <View
            style={{
              marginTop: DesignSystem.spacing.lg,
              marginBottom: DesignSystem.spacing.md,
            }}
          >
            <SubmitButton
              onPress={() => {
                Keyboard.dismiss();
                void handleSubmit();
              }}
              disabled={!isFormValid}
              title={isEdit ? "Save changes" : "Add task"}
            />
          </View>
        </ScrollView>
      </HearthSheet>
    </>
  );
}

const styles = StyleSheet.create({
  summaryContainer: {
    borderRadius: DesignSystem.borders.radius.medium,
    padding: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  summaryTitle: {
    ...DesignSystem.typography.callout,
    marginBottom: DesignSystem.spacing.sm,
  },
  summaryText: {
    ...DesignSystem.typography.footnote,
    lineHeight: 20,
  },
});
