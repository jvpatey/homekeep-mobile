import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
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
import { EquipmentManual } from "../../../../types/equipmentManual";
import { EquipmentManualService } from "../../../../services/EquipmentManualService";

const FORM_KEYBOARD_ACCESSORY_ID = "createTaskFormKeyboardAccessory";

type FormFieldKey =
  | "title"
  | "description"
  | "category"
  | "estimated_duration_minutes"
  | "interval_days";

interface CreateTaskModalProps {
  onClose: () => void;
  onTaskCreated: () => void;
  initialValues?: Partial<MaintenanceRoutineForm> & { id?: string };
  isEdit?: boolean;
}

interface MaintenanceRoutineForm {
  title: string;
  category: MaintenanceCategory;
  interval_days: number;
  startDate: Date;
  priority: Priority;
  estimated_duration_minutes: number;
  description?: string;
  equipment_id?: string | null;
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

function buildInitialForm(
  initialValues?: Partial<MaintenanceRoutineForm>
): MaintenanceRoutineForm {
  const startDate = initialValues?.startDate
    ? new Date(initialValues.startDate)
    : new Date();
  startDate.setHours(12, 0, 0, 0);

  return {
    title: initialValues?.title ?? "",
    category: (initialValues?.category ?? "GENERAL") as MaintenanceCategory,
    interval_days: initialValues?.interval_days ?? 30,
    startDate,
    priority: (initialValues?.priority ?? "medium") as Priority,
    estimated_duration_minutes: initialValues?.estimated_duration_minutes ?? 30,
    description: initialValues?.description ?? "",
    equipment_id: initialValues?.equipment_id ?? null,
  };
}

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

  const initialForm = useMemo(
    () => buildInitialForm(initialValues),
    [initialValues]
  );

  const titleFieldRef = useRef<RNTextInput | null>(null);
  const descriptionFieldRef = useRef<RNTextInput | null>(null);
  const durationFieldRef = useRef<RNTextInput | null>(null);
  const formScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const fieldOffsets = useRef<Partial<Record<FormFieldKey, number>>>({});

  const [form, setForm] = useState<MaintenanceRoutineForm>(initialForm);
  const [equipmentList, setEquipmentList] = useState<EquipmentManual[]>([]);
  const [durationText, setDurationText] = useState(
    String(initialForm.estimated_duration_minutes)
  );
  const [selectedInterval, setSelectedInterval] = useState<number>(() => {
    const days = initialValues?.interval_days ?? 30;
    const presets = [7, 30, 90, 365];
    for (const preset of presets) {
      if (days % preset === 0) return preset;
    }
    return 0;
  });
  const [intervalValue, setIntervalValue] = useState<number>(() => {
    const days = initialValues?.interval_days ?? 30;
    const interval = (() => {
      const presets = [7, 30, 90, 365];
      for (const preset of presets) {
        if (days % preset === 0) return preset;
      }
      return 0;
    })();
    if (interval === 0) return days;
    return Math.max(1, Math.round(days / interval));
  });

