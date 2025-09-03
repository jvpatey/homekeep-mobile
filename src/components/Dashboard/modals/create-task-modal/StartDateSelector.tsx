import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import { DesignSystem } from "../../../../theme/designSystem";
import { DatePickerEvent } from "../../../../types/navigation";

// StartDateSelectorProps
interface StartDateSelectorProps {
  startDate: Date;
  onStartDateChange: (date: Date) => void;
  error?: string;
}

// StartDateSelector component for the CreateTaskModal
export function StartDateSelector({
  startDate,
  onStartDateChange,
  error,
}: StartDateSelectorProps) {
  const { colors } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: DatePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      onStartDateChange(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getQuickDateOptions = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return [
      { label: "Today", date: today },
      { label: "Tomorrow", date: tomorrow },
      { label: "Next Week", date: nextWeek },
      { label: "Next Month", date: nextMonth },
    ];
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>

      {/* Quick Date Options */}
      <View style={styles.quickOptionsContainer}>
        {getQuickDateOptions().map((option) => {
          const isSelected =
            startDate.toDateString() === option.date.toDateString();
          return (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.quickOption,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  transform: [{ scale: isSelected ? 1.02 : 1 }],
                  ...DesignSystem.shadows.small,
                },
              ]}
              onPress={() => onStartDateChange(option.date)}
            >
              <Text
                style={[
                  styles.quickOptionText,
                  {
                    color: isSelected ? "white" : colors.text,
                    fontWeight: isSelected ? "700" : "600",
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom Date Selection */}
      <View style={styles.customDateContainer}>
        <Text style={[styles.customDateLabel, { color: colors.text }]}>
          Custom Start Date
        </Text>

        <TouchableOpacity
          style={[
            styles.dateButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              ...DesignSystem.shadows.small,
            },
          ]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.text} />
          <Text style={[styles.dateButtonText, { color: colors.text }]}>
            {formatDate(startDate)}
          </Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <View
          style={[
            styles.datePickerContainer,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              ...DesignSystem.shadows.medium,
            },
          ]}
        >
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
            minimumDate={new Date()}
            textColor={colors.text}
            themeVariant={colors.background === "#FFFFFF" ? "light" : "dark"}
            style={styles.datePicker}
          />
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={[
                styles.datePickerDone,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={[styles.datePickerDoneText, { color: "white" }]}>
                Done
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DesignSystem.spacing.lg,
  },
  label: {
    fontSize: DesignSystem.typography.bodyMedium.fontSize,
    fontWeight: "600",
    marginBottom: DesignSystem.spacing.md,
    color: "#1F2937",
  },
  quickOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
  },
  quickOption: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: 2,
  },
  quickOptionText: {
    fontSize: DesignSystem.typography.small.fontSize,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  customDateContainer: {
    marginBottom: DesignSystem.spacing.sm,
  },
  customDateLabel: {
    fontSize: DesignSystem.typography.small.fontSize,
    fontWeight: "600",
    marginBottom: DesignSystem.spacing.sm,
    color: "#374151",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 2,
    gap: DesignSystem.spacing.sm,
  },
  dateButtonText: {
    flex: 1,
    fontSize: DesignSystem.typography.body.fontSize,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  datePickerContainer: {
    marginTop: DesignSystem.spacing.md,
    alignItems: "center",
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: 1,
  },
  datePicker: {
    backgroundColor: "white",
    borderRadius: DesignSystem.borders.radius.medium,
    minHeight: 120,
  },
  datePickerDone: {
    marginTop: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.medium,
    alignItems: "center",
    ...DesignSystem.shadows.small,
  },
  datePickerDoneText: {
    fontSize: DesignSystem.typography.body.fontSize,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  errorText: {
    fontSize: DesignSystem.typography.caption.fontSize,
    color: "#EF4444",
    marginTop: DesignSystem.spacing.sm,
    fontWeight: "500",
  },
});
