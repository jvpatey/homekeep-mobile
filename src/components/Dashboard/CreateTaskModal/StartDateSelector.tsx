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
import { useTheme } from "../../../context/ThemeContext";

interface StartDateSelectorProps {
  startDate: Date;
  onStartDateChange: (date: Date) => void;
  error?: string;
}

export function StartDateSelector({
  startDate,
  onStartDateChange,
  error,
}: StartDateSelectorProps) {
  const { colors } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
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
        {getQuickDateOptions().map((option) => (
          <TouchableOpacity
            key={option.label}
            style={[
              styles.quickOption,
              {
                backgroundColor:
                  startDate.toDateString() === option.date.toDateString()
                    ? colors.primary
                    : colors.surface,
                borderColor:
                  startDate.toDateString() === option.date.toDateString()
                    ? colors.primary
                    : colors.border,
              },
            ]}
            onPress={() => onStartDateChange(option.date)}
          >
            <Text
              style={[
                styles.quickOptionText,
                {
                  color:
                    startDate.toDateString() === option.date.toDateString()
                      ? colors.primary
                      : colors.text,
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Date Selection */}
      <View style={styles.customDateContainer}>
        <Text style={[styles.customDateLabel, { color: colors.text }]}>
          Custom Start Date
        </Text>

        <TouchableOpacity
          style={[
            styles.dateButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
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
            { backgroundColor: colors.background },
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
              <Text
                style={[styles.datePickerDoneText, { color: colors.primary }]}
              >
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
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  quickOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  quickOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  quickOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  customDateContainer: {
    marginBottom: 8,
  },
  customDateLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  datePickerContainer: {
    marginTop: 16,
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  datePicker: {
    backgroundColor: "white",
    borderRadius: 12,
    minHeight: 120,
  },
  datePickerDone: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    color: "#E74C3C",
    marginTop: 8,
  },
});
