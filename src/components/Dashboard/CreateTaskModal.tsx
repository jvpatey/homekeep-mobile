import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { TextInput, Button, Chip } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useSimpleAnimation, useGradients, useHaptics } from "../../hooks";
import { styles } from "./styles";

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

/**
 * CreateTaskModal - Modern task creation form with iOS design patterns
 * Features form validation, category selection, and smooth animations
 */
export function CreateTaskModal({
  onClose,
  onTaskCreated,
}: CreateTaskModalProps) {
  const { colors } = useTheme();
  const { primaryGradient } = useGradients();
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

  const categories = [
    { id: "hvac", name: "HVAC", icon: "thermometer-outline", color: "#FF6B6B" },
    {
      id: "plumbing",
      name: "Plumbing",
      icon: "water-outline",
      color: "#9B59B6",
    },
    {
      id: "electrical",
      name: "Electrical",
      icon: "flash-outline",
      color: "#3498DB",
    },
    {
      id: "exterior",
      name: "Exterior",
      icon: "home-outline",
      color: "#4ECDC4",
    },
    {
      id: "safety",
      name: "Safety",
      icon: "shield-checkmark-outline",
      color: "#FFA726",
    },
    {
      id: "appliances",
      name: "Appliances",
      icon: "tv-outline",
      color: "#2ECC71",
    },
  ];

  const priorities = [
    { id: "low", name: "Low", color: "#95A5A6" },
    { id: "medium", name: "Medium", color: "#3498DB" },
    { id: "high", name: "High", color: "#E74C3C" },
    { id: "urgent", name: "Urgent", color: "#8E44AD" },
  ];

  const recurrenceOptions = [
    { id: "weekly", name: "Weekly" },
    { id: "monthly", name: "Monthly" },
    { id: "quarterly", name: "Quarterly" },
    { id: "yearly", name: "Yearly" },
  ];

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

  return (
    <Animated.View style={[styles.createTaskContainer, modalAnimatedStyle]}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.modalTitle, { color: colors.text }]}>
          Create Task
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.modalContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Task Title */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Task Title *
          </Text>
          <TextInput
            value={form.title}
            onChangeText={(text) => updateForm("title", text)}
            placeholder="Enter task title..."
            style={[styles.textInput, { backgroundColor: colors.surface }]}
            textColor={colors.text}
            placeholderTextColor={colors.textSecondary}
            mode="flat"
            error={!!errors.title}
          />
          {errors.title && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.title}
            </Text>
          )}
        </View>

        {/* Category Selection */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Category *
          </Text>
          <View style={styles.chipContainer}>
            {categories.map((category) => (
              <Chip
                key={category.id}
                selected={form.category === category.id}
                onPress={() => updateForm("category", category.id)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      form.category === category.id
                        ? category.color + "20"
                        : colors.surface,
                    borderWidth: 1,
                    borderColor:
                      form.category === category.id
                        ? category.color + "40"
                        : colors.border,
                  },
                ]}
                textStyle={[
                  styles.chipText,
                  {
                    color:
                      form.category === category.id
                        ? category.color
                        : colors.textSecondary,
                  },
                ]}
                icon={() => (
                  <Ionicons
                    name={category.icon as any}
                    size={16}
                    color={
                      form.category === category.id
                        ? category.color
                        : colors.textSecondary
                    }
                  />
                )}
              >
                {category.name}
              </Chip>
            ))}
          </View>
          {errors.category && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.category}
            </Text>
          )}
        </View>

        {/* Priority Selection */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Priority
          </Text>
          <View style={styles.chipContainer}>
            {priorities.map((priority) => (
              <Chip
                key={priority.id}
                selected={form.priority === priority.id}
                onPress={() => updateForm("priority", priority.id)}
                style={[
                  styles.priorityChip,
                  {
                    backgroundColor:
                      form.priority === priority.id
                        ? priority.color + "20"
                        : colors.surface,
                    borderWidth: 1,
                    borderColor:
                      form.priority === priority.id
                        ? priority.color + "40"
                        : colors.border,
                  },
                ]}
                textStyle={[
                  styles.chipText,
                  {
                    color:
                      form.priority === priority.id
                        ? priority.color
                        : colors.textSecondary,
                  },
                ]}
              >
                {priority.name}
              </Chip>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Description
          </Text>
          <TextInput
            value={form.description}
            onChangeText={(text) => updateForm("description", text)}
            placeholder="Add task details..."
            style={[styles.textArea, { backgroundColor: colors.surface }]}
            textColor={colors.text}
            placeholderTextColor={colors.textSecondary}
            mode="flat"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Estimated Duration */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Estimated Duration (minutes)
          </Text>
          <TextInput
            value={form.estimatedDuration}
            onChangeText={(text) => updateForm("estimatedDuration", text)}
            placeholder="30"
            style={[styles.textInput, { backgroundColor: colors.surface }]}
            textColor={colors.text}
            placeholderTextColor={colors.textSecondary}
            mode="flat"
            keyboardType="numeric"
            error={!!errors.estimatedDuration}
          />
          {errors.estimatedDuration && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.estimatedDuration}
            </Text>
          )}
        </View>

        {/* Recurring Task Toggle */}
        <View style={styles.inputGroup}>
          <TouchableOpacity
            style={styles.recurringToggle}
            onPress={() => updateForm("isRecurring", !form.isRecurring)}
          >
            <View style={styles.recurringLeft}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: colors.text, marginBottom: 0 },
                ]}
              >
                Recurring Task
              </Text>
              <Text
                style={[
                  styles.recurringSubtext,
                  { color: colors.textSecondary },
                ]}
              >
                Schedule regular maintenance
              </Text>
            </View>
            <Ionicons
              name={form.isRecurring ? "checkbox" : "square-outline"}
              size={24}
              color={form.isRecurring ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>

          {form.isRecurring && (
            <View style={styles.chipContainer}>
              {recurrenceOptions.map((option) => (
                <Chip
                  key={option.id}
                  selected={form.recurrenceType === option.id}
                  onPress={() => updateForm("recurrenceType", option.id)}
                  style={[
                    styles.recurrenceChip,
                    {
                      backgroundColor:
                        form.recurrenceType === option.id
                          ? colors.primary + "20"
                          : colors.surface,
                      borderWidth: 1,
                      borderColor:
                        form.recurrenceType === option.id
                          ? colors.primary + "40"
                          : colors.border,
                    },
                  ]}
                  textStyle={[
                    styles.chipText,
                    {
                      color:
                        form.recurrenceType === option.id
                          ? colors.primary
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {option.name}
                </Chip>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.modalFooter}>
        <TouchableOpacity
          onPress={handleSubmit}
          style={[
            styles.submitButton,
            { opacity: form.title && form.category ? 1 : 0.6 },
          ]}
          disabled={!form.title || !form.category}
        >
          <LinearGradient
            colors={primaryGradient}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.submitButtonText}>Create Task</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