  const [errors, setErrors] = useState<
    Partial<{ [K in keyof MaintenanceRoutineForm]: string }>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [dismissChromeToken, setDismissChromeToken] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    void EquipmentManualService.listEquipmentManuals().then((result) => {
      if (result.data) setEquipmentList(result.data);
    });
  }, []);

  const dismissFormChrome = useCallback(() => {
    Keyboard.dismiss();
    setDismissChromeToken((token) => token + 1);
  }, []);

  const scrollFieldIntoView = useCallback((fieldKey: FormFieldKey) => {
    const runScroll = () => {
      const y = fieldOffsets.current[fieldKey];
      if (y == null) return;
      formScrollRef.current?.scrollTo({
        y: Math.max(0, y - DesignSystem.spacing.xl),
        animated: true,
      });
    };

    runScroll();
    if (Platform.OS === "ios") {
      setTimeout(runScroll, 100);
      setTimeout(runScroll, 300);
    }
  }, []);

  const registerFieldLayout = useCallback(
    (fieldKey: FormFieldKey) => (y: number) => {
      fieldOffsets.current[fieldKey] = y;
    },
    []
  );

  const capitalizeFirst = (input: string) => {
    if (!input) return "";
    return input.replace(/^\s*([a-zA-Z])/, (_match, first: string) =>
      first.toUpperCase()
    );
  };

  const getEffectiveIntervalDays = (): number => {
    if (selectedInterval === 0) {
      return intervalValue;
    }
    return selectedInterval * intervalValue;
  };

  const isFormDirty = useMemo(() => {
    return (
      form.title !== initialForm.title ||
      form.category !== initialForm.category ||
      form.priority !== initialForm.priority ||
      form.description !== initialForm.description ||
      form.estimated_duration_minutes !== initialForm.estimated_duration_minutes ||
      form.startDate.getTime() !== initialForm.startDate.getTime() ||
      getEffectiveIntervalDays() !== initialForm.interval_days
    );
  }, [form, initialForm, selectedInterval, intervalValue]);

  const validateForm = (): {
    ok: boolean;
    firstError?: string;
    firstErrorField?: FormFieldKey;
  } => {
    const newErrors: Partial<{ [K in keyof MaintenanceRoutineForm]: string }> =
      {};

    if (!form.title.trim()) {
      newErrors.title = "Task title is required";
    }

    if (!form.category) {
      newErrors.category = "Please select a category";
    }

    const duration = parseInt(durationText, 10);
    if (!durationText.trim() || Number.isNaN(duration) || duration <= 0) {
      newErrors.estimated_duration_minutes = "Duration must be greater than 0";
    }

    const effectiveDays = getEffectiveIntervalDays();
    if (!effectiveDays || effectiveDays <= 0) {
      newErrors.interval_days = "Interval must be greater than 0";
    }

    setErrors(newErrors);

    const fieldOrder: FormFieldKey[] = [
      "title",
      "category",
      "estimated_duration_minutes",
      "interval_days",
    ];
    const firstErrorField = fieldOrder.find((key) => {
      if (key === "interval_days") return Boolean(newErrors.interval_days);
      return Boolean(newErrors[key]);
    });
    const firstError = firstErrorField
      ? newErrors[firstErrorField === "interval_days" ? "interval_days" : firstErrorField]
      : undefined;

    return {
      ok: Object.keys(newErrors).length === 0,
      firstError,
      firstErrorField,
    };
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const duration = parseInt(durationText, 10);
    if (!Number.isNaN(duration) && duration > 0) {
      setForm((prev) => ({
        ...prev,
        estimated_duration_minutes: duration,
      }));
    }

    const { ok, firstError, firstErrorField } = validateForm();
    if (!ok) {
      triggerMedium();
      if (firstErrorField) {
        scrollFieldIntoView(firstErrorField);
      }
      Alert.alert(
        "Check your task",
        firstError ?? "Please fix the highlighted fields and try again."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const actualIntervalDays = getEffectiveIntervalDays();
      const startAtNoon = new Date(form.startDate);
      startAtNoon.setHours(12, 0, 0, 0);

      const taskData: CreateMaintenanceRoutineData = {
        title: form.title.trim(),
        category: form.category,
        priority: form.priority,
        estimated_duration_minutes: parseInt(durationText, 10),
        interval_days: actualIntervalDays,
        start_date: startAtNoon.toISOString(),
        description: form.description?.trim() || undefined,
        equipment_id: form.equipment_id || null,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateForm = (
    field: keyof MaintenanceRoutineForm,
    value: MaintenanceRoutineForm[keyof MaintenanceRoutineForm]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const isFormValid =
    Boolean(form.title.trim()) &&
    Boolean(form.category) &&
    Boolean(durationText.trim()) &&
    parseInt(durationText, 10) > 0 &&
    getEffectiveIntervalDays() > 0;

  const summaryPreviewText = useMemo(() => {
    return `"${form.title.trim() || "Your task"}" will be scheduled every ${intervalValue} ${getIntervalLabel(selectedInterval)}${intervalValue > 1 ? "s" : ""} starting ${form.startDate.toLocaleDateString()}.`;
  }, [form.title, intervalValue, selectedInterval, form.startDate]);

  const handleSheetCloseRequest = () => {
    Keyboard.dismiss();
    if (isFormDirty && !isSubmitting) {
      Alert.alert(
        "Discard changes?",
        "You have unsaved changes to this task.",
        [
          { text: "Keep editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => setSheetVisible(false),
          },
        ]
      );
      return;
    }
    setSheetVisible(false);
  };

  const keyboardAccessory = Platform.OS === "ios" ? (
    <InputAccessoryView nativeID={FORM_KEYBOARD_ACCESSORY_ID}>
      <View
        style={[
          styles.keyboardAccessory,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={dismissFormChrome}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Done editing"
        >
          <Text
            style={[styles.keyboardAccessoryDone, { color: colors.primary }]}
          >
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  ) : null;

  return (
    <>
      {keyboardAccessory}
      <HearthSheet
        visible={sheetVisible}
        onClose={handleSheetCloseRequest}
        onDismissed={onClose}
        title={isEdit ? "Edit task" : "Add a task"}
        maxHeightRatio={0.92}
        fillMaxHeight
        accessibilityLabel={isEdit ? "Close edit task" : "Close add task"}
        contentStyle={{ paddingHorizontal: 0 }}
        footer={
          keyboardVisible ? undefined : (
            <SubmitButton
              onPress={() => {
                Keyboard.dismiss();
                void handleSubmit();
              }}
              disabled={!isFormValid || isSubmitting}
              loading={isSubmitting}
              title={isEdit ? "Save changes" : "Add task"}
            />
          )
        }
      >
        <ScrollView
          ref={formScrollRef}
          style={styles.formScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: DesignSystem.spacing.lg,
            paddingBottom: keyboardVisible
              ? DesignSystem.spacing.xxxl
              : insets.bottom + DesignSystem.spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          onScrollBeginDrag={dismissFormChrome}
        >
          <FormField
            ref={titleFieldRef}
            label="Task Title"
            value={form.title}
            onChangeText={(text) => updateForm("title", text)}
            placeholder="e.g., Change air filter, Clean gutters..."
            error={errors.title}
            autoCapitalize="words"
            autoCorrect
            textContentType="none"
            required
            returnKeyType="next"
            enablesReturnKeyAutomatically
            onSubmitEditing={() => descriptionFieldRef.current?.focus()}
            onFocusExtra={() => scrollFieldIntoView("title")}
            onFieldLayout={registerFieldLayout("title")}
          />

          <View onLayout={(event) => registerFieldLayout("category")(event.nativeEvent.layout.y)}>
            <CategorySelector
              categories={categories}
              selectedCategory={form.category}
              dismissChromeToken={dismissChromeToken}
              onSelectCategory={(categoryId) => {
                updateForm("category", categoryId);
              }}
              error={errors.category}
            />
          </View>

          {equipmentList.length > 0 ? (
            <View style={{ marginBottom: DesignSystem.spacing.md }}>
              <Text
                style={{
                  ...DesignSystem.typography.footnote,
                  color: colors.textSecondary,
                  fontWeight: "600",
                  marginBottom: DesignSystem.spacing.sm,
                }}
              >
                Equipment (optional)
              </Text>
              {equipmentList.map((item) => {
                const selected = form.equipment_id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() =>
                      updateForm(
                        "equipment_id",
                        selected ? null : item.id
                      )
                    }
                    style={{
                      paddingVertical: DesignSystem.spacing.sm,
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? colors.primary : colors.text,
                        fontWeight: selected ? "700" : "500",
                      }}
                    >
                      {selected ? "✓ " : ""}
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

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
            autoCorrect
            spellCheck
            blurOnSubmit={false}
            inputAccessoryViewID={FORM_KEYBOARD_ACCESSORY_ID}
            returnKeyType="default"
            onFocusExtra={() => scrollFieldIntoView("description")}
            onFieldLayout={registerFieldLayout("description")}
          />

          <FormField
            ref={durationFieldRef}
            label="Estimated Duration (minutes)"
            value={durationText}
            onChangeText={(text) => {
              const sanitized = text.replace(/[^0-9]/g, "");
              setDurationText(sanitized);
              if (errors.estimated_duration_minutes) {
                setErrors((prev) => ({
                  ...prev,
                  estimated_duration_minutes: undefined,
                }));
              }
            }}
            onBlurExtra={() => {
              const num = parseInt(durationText, 10);
              if (!durationText.trim() || Number.isNaN(num) || num <= 0) {
                setDurationText(
                  String(form.estimated_duration_minutes || 30)
                );
                return;
              }
              setDurationText(String(num));
              setForm((prev) => ({
                ...prev,
                estimated_duration_minutes: num,
              }));
            }}
            placeholder="e.g., 30"
            keyboardType="numeric"
            textContentType="none"
            inputAccessoryViewID={FORM_KEYBOARD_ACCESSORY_ID}
            error={errors.estimated_duration_minutes}
            required
            returnKeyType="done"
            onSubmitEditing={dismissFormChrome}
            onFocusExtra={() => scrollFieldIntoView("estimated_duration_minutes")}
            onFieldLayout={registerFieldLayout("estimated_duration_minutes")}
          />

          <View
            onLayout={(event) =>
              registerFieldLayout("interval_days")(event.nativeEvent.layout.y)
            }
          >
            <IntervalSelector
              selectedInterval={selectedInterval}
              intervalValue={intervalValue}
              dismissChromeToken={dismissChromeToken}
              onSelectInterval={(interval: number) => setSelectedInterval(interval)}
              onIntervalValueChange={(value) => setIntervalValue(value)}
              error={errors.interval_days}
            />
          </View>

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
        </ScrollView>
      </HearthSheet>
    </>
  );
}

const styles = StyleSheet.create({
  formScroll: {
    flex: 1,
  },
  keyboardAccessory: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  keyboardAccessoryDone: {
    fontSize: DesignSystem.typography.bodyMedium.fontSize,
    fontWeight: "600",
  },
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
