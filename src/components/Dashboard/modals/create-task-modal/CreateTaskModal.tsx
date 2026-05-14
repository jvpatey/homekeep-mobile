import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  ScrollView,
  Alert,
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
  InputAccessoryView,
  useWindowDimensions,
  TextInput as RNTextInput,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useHaptics } from "../../../../hooks/useHaptics";
import { useDevice, useGradients } from "../../../../hooks";
import { useTasks } from "../../../../context/TasksContext";
import { useTheme } from "../../../../context/ThemeContext";
import { DesignSystem } from "../../../../theme/designSystem";
import { GlassCard } from "../../../ui/glass-card/GlassCard";
import { SheetGrabber } from "../../../ui/sheet-grabber";
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
  const { colors, isDark } = useTheme();
  const { haloGradient } = useGradients();
  const insets = useSafeAreaInsets();
  const { isTablet, getFontMultiplier, getResponsiveValue, getTabletSheetContainerStyle } =
    useDevice();
  const { height: windowHeight } = useWindowDimensions();
  const sheetMaxHeight = windowHeight * 0.85;
  /** Grabber + title row + gradient padding; avoids flex-collapsed BlurView (hairline sheet bug). */
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

  // Animation values (bottom sheet — aligned with ProfileMenu)
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(windowHeight);
  const contentOpacity = useSharedValue(0);

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

  const motionFast = DesignSystem.motion.duration.fast;
  const motionEasing = DesignSystem.motion.easing.standard;

  // Entrance animation (bottom sheet — aligned with ProfileMenu)
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: motionFast,
      easing: motionEasing,
    });
    translateY.value = withSpring(0, DesignSystem.motion.spring.snappy);
    contentOpacity.value = withDelay(
      DesignSystem.motion.stagger,
      withTiming(1, {
        duration: DesignSystem.motion.duration.base,
        easing: motionEasing,
      })
    );
  }, []);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

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

  const handleClose = () => {
    Keyboard.dismiss();
    contentOpacity.value = withTiming(0, {
      duration: motionFast,
      easing: motionEasing,
    });
    opacity.value = withTiming(0, {
      duration: motionFast,
      easing: motionEasing,
    });
    translateY.value = withTiming(
      windowHeight,
      {
        duration: motionFast,
        easing: motionEasing,
      },
      (finished) => {
        if (finished) runOnJS(onClose)();
      }
    );
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled={Platform.OS === "android"}
        style={styles.keyboardRoot}
        keyboardVerticalOffset={Platform.OS === "android" ? 20 : 0}
      >
        <Animated.View style={[styles.sheetOverlay, backdropAnimatedStyle]}>
          <Pressable
            style={styles.backdropPressable}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel={isEdit ? "Close edit task" : "Close add task"}
          />
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.sheetContainer,
              getTabletSheetContainerStyle(),
              { maxHeight: sheetMaxHeight },
              sheetAnimatedStyle,
            ]}
          >
            <GlassCard
              material="thick"
              radius={DesignSystem.borders.radius.glass}
              containerStyle={styles.sheetGlassOuter}
              style={styles.sheetGlassInner}
            >
              <LinearGradient
                colors={[...haloGradient]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={[
                  styles.gradientBackground,
                  { maxHeight: sheetMaxHeight },
                  isTablet && {
                    padding: getResponsiveValue(
                      DesignSystem.spacing.xl,
                      DesignSystem.spacing.xl + DesignSystem.spacing.md,
                      DesignSystem.spacing.xl + DesignSystem.spacing.lg,
                    ),
                  },
                ]}
              >
                <SafeAreaView edges={["bottom"]} style={styles.sheetSafeArea}>
                  <SheetGrabber />
                  <View style={styles.sheetTitleRow}>
                    <View style={styles.sheetTitleSideSpacer} />
                    <Pressable
                      style={styles.sheetTitlePressable}
                      onPress={dismissFormChrome}
                    >
                      <Text
                        style={[
                          styles.modalTitle,
                          { color: colors.text },
                          isTablet && {
                            fontSize:
                              (styles.modalTitle.fontSize ||
                                DesignSystem.typography.h2.fontSize) *
                              getFontMultiplier(),
                            lineHeight:
                              (styles.modalTitle.fontSize ||
                                DesignSystem.typography.h2.fontSize) *
                              getFontMultiplier() *
                              1.2,
                          },
                        ]}
                      >
                        {isEdit ? "Edit Task" : "Let's add your task"}
                      </Text>
                    </Pressable>
                    <TouchableOpacity
                      style={[
                        styles.sheetCloseButton,
                        {
                          backgroundColor: isDark
                            ? "rgba(35, 37, 38, 0.55)"
                            : "rgba(255, 255, 255, 0.45)",
                          borderWidth: DesignSystem.borders.hairline,
                          borderColor: colors.glassStroke,
                        },
                      ]}
                      onPress={handleClose}
                      accessibilityRole="button"
                      accessibilityLabel="Close"
                    >
                      <Ionicons
                        name="close"
                        size={isTablet ? getResponsiveValue(22, 26, 28) : 22}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                  </View>

                  <Animated.View style={[contentAnimatedStyle, styles.scrollSection]}>
                    <ScrollView
                      ref={formScrollRef}
                      style={{ maxHeight: scrollViewportMaxHeight }}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{
                        paddingBottom: scrollBottomPadding,
                      }}
                      keyboardShouldPersistTaps="handled"
                      keyboardDismissMode={
                        Platform.OS === "ios" ? "interactive" : "on-drag"
                      }
                      automaticallyAdjustKeyboardInsets={
                        Platform.OS === "ios"
                      }
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
                      onSubmitEditing={() =>
                        descriptionFieldRef.current?.focus()
                      }
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
                      onSelectPriority={(priorityId) =>
                        updateForm("priority", priorityId)
                      }
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
                      onSelectInterval={(interval: number) =>
                        setSelectedInterval(interval)
                      }
                      onIntervalValueChange={(value) => setIntervalValue(value)}
                      error={errors.interval_days?.toString()}
                    />

                    <StartDateSelector
                      startDate={form.startDate}
                      dismissChromeToken={dismissChromeToken}
                      onStartDateChange={(date) =>
                        updateForm("startDate", date)
                      }
                    />

                    {/* Summary Section */}
                    <Pressable onPress={dismissFormChrome}>
                      <View
                        style={[
                          styles.summaryContainer,
                          {
                            backgroundColor: isDark
                              ? "rgba(35, 37, 38, 0.4)"
                              : "rgba(255, 255, 255, 0.4)",
                            borderColor: isDark
                              ? "rgba(255, 255, 255, 0.1)"
                              : "rgba(255, 255, 255, 0.6)",
                          },
                          isTablet && {
                            padding: getResponsiveValue(
                              DesignSystem.spacing.md,
                              DesignSystem.spacing.lg,
                              DesignSystem.spacing.xl,
                            ),
                          },
                        ]}
                      >
                      <Text
                        style={[
                          styles.summaryTitle,
                          { color: colors.text },
                          isTablet && {
                            fontSize: ((styles.summaryTitle.fontSize || DesignSystem.typography.h4.fontSize) * getFontMultiplier()),
                            lineHeight: ((styles.summaryTitle.fontSize || DesignSystem.typography.h4.fontSize) * getFontMultiplier()) * 1.2,
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
                            fontSize: ((styles.summaryText.fontSize || DesignSystem.typography.body.fontSize) * getFontMultiplier()),
                            lineHeight: ((styles.summaryText.fontSize || DesignSystem.typography.body.fontSize) * getFontMultiplier()) * 1.4,
                          },
                        ]}
                      >
                        {summaryPreviewText}
                      </Text>
                    </View>
                    </Pressable>

                    {/* Submit Button */}
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
                        title={isEdit ? "Save Changes" : "Add Task"}
                      />
                    </View>
                    </ScrollView>
                  </Animated.View>
                </SafeAreaView>
              </LinearGradient>
            </GlassCard>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
    minHeight: 0,
  },
  sheetOverlay: {
    flex: 1,
    minHeight: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    width: "100%",
    flexShrink: 1,
  },
  sheetGlassOuter: {
    width: "100%",
    borderTopLeftRadius: DesignSystem.borders.radius.glass,
    borderTopRightRadius: DesignSystem.borders.radius.glass,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
  },
  sheetGlassInner: {
    borderTopLeftRadius: DesignSystem.borders.radius.glass,
    borderTopRightRadius: DesignSystem.borders.radius.glass,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
  },
  gradientBackground: {
    paddingTop: DesignSystem.spacing.xs,
    paddingBottom: DesignSystem.spacing.lg,
  },
  sheetSafeArea: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  sheetTitleSideSpacer: {
    width: 40,
  },
  sheetTitlePressable: {
    flex: 1,
    minWidth: 0,
  },
  sheetCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    ...DesignSystem.typography.h2,
    fontWeight: "700",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  scrollSection: {
    minHeight: 0,
  },
  content: {
    // Remove flex constraints to allow proper scrolling
  },
  summaryContainer: {
    borderRadius: DesignSystem.borders.radius.medium,
    padding: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.md,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: DesignSystem.typography.h4.fontSize,
    fontWeight: "700",
    marginBottom: DesignSystem.spacing.sm,
  },
  summaryText: {
    fontSize: DesignSystem.typography.body.fontSize,
    lineHeight: 20,
  },
});
