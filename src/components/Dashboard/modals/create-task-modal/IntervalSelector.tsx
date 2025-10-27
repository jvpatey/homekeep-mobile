import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import { DesignSystem } from "../../../../theme/designSystem";
import { intervalOptions } from "../../../Dashboard/modals/create-task-modal/data";

// IntervalSelectorProps
interface IntervalSelectorProps {
  selectedInterval: number;
  intervalValue: number;
  onSelectInterval: (interval: number) => void;
  onIntervalValueChange: (value: number) => void;
  error?: string;
}

// IntervalSelector component
export function IntervalSelector({
  selectedInterval,
  intervalValue,
  onSelectInterval,
  onIntervalValueChange,
  error,
}: IntervalSelectorProps) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const getIntervalLabel = (interval: number) => {
    switch (interval) {
      case 7:
        return "week";
      case 30:
        return "month";
      case 90:
        return "quarter";
      case 365:
        return "year";
      case 0:
        return "days";
      default:
        return "days";
    }
  };

  const getDisplayText = () => {
    if (selectedInterval === 0) {
      return `Every ${intervalValue} ${intervalValue === 1 ? "day" : "days"}`;
    }
    const unit = getIntervalLabel(selectedInterval);
    return `Every ${intervalValue} ${intervalValue === 1 ? unit : unit + "s"}`;
  };

  const handleIntervalValueChange = (increment: boolean) => {
    const newValue = increment
      ? intervalValue + 1
      : Math.max(1, intervalValue - 1);
    onIntervalValueChange(newValue);
  };

  const selectedIntervalOption = intervalOptions.find(
    (opt) => opt.id === selectedInterval
  );

  return (
    <View style={intervalStyles.container}>
      <Text style={[intervalStyles.label, { color: colors.text }]}>
        Recurrence Interval
      </Text>

      <TouchableOpacity
        style={[
          intervalStyles.dropdownButton,
          {
            backgroundColor: colors.glass,
            borderColor: error ? colors.error : colors.glassBorder,
          },
        ]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View style={intervalStyles.dropdownContent}>
          <Text
            style={[intervalStyles.dropdownText, { color: colors.text }]}
            numberOfLines={1}
          >
            {getDisplayText()}
          </Text>
        </View>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {isOpen && (
        <View
          style={[
            intervalStyles.dropdownList,
            {
              backgroundColor: colors.surface,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          {intervalOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                intervalStyles.dropdownItem,
                {
                  backgroundColor:
                    selectedInterval === option.id
                      ? colors.glass
                      : "transparent",
                },
              ]}
              onPress={() => {
                onSelectInterval(option.id);
                if (option.id !== 0) {
                  onIntervalValueChange(1);
                }
                setIsOpen(false);
              }}
            >
              <Text
                style={[
                  intervalStyles.dropdownItemText,
                  {
                    color:
                      selectedInterval === option.id
                        ? colors.primary
                        : colors.text,
                    fontWeight: selectedInterval === option.id ? "700" : "400",
                  },
                ]}
              >
                {option.name}
              </Text>
              <Text
                style={[
                  intervalStyles.dropdownItemDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {option.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Custom Interval Value Stepper */}
      <View
        style={[
          intervalStyles.stepperContainer,
          {
            backgroundColor: colors.glass,
            borderColor: colors.glassBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            intervalStyles.stepperButton,
            { backgroundColor: colors.surface },
          ]}
          onPress={() => handleIntervalValueChange(false)}
          disabled={intervalValue <= 1}
        >
          <Ionicons
            name="remove"
            size={18}
            color={intervalValue <= 1 ? colors.textSecondary : colors.text}
          />
        </TouchableOpacity>

        <Text style={[intervalStyles.stepperValue, { color: colors.text }]}>
          {intervalValue}
        </Text>

        <TouchableOpacity
          style={[
            intervalStyles.stepperButton,
            { backgroundColor: colors.surface },
          ]}
          onPress={() => handleIntervalValueChange(true)}
        >
          <Ionicons name="add" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {error && (
        <Text style={[intervalStyles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const intervalStyles = StyleSheet.create({
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
    ...DesignSystem.shadows.small,
  },
  dropdownContent: {
    flex: 1,
    marginRight: DesignSystem.spacing.sm,
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
  },
  dropdownItemText: {
    ...DesignSystem.typography.body,
    marginBottom: 2,
  },
  dropdownItemDescription: {
    ...DesignSystem.typography.caption,
    fontSize: 12,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: DesignSystem.glass.borderWidth,
    marginTop: DesignSystem.spacing.sm,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    ...DesignSystem.shadows.small,
  },
  stepperValue: {
    ...DesignSystem.typography.h3,
    fontWeight: "700",
    marginHorizontal: DesignSystem.spacing.md,
    minWidth: 40,
    textAlign: "center",
  },
  errorText: {
    ...DesignSystem.typography.caption,
    marginTop: DesignSystem.spacing.xs,
  },
});
