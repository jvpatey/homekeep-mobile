import React, { useState } from "react";
import {
  ScrollView,
  Alert,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  SafeAreaView,
} from "react-native";
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
import { IntervalSelector } from "./IntervalSelector";
import { StartDateSelector } from "./StartDateSelector";
import { ModalHeader } from "./ModalHeader";
import { SubmitButton } from "./SubmitButton";
import { categories, priorities } from "./data";

interface CreateTaskModalProps {
  onClose: () => void;
  onTaskCreated: () => void;
}

interface TaskSeriesForm {
  title: string;
  category: string;
  interval: "weekly" | "monthly" | "yearly" | "custom";
  intervalValue: number;
  startDate: Date;
  priority: "low" | "medium" | "high";
  estimatedDuration: number;
  instructions?: string;
}

export function CreateTaskModal({
  onClose,
  onTaskCreated,
}: CreateTaskModalProps) {
  const { triggerLight, triggerMedium } = useHaptics();
  const { createTask, refreshTasks } = useTasks();
  const { user } = useAuth();
  const { colors } = useTheme();
  const modalAnimatedStyle = useSimpleAnimation(0, 400, 20);

  const [form, setForm] = useState<TaskSeriesForm>({
    title: "",
    category: "",
    interval: "monthly",
    intervalValue: 1,
    startDate: (() => {
      const today = new Date();
      today.setHours(9, 0, 0, 0);
      return today;
    })(),
    priority: "medium",
    estimatedDuration: 30,
    instructions: "",
  });

  const [errors, setErrors] = useState<
    Partial<{ [K in keyof TaskSeriesForm]: string }>
  >({});

  const validateForm = (): boolean => {
    const newErrors: Partial<{ [K in keyof TaskSeriesForm]: string }> = {};

    if (!form.title.trim()) {
      newErrors.title = "Task title is required";
    }

    if (!form.category) {
      newErrors.category = "Please select a category";
    }

    if (!form.estimatedDuration || form.estimatedDuration <= 0) {
      newErrors.estimatedDuration = "Duration must be greater than 0";
    }

    if (!form.intervalValue || form.intervalValue <= 0) {
      newErrors.intervalValue = "Interval value must be greater than 0";
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
      triggerLight();

      // TODO: Implement actual task creation with new data structure
      // For now, just show success and close
      Alert.alert(
        "Task Series Created!",
        `"${form.title}" has been scheduled to repeat every ${
          form.intervalValue
        } ${
          form.interval === "weekly"
            ? "week"
            : form.interval === "monthly"
            ? "month"
            : "year"
        }${form.intervalValue > 1 ? "s" : ""}.`,
        [
          {
            text: "Great!",
            onPress: () => {
              onTaskCreated();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error creating task series:", error);
      Alert.alert("Error", "Failed to create task series. Please try again.");
    }
  };

  const updateForm = (field: keyof TaskSeriesForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const isFormValid = form.title && form.category && form.estimatedDuration > 0;

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
            label="Instructions (Optional)"
            value={form.instructions || ""}
            onChangeText={(text) => updateForm("instructions", text)}
            placeholder="Add detailed instructions for this task..."
            multiline
            numberOfLines={3}
          />

          <FormField
            label="Estimated Duration (minutes)"
            value={form.estimatedDuration.toString()}
            onChangeText={(text) => {
              const num = parseInt(text) || 0;
              setForm((prev) => ({ ...prev, estimatedDuration: num }));
            }}
            placeholder="e.g., 30"
            keyboardType="numeric"
            error={errors.estimatedDuration?.toString()}
            required
          />

          <IntervalSelector
            selectedInterval={form.interval}
            intervalValue={form.intervalValue}
            onSelectInterval={(
              interval: "weekly" | "monthly" | "yearly" | "custom"
            ) => setForm((prev) => ({ ...prev, interval }))}
            onIntervalValueChange={(value) =>
              setForm((prev) => ({ ...prev, intervalValue: value }))
            }
            error={errors.intervalValue?.toString()}
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
              "{form.title}" will be scheduled every {form.intervalValue}{" "}
              {form.interval === "weekly"
                ? "week"
                : form.interval === "monthly"
                ? "month"
                : "year"}
              {form.intervalValue > 1 ? "s" : ""} starting{" "}
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
