import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useHaptics } from "../../../../hooks/useHaptics";
import { useDevice } from "../../../../hooks";
import { useTasks } from "../../../../context/TasksContext";
import { useTheme } from "../../../../context/ThemeContext";
import { DesignSystem } from "../../../../theme/designSystem";
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
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const { width: windowWidth } = useWindowDimensions();
  const maxModalWidth = isTablet
    ? getResponsiveValue(420, 600, 700)
    : 420;
  const modalCardWidth = Math.min(
    Math.max(windowWidth * 0.92, 280),
    maxModalWidth
  );

  // Animation values
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
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

  // AI typing animation
  const [summaryText, setSummaryText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const summaryRef = useRef<View>(null);

  // Entrance animation
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, { damping: 20, stiffness: 180 });
    translateY.value = withTiming(0, { duration: 200 });
    contentOpacity.value = withTiming(1, { duration: 200 });
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
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

  // Generate summary text
  const generateSummaryText = () => {
    const fullText = `"${
      form.title
    }" will be scheduled every ${intervalValue} ${getIntervalLabel(
      selectedInterval
    )}${
      intervalValue > 1 ? "s" : ""
    } starting ${form.startDate.toLocaleDateString()}.`;
    return fullText;
  };

  // Typing animation effect
  useEffect(() => {
    if (isTyping && summaryText.length < generateSummaryText().length) {
      const timeout = setTimeout(() => {
        setSummaryText(
          generateSummaryText().substring(0, summaryText.length + 1)
        );
      }, 30); // Typing speed - adjust for desired effect
      return () => clearTimeout(timeout);
    } else if (summaryText.length === generateSummaryText().length) {
      setIsTyping(false);
    }
  }, [
    summaryText,
    isTyping,
    form.title,
    intervalValue,
    selectedInterval,
    form.startDate,
  ]);

  // Trigger typing when form changes
  useEffect(() => {
    const fullText = generateSummaryText();
    // Trigger animation whenever the summary text changes
    if (fullText !== summaryText) {
      setSummaryText("");
      setIsTyping(true);
    }
  }, [form.title, intervalValue, selectedInterval, form.startDate, form.category, form.priority, form.estimated_duration_minutes]);

  // Start typing animation when modal opens
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSummaryText("");
      setIsTyping(true);
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

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

  const getIntervalLabel = (interval: number) => {
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
  };

  const glassGradient = isDark
    ? ([
        "rgba(46, 196, 182, 0.15)",
        "rgba(58, 134, 255, 0.25)",
        "rgba(15, 23, 42, 0.85)",
      ] as const)
    : ([
        "rgba(46, 196, 182, 0.12)",
        "rgba(147, 197, 253, 0.18)",
        "rgba(255, 255, 255, 0.85)",
      ] as const);

  const handleClose = () => {
    // Exit animation
    opacity.value = withTiming(0, { duration: 150 });
    scale.value = withTiming(0.95, { duration: 150 });
    translateY.value = withTiming(20, { duration: 150 });
    setTimeout(onClose, 150);
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="none"
      onRequestClose={handleClose}
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
              onPress={() => Keyboard.dismiss()}
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
        style={styles.overlayRoot}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.overlayRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={Keyboard.dismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss keyboard"
          />
          <View style={styles.overlayForeground} pointerEvents="box-none">
            <Animated.View
              pointerEvents="auto"
                style={[
                  styles.container,
                  { width: modalCardWidth },
                  containerAnimatedStyle,
                  {
                    backgroundColor: isDark
                      ? "rgba(15, 23, 42, 0.95)"
                      : "rgba(255, 255, 255, 0.95)",
                    borderWidth: 1,
                    borderColor: isDark
                      ? "rgba(46, 196, 182, 0.3)"
                      : "rgba(46, 196, 182, 0.2)",
                  },
                ]}
              >
                <LinearGradient
                  colors={glassGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.gradientBackground,
                    isTablet && {
                      padding: getResponsiveValue(
                        DesignSystem.spacing.xl,
                        DesignSystem.spacing.xl + DesignSystem.spacing.md,
                        DesignSystem.spacing.xl + DesignSystem.spacing.lg,
                      ),
                    },
                  ]}
                >
                  {/* Close Button */}
                  <TouchableOpacity
                    style={[
                      styles.closeButton,
                      {
                        backgroundColor: isDark
                          ? "rgba(46, 196, 182, 0.15)"
                          : "rgba(46, 196, 182, 0.12)",
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: isDark
                          ? "rgba(46, 196, 182, 0.3)"
                          : "rgba(46, 196, 182, 0.25)",
                      },
                    ]}
                    onPress={handleClose}
                  >
                    <Ionicons
                      name="close"
                      size={isTablet ? getResponsiveValue(22, 26, 28) : 22}
                      color={
                        isDark
                          ? "rgba(255, 255, 255, 0.9)"
                          : "rgba(15, 23, 42, 0.85)"
                      }
                    />
                  </TouchableOpacity>

                  {/* Title */}
                  <Text
                    style={[
                      styles.modalTitle,
                      {
                        color: isDark
                          ? "rgba(255, 255, 255, 0.95)"
                          : "rgba(15, 23, 42, 0.9)",
                      },
                      isTablet && {
                        fontSize: ((styles.modalTitle.fontSize || DesignSystem.typography.h2.fontSize) * getFontMultiplier()),
                        lineHeight: ((styles.modalTitle.fontSize || DesignSystem.typography.h2.fontSize) * getFontMultiplier()) * 1.2,
                      },
                    ]}
                  >
                    {isEdit ? "Edit Task" : "Let's add your task"}
                  </Text>

                  {/* Content */}
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingBottom: DesignSystem.spacing.xxxl,
                    }}
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="on-drag"
                  >
                    <FormField
                      label="Task Title"
                      value={form.title}
                      onChangeText={(text) => updateForm("title", text)}
                      placeholder="e.g., Change air filter, Clean gutters..."
                      error={errors.title}
                      autoCapitalize="words"
                      required
                    />

                    <CategorySelector
                      categories={categories}
                      selectedCategory={form.category}
                      onSelectCategory={(categoryId) => {
                        updateForm("category", categoryId);
                      }}
                      error={errors.category}
                    />

                    <PrioritySelector
                      priorities={priorities}
                      selectedPriority={form.priority}
                      onSelectPriority={(priorityId) =>
                        updateForm("priority", priorityId)
                      }
                    />

                    <FormField
                      label="Instructions (Optional)"
                      value={form.description || ""}
                      onChangeText={(text) =>
                        updateForm("description", capitalizeFirst(text))
                      }
                      placeholder="Add detailed instructions for this task..."
                      multiline
                      numberOfLines={3}
                      autoCapitalize="sentences"
                    />

                    <FormField
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
                    />

                    <IntervalSelector
                      selectedInterval={selectedInterval}
                      intervalValue={intervalValue}
                      onSelectInterval={(interval: number) =>
                        setSelectedInterval(interval)
                      }
                      onIntervalValueChange={(value) => setIntervalValue(value)}
                      error={errors.interval_days?.toString()}
                    />

                    <StartDateSelector
                      startDate={form.startDate}
                      onStartDateChange={(date) =>
                        updateForm("startDate", date)
                      }
                    />

                    {/* Summary Section */}
                    <View
                      ref={summaryRef}
                      style={[
                        styles.summaryContainer,
                        {
                          backgroundColor: isDark
                            ? "rgba(46, 196, 182, 0.1)"
                            : "rgba(147, 197, 253, 0.12)",
                          borderColor: isDark
                            ? "rgba(46, 196, 182, 0.2)"
                            : "rgba(59, 130, 246, 0.2)",
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
                          {
                            color: isDark
                              ? "rgba(255, 255, 255, 0.95)"
                              : "rgba(15, 23, 42, 0.9)",
                          },
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
                          {
                            color: isDark
                              ? "rgba(255, 255, 255, 0.8)"
                              : "rgba(59, 130, 246, 0.85)",
                          },
                          isTablet && {
                            fontSize: ((styles.summaryText.fontSize || DesignSystem.typography.body.fontSize) * getFontMultiplier()),
                            lineHeight: ((styles.summaryText.fontSize || DesignSystem.typography.body.fontSize) * getFontMultiplier()) * 1.4,
                          },
                        ]}
                      >
                        {summaryText}
                        {isTyping && (
                          <Text
                            style={{
                              color: isDark
                                ? "rgba(46, 196, 182, 1)"
                                : "rgba(59, 130, 246, 1)",
                            }}
                          >
                            {" "}
                            ▊
                          </Text>
                        )}
                      </Text>
                    </View>

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
                </LinearGradient>
              </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 0,
  },
  overlayForeground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  container: {
    maxHeight: "85%",
    borderRadius: DesignSystem.borders.radius.xlarge,
    overflow: "hidden",
  },
  gradientBackground: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.lg,
  },
  closeButton: {
    position: "absolute",
    top: DesignSystem.spacing.md,
    right: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.xs,
    zIndex: 10,
  },
  modalTitle: {
    ...DesignSystem.typography.h2,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: DesignSystem.spacing.lg,
    marginTop: DesignSystem.spacing.md,
    textAlign: "center",
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
