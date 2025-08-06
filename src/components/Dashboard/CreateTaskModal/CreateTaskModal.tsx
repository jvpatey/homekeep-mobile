import React, { useState } from "react";
import { ScrollView } from "react-native";
import Animated from "react-native-reanimated";
import { useSimpleAnimation, useHaptics } from "../../../hooks";
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
}

// CreateTaskModal - Features form validation, category selection, and smooth animations

export function CreateTaskModal({
  onClose,
  onTaskCreated,
}: CreateTaskModalProps) {
  const { triggerLight, triggerMedium } = useHaptics();
  const modalAnimatedStyle = useSimpleAnimation(0, 400, 20);

  const [form, setForm] = useState<TaskForm>({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    estimatedDuration: "",
    isRecurring: false,
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

  const handleSubmit = () => {
    if (!validateForm()) {
      triggerLight();
      return;
    }

    triggerMedium();

    // TODO: Submit to API
    console.log("Creating task:", form);

    // Simulate API call
    setTimeout(() => {
      onTaskCreated();
    }, 500);
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
