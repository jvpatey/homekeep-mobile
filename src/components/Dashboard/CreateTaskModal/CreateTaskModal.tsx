import React, { useState } from "react";
import {
  ScrollView,
  Alert,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useSimpleAnimation, useHaptics } from "../../../hooks";
import { useTasks } from "../../../context/TasksContext";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { styles } from "../styles";
import { FormField } from "./FormField";
import { CategorySelector } from "./CategorySelector";
import { PrioritySelector } from "./PrioritySelector";
import { RecurringTaskToggle } from "./RecurringTaskToggle";
import { ModalHeader } from "./ModalHeader";
import { SubmitButton } from "./SubmitButton";
import { categories, priorities, recurrenceOptions } from "./data";

interface CreateTaskModalProps {
  onClose: () => void;
  onTaskCreated: () => void;
}

interface TaskForm {
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  estimatedDuration: string;
  isRecurring: boolean;
  recurrenceType?: "weekly" | "monthly" | "quarterly" | "yearly";
  dueDate: Date;
}

// CreateTaskModal - Features form validation, category selection, and smooth animations

export function CreateTaskModal({
  onClose,
  onTaskCreated,
}: CreateTaskModalProps) {
  const { triggerLight, triggerMedium } = useHaptics();
  const { createTask, refreshTasks } = useTasks();
  const { user } = useAuth();
  const { colors } = useTheme();
  const modalAnimatedStyle = useSimpleAnimation(0, 400, 20);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [form, setForm] = useState<TaskForm>({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    estimatedDuration: "",
    isRecurring: false,
    dueDate: (() => {
      // Default to next week for maintenance tasks
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(9, 0, 0, 0);

      return nextWeek;
    })(),
  });

  const [errors, setErrors] = useState<Partial<TaskForm>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<TaskForm> = {};

    if (!form.title.trim()) {
      newErrors.title = "Task title is required";
    }

    if (!form.category) {
      newErrors.category = "Please select a category";
    }

    if (form.estimatedDuration && isNaN(Number(form.estimatedDuration))) {
      newErrors.estimatedDuration = "Duration must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      triggerLight();
      return;
    }

    // Check if user is authenticated
    if (!user) {
      Alert.alert("Error", "You must be signed in to create tasks");
      return;
    }

    console.log("Creating task for user:", user.id);
    triggerMedium();

    try {
      const taskData = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        priority: form.priority,
        estimated_duration: form.estimatedDuration
          ? parseInt(form.estimatedDuration)
          : undefined,
        is_recurring: form.isRecurring,
        recurrence_type: form.recurrenceType,
        next_due_date: form.dueDate.toISOString(),
      };

      const { success, error } = await createTask(taskData);

      if (success) {
        console.log("Task created successfully");

        onTaskCreated();
      } else {
        console.error("Task creation failed:", error);
        Alert.alert("Error", error || "Failed to create task");
      }
    } catch (err) {
      console.error("Error creating task:", err);
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  const updateForm = (key: keyof TaskForm, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const isFormValid = form.title && form.category;

  return (
    <Animated.View style={[styles.createTaskContainer, modalAnimatedStyle]}>
      <ModalHeader title="Create Task" onClose={onClose} />

      <ScrollView
        style={styles.modalContent}
        showsVerticalScrollIndicator={false}
      >
        <FormField
          label="Task Title"
          value={form.title}
          onChangeText={(text) => updateForm("title", text)}
          placeholder="Enter task title..."
          error={errors.title}
          required
        />

        <CategorySelector
          categories={categories}
          selectedCategory={form.category}
          onSelectCategory={(categoryId) => updateForm("category", categoryId)}
          error={errors.category}
        />

        <PrioritySelector
          priorities={priorities}
          selectedPriority={form.priority}
          onSelectPriority={(priorityId) => updateForm("priority", priorityId)}
        />

        <FormField
          label="Description"
          value={form.description}
          onChangeText={(text) => updateForm("description", text)}
          placeholder="Add task details..."
          multiline
          numberOfLines={3}
        />

        {/* Date Picker Field */}
        <View style={styles.formField}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            Due Date <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[
              styles.datePickerButton,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.datePickerContent}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.datePickerText, { color: colors.text }]}>
                {form.dueDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <View
            style={[
              styles.datePickerContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            <DateTimePicker
              value={form.dueDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event: any, selectedDate?: Date) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selectedDate) {
                  // Preserve the time (9 AM) when date changes
                  const newDate = new Date(selectedDate);
                  newDate.setHours(
                    form.dueDate.getHours(),
                    form.dueDate.getMinutes()
                  );
                  updateForm("dueDate", newDate);
                }
              }}
              minimumDate={new Date()}
              textColor={colors.text}
              themeVariant={colors.background === "#FFFFFF" ? "light" : "dark"}
            />
            {Platform.OS === "ios" && (
              <TouchableOpacity
                style={[
                  styles.datePickerDone,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <FormField
          label="Estimated Duration (minutes)"
          value={form.estimatedDuration}
          onChangeText={(text) => updateForm("estimatedDuration", text)}
          placeholder="30"
          keyboardType="numeric"
          error={errors.estimatedDuration}
        />

        <RecurringTaskToggle
          isRecurring={form.isRecurring}
          recurrenceType={form.recurrenceType}
          onToggleRecurring={(isRecurring) =>
            updateForm("isRecurring", isRecurring)
          }
          onSelectRecurrenceType={(recurrenceType) =>
            updateForm("recurrenceType", recurrenceType)
          }
          recurrenceOptions={recurrenceOptions}
        />
      </ScrollView>

      <SubmitButton
        onPress={handleSubmit}
        disabled={!isFormValid}
        title="Create Task"
      />
    </Animated.View>
  );
}
