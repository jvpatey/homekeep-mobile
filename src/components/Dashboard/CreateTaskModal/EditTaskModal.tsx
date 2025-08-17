import React, { useState, useEffect } from "react";
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
import { Task, UpdateTaskData } from "../../../types/task";
import { TaskService } from "../../../services/taskService";
import { startOfDay } from "date-fns";

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onTaskUpdated: () => void;
}

interface TaskForm {
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  estimatedDuration: string;
  isRecurring: boolean;
  recurrenceType: "weekly" | "monthly" | "quarterly" | "yearly";
  dueDate: Date;
}

// EditTaskModal - Features form validation, category selection, and smooth animations
export function EditTaskModal({
  task,
  onClose,
  onTaskUpdated,
}: EditTaskModalProps) {
  const { triggerLight, triggerMedium } = useHaptics();
  const { updateTask, refreshTasks } = useTasks();
  const { user } = useAuth();
  const { colors } = useTheme();
  const modalAnimatedStyle = useSimpleAnimation(0, 400, 20);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [form, setForm] = useState<TaskForm>({
    title: task.title,
    description: task.description || "",
    category: task.category,
    priority: task.priority,
    estimatedDuration: task.estimated_duration?.toString() || "",
    isRecurring: task.is_recurring || false,
    recurrenceType: task.recurrence_type || "weekly",
    dueDate: new Date(task.next_due_date),
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
      Alert.alert("Error", "You must be signed in to edit tasks");
      return;
    }

    triggerMedium();

    try {
      const originalDue = startOfDay(new Date(task.next_due_date));
      const updateData: UpdateTaskData = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        priority: form.priority,
        estimated_duration: form.estimatedDuration
          ? parseInt(form.estimatedDuration)
          : undefined,
        is_recurring: form.isRecurring,
        recurrence_type: form.recurrenceType,
        next_due_date: startOfDay(form.dueDate).toISOString(),
      };

      const { success, error } = await updateTask(task.id, updateData);

      if (success) {
        // If recurring and due date changed, shift future instances by delta
        if (
          (task.is_recurring || form.isRecurring) &&
          originalDue.getTime() !== startOfDay(form.dueDate).getTime()
        ) {
          const deltaMs =
            startOfDay(form.dueDate).getTime() - originalDue.getTime();
          await TaskService.shiftFutureInstances(
            task.id,
            originalDue.toISOString(),
            deltaMs
          );
          await refreshTasks();
        }
        triggerMedium();
        onTaskUpdated();
      } else {
        console.error("Task update failed:", error);
        Alert.alert("Error", error || "Failed to update task");
      }
    } catch (err) {
      console.error("Error updating task:", err);
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View style={[styles.createTaskContainer, modalAnimatedStyle]}>
        <ModalHeader title="Edit Task" onClose={onClose} />

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
            onSelectCategory={(categoryId) =>
              updateForm("category", categoryId)
            }
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
            label="Description"
            value={form.description}
            onChangeText={(text) => updateForm("description", text)}
            placeholder="Add task details..."
            multiline
            numberOfLines={3}
          />

          <FormField
            label="Estimated Duration (minutes)"
            value={form.estimatedDuration}
            onChangeText={(text) => updateForm("estimatedDuration", text)}
            placeholder="e.g., 30"
            keyboardType="numeric"
            error={errors.estimatedDuration}
          />

          <RecurringTaskToggle
            isRecurring={form.isRecurring}
            onToggleRecurring={(value) => updateForm("isRecurring", value)}
            recurrenceType={form.recurrenceType}
            onSelectRecurrenceType={(value) =>
              updateForm("recurrenceType", value)
            }
            recurrenceOptions={recurrenceOptions}
          />

          {/* Date Picker Field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Due Date
            </Text>
            <TouchableOpacity
              style={[
                styles.datePickerButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 2,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.datePickerText, { color: colors.text }]}>
                {form.dueDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.primary} />
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
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    updateForm("dueDate", selectedDate);
                  }
                }}
                style={[styles.datePicker, { backgroundColor: colors.surface }]}
                textColor={colors.text}
                accentColor={colors.primary}
              />
              <TouchableOpacity
                style={[
                  styles.datePickerDone,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => setShowDatePicker(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          <SubmitButton
            onPress={handleSubmit}
            disabled={!isFormValid}
            title="Update Task"
          />
        </ScrollView>
      </Animated.View>
    </View>
  );
}
