import React, { useState } from "react";
import {
  ScrollView,
  Alert,
  View,
  Text,
  Modal,
  SafeAreaView,
} from "react-native";
import { useSimpleAnimation } from "../../../../hooks/useAnimations";
import { useHaptics } from "../../../../hooks/useHaptics";
import { useTasks } from "../../../../context/TasksContext";
import { useAuth } from "../../../../context/AuthContext";
import { useTheme } from "../../../../context/ThemeContext";
import { styles } from "./styles";
import { FormField } from "./FormField";
import { CategorySelector } from "./CategorySelector";
import { PrioritySelector } from "./PrioritySelector";
import { IntervalSelector } from "./IntervalSelector";
import { StartDateSelector } from "./StartDateSelector";
import { ModalHeader } from "./ModalHeader";
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
}: CreateTaskModalProps) {
  const { triggerLight, triggerMedium } = useHaptics();
  const { createTask } = useTasks();
  const { user } = useAuth();
  const { colors } = useTheme();
  const modalAnimatedStyle = useSimpleAnimation(0, 400, 20);

  const [form, setForm] = useState<MaintenanceRoutineForm>({
    title: "",
    category: "GENERAL" as MaintenanceCategory,
    interval_days: 30,
    startDate: (() => {
      const today = new Date();
      today.setHours(9, 0, 0, 0);
      return today;
    })(),
    priority: "medium" as Priority,
    estimated_duration_minutes: 30,
    description: "",
  });

  // Separate state for interval management
  const [selectedInterval, setSelectedInterval] = useState<number>(30); // 30 = Monthly
  const [intervalValue, setIntervalValue] = useState<number>(1); // Multiplier

  const [errors, setErrors] = useState<
    Partial<{ [K in keyof MaintenanceRoutineForm]: string }>
  >({});

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

      const taskData: CreateMaintenanceRoutineData = {
        title: form.title.trim(),
        category: form.category,
        priority: form.priority,
        estimated_duration_minutes: form.estimated_duration_minutes,
        interval_days: actualIntervalDays,
        start_date: form.startDate.toISOString(),
        description: form.description?.trim() || undefined,
      };

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

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <SafeAreaView
        style={[
          styles.createTaskContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ModalHeader title="Create Task Series" onClose={onClose} />

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <FormField
            label="Task Title"
            value={form.title}
            onChangeText={(text) => updateForm("title", text)}
            placeholder="e.g., Change air filter, Clean gutters..."
            error={errors.title}
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
            onChangeText={(text) => updateForm("description", text)}
            placeholder="Add detailed instructions for this task..."
            multiline
            numberOfLines={3}
          />

          <FormField
            label="Estimated Duration (minutes)"
            value={form.estimated_duration_minutes.toString()}
            onChangeText={(text) => {
              const num = parseInt(text) || 0;
              setForm((prev) => ({ ...prev, estimated_duration_minutes: num }));
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
              { backgroundColor: colors.surface },
            ]}
          >
            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              Task Series Summary
            </Text>
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
              "{form.title}" will be scheduled every {intervalValue}{" "}
              {getIntervalLabel(selectedInterval)}
              {intervalValue > 1 ? "s" : ""} starting{" "}
              {form.startDate.toLocaleDateString()}.
            </Text>
          </View>
        </ScrollView>

        <SubmitButton
          onPress={handleSubmit}
          disabled={!isFormValid}
          title="Create Task Series"
        />
      </SafeAreaView>
    </Modal>
  );
}
