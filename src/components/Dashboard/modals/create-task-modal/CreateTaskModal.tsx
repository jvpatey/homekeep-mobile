import React, { useState, useEffect } from "react";
import {
  ScrollView,
  Alert,
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
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
import { useTasks } from "../../../../context/TasksContext";
import { useAuth } from "../../../../context/AuthContext";
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
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

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

  // Entrance animation
  useEffect(() => {
    opacity.value = withSpring(1, { damping: 25, stiffness: 120 });
    scale.value = withSpring(1, { damping: 20, stiffness: 140 });
    translateY.value = withSpring(0, { damping: 25, stiffness: 120 });
    contentOpacity.value = withDelay(50, withTiming(1, { duration: 300 }));
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

  const validateForm = (): boolean => {
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

    if (!form.interval_days || form.interval_days <= 0) {
      newErrors.interval_days = "Interval must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      triggerMedium();
      return;
    }

    try {
      // Calculate the actual interval_days based on selected interval and multiplier
      let actualIntervalDays: number;
      if (selectedInterval === 0) {
        // Custom interval - use the intervalValue directly as days
        actualIntervalDays = intervalValue;
      } else {
        // For predefined intervals, multiply the base interval by the multiplier
        actualIntervalDays = selectedInterval * intervalValue;
      }

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
    form.title && form.category && form.estimated_duration_minutes > 0;

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
    ? [
        "rgba(46, 196, 182, 0.15)",
        "rgba(58, 134, 255, 0.25)",
        "rgba(15, 23, 42, 0.85)",
      ]
    : [
        "rgba(46, 196, 182, 0.12)",
        "rgba(147, 197, 253, 0.18)",
        "rgba(255, 255, 255, 0.85)",
      ];

  const handleClose = () => {
    // Exit animation
    opacity.value = withSpring(0, { damping: 20, stiffness: 100 });
    scale.value = withSpring(0.8, { damping: 20, stiffness: 100 });
    translateY.value = withSpring(30, { damping: 20, stiffness: 100 });
    setTimeout(onClose, 250);
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            containerAnimatedStyle,
            {
              backgroundColor: isDark
                ? "rgba(15, 23, 42, 0.85)"
                : "rgba(255, 255, 255, 0.85)",
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
            style={styles.gradientBackground}
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
                size={22}
                color={
                  isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(15, 23, 42, 0.85)"
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
              ]}
            >
              {isEdit ? "Edit Task" : "Add Recurring Task"}
            </Text>

            {/* Content */}
            <Animated.View style={[styles.content, contentAnimatedStyle]}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
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
                  onStartDateChange={(date) => updateForm("startDate", date)}
                />

                {/* Summary Section */}
                <View
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
                    ]}
                  >
                    Task Series Summary
                  </Text>
                  <Text
                    style={[
                      styles.summaryText,
                      {
                        color: isDark
                          ? "rgba(255, 255, 255, 0.8)"
                          : "rgba(59, 130, 246, 0.85)",
                      },
                    ]}
                  >
                    "{form.title}" will be scheduled every {intervalValue}{" "}
                    {getIntervalLabel(selectedInterval)}
                    {intervalValue > 1 ? "s" : ""} starting{" "}
                    {form.startDate.toLocaleDateString()}.
                  </Text>
                </View>
              </ScrollView>
            </Animated.View>

            <SubmitButton
              onPress={handleSubmit}
              disabled={!isFormValid}
              title={isEdit ? "Save Changes" : "Add Task"}
            />
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  container: {
    width: "92%",
    maxWidth: 420,
    maxHeight: "85%",
    borderRadius: DesignSystem.borders.radius.xlarge,
    overflow: "hidden",
    ...DesignSystem.shadows.large,
  },
  gradientBackground: {
    padding: DesignSystem.spacing.lg,
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
    maxHeight: "70%",
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
