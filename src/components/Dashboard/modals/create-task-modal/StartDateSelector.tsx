import React, { useState, useEffect } from "react";
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
import { useDevice } from "../../../../hooks";
import { DesignSystem } from "../../../../theme/designSystem";
import { formControlFill } from "./formChrome";
import { styles as sharedStyles } from "./styles";
import { DatePickerEvent } from "../../../../types/navigation";

// StartDateSelectorProps
interface StartDateSelectorProps {
  startDate: Date;
  onStartDateChange: (date: Date) => void;
  error?: string;
  /** Increment from parent to close quick options and inline date picker. */
  dismissChromeToken?: number;
}

// StartDateSelector component for the CreateTaskModal
export function StartDateSelector({
  startDate,
  onStartDateChange,
  error,
  dismissChromeToken = 0,
}: StartDateSelectorProps) {
  const { colors, isDark } = useTheme();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isQuickOptionsOpen, setIsQuickOptionsOpen] = useState(false);
  const fontMultiplier = getFontMultiplier();

  useEffect(() => {
    setIsQuickOptionsOpen(false);
    setShowDatePicker(false);
  }, [dismissChromeToken]);

  const handleDateChange = (event: DatePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      // Normalize to local noon to avoid UTC boundary shifts when persisted
      const normalized = new Date(selectedDate);
      normalized.setHours(12, 0, 0, 0);
      onStartDateChange(normalized);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getQuickDateOptions = () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

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

  const isQuickOption = () => {
    const options = getQuickDateOptions();
    return options.find(
      (opt) => opt.date.toDateString() === startDate.toDateString()
    );
  };

  const selectedQuickOption = isQuickOption();

  return (
    <View style={dateStyles.container}>
      <Text style={[
        dateStyles.label, 
        { color: colors.text },
        isTablet && {
          fontSize: ((dateStyles.label.fontSize || DesignSystem.typography.bodyMedium.fontSize) * fontMultiplier),
        },
      ]}>Start Date</Text>

      <TouchableOpacity
        style={[
          dateStyles.dropdownButton,
          {
            backgroundColor: formControlFill(isDark),
            borderColor: error ? colors.error : colors.glassStroke,
          },
        ]}
        onPress={() => setIsQuickOptionsOpen(!isQuickOptionsOpen)}
        activeOpacity={0.7}
      >
        <View style={dateStyles.dropdownContent}>
          <Ionicons 
            name="calendar-outline" 
            size={isTablet ? getResponsiveValue(20, 24, 26) : 20} 
            color={colors.primary} 
          />
          <Text
            style={[
              dateStyles.dropdownText,
              { color: colors.text, marginLeft: 8 },
              isTablet && {
                fontSize: ((dateStyles.dropdownText.fontSize || DesignSystem.typography.body.fontSize) * fontMultiplier),
              },
            ]}
          >
            {selectedQuickOption
              ? selectedQuickOption.label
              : formatDate(startDate)}
          </Text>
        </View>
        <Ionicons
          name={isQuickOptionsOpen ? "chevron-up" : "chevron-down"}
          size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {isQuickOptionsOpen && (
        <View
          style={[
            dateStyles.dropdownList,
            {
              backgroundColor: colors.surface,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          {getQuickDateOptions().map((option) => {
            const isSelected =
              option.date.toDateString() === startDate.toDateString();
            return (
              <TouchableOpacity
                key={option.label}
                style={[
                  dateStyles.dropdownItem,
                  {
                    backgroundColor: isSelected
                      ? "rgba(46, 196, 182, 0.1)"
                      : "transparent",
                  },
                  isSelected && [
                    sharedStyles.selectedItemGlow,
                    sharedStyles.selectedItemGlowAlt,
                    sharedStyles.selectedItemGlowAccent,
                  ],
                ]}
                onPress={() => {
                  onStartDateChange(option.date);
                  setIsQuickOptionsOpen(false);
                }}
              >
                <Text
                  style={[
                    dateStyles.dropdownItemText,
                    {
                      color: isSelected ? colors.primary : colors.text,
                      fontWeight: isSelected ? "700" : "400",
                    },
                    isTablet && {
                      fontSize: ((dateStyles.dropdownItemText.fontSize || DesignSystem.typography.body.fontSize) * fontMultiplier),
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[
              dateStyles.dropdownItem,
              {
                backgroundColor: !selectedQuickOption
                  ? "rgba(46, 196, 182, 0.1)"
                  : "transparent",
                borderTopWidth: 1,
                borderTopColor: "rgba(0, 0, 0, 0.1)",
              },
              !selectedQuickOption && [
                sharedStyles.selectedItemGlow,
                sharedStyles.selectedItemGlowAlt,
                sharedStyles.selectedItemGlowAccent,
              ],
            ]}
            onPress={() => {
              setShowDatePicker(true);
              setIsQuickOptionsOpen(false);
            }}
          >
            <View style={dateStyles.customOptionContainer}>
              <Ionicons 
                name="calendar" 
                size={isTablet ? getResponsiveValue(18, 22, 24) : 18} 
                color={colors.primary} 
              />
              <Text
                style={[
                  dateStyles.dropdownItemText,
                  {
                    color: !selectedQuickOption ? colors.primary : colors.text,
                    fontWeight: !selectedQuickOption ? "700" : "400",
                  },
                  { marginLeft: 8, flex: 1 },
                  isTablet && {
                    fontSize: ((dateStyles.dropdownItemText.fontSize || DesignSystem.typography.body.fontSize) * fontMultiplier),
                  },
                ]}
              >
                Custom Date
              </Text>
              <Text
                style={[
                  dateStyles.customDateText,
                  { color: colors.textSecondary },
                  isTablet && {
                    fontSize: ((dateStyles.customDateText.fontSize || DesignSystem.typography.caption.fontSize) * fontMultiplier),
                  },
                ]}
              >
                {formatDate(startDate)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Date Picker */}
      {showDatePicker && (
        <View
          style={[
            dateStyles.datePickerContainer,
            {
              backgroundColor: colors.glass,
              borderColor: colors.glassBorder,
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
            themeVariant={isDark ? "dark" : "light"}
            style={[dateStyles.datePicker, { backgroundColor: colors.surface }]}
          />
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={[
                dateStyles.datePickerDone,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={[
                dateStyles.datePickerDoneText, 
                { color: "white" },
                isTablet && {
                  fontSize: ((dateStyles.datePickerDoneText.fontSize || DesignSystem.typography.body.fontSize) * fontMultiplier),
                },
              ]}>
                Done
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {error && (
        <Text style={[dateStyles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const dateStyles = StyleSheet.create({
  container: {
    marginBottom: DesignSystem.spacing.md,
  },
  label: {
    ...DesignSystem.typography.bodyMedium,
    fontWeight: "600",
    marginBottom: DesignSystem.spacing.sm,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: DesignSystem.glass.borderWidth,
    minHeight: DesignSystem.components.inputLarge,
  },
  dropdownContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dropdownText: {
    ...DesignSystem.typography.body,
    fontWeight: "600",
  },
  dropdownList: {
    marginTop: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: DesignSystem.glass.borderWidth,
    overflow: "hidden",
    ...DesignSystem.shadows.medium,
  },
  dropdownItem: {
    padding: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.xs,
  },
  dropdownItemText: {
    ...DesignSystem.typography.body,
  },
  customOptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  customDateText: {
    ...DesignSystem.typography.caption,
    marginLeft: "auto",
  },
  datePickerContainer: {
    marginTop: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 1,
    ...DesignSystem.shadows.medium,
  },
  datePicker: {
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
    ...DesignSystem.typography.body,
    fontWeight: "600",
  },
  errorText: {
    ...DesignSystem.typography.caption,
    marginTop: DesignSystem.spacing.xs,
  },
});
