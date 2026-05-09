import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import { useDevice } from "../../../../hooks";
import { DesignSystem } from "../../../../theme/designSystem";
import { intervalOptions } from "../../../Dashboard/modals/create-task-modal/data";
import { styles as sharedStyles } from "./styles";

// IntervalSelectorProps
interface IntervalSelectorProps {
  selectedInterval: number;
  intervalValue: number;
  onSelectInterval: (interval: number) => void;
  onIntervalValueChange: (value: number) => void;
  error?: string;
  /** Increment from parent to close dropdown (backdrop / tap-outside). */
  dismissChromeToken?: number;
}

// IntervalSelector component
export function IntervalSelector({
  selectedInterval,
  intervalValue,
  onSelectInterval,
  onIntervalValueChange,
  error,
  dismissChromeToken = 0,
}: IntervalSelectorProps) {
  const { colors } = useTheme();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const [isOpen, setIsOpen] = useState(false);
  const fontMultiplier = getFontMultiplier();

  useEffect(() => {
    setIsOpen(false);
  }, [dismissChromeToken]);

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
      <Text style={[
        intervalStyles.label, 
        { color: colors.text },
        isTablet && {
          fontSize: ((intervalStyles.label.fontSize || DesignSystem.typography.bodyMedium.fontSize) * fontMultiplier),
        },
      ]}>
        Recurrence Interval
      </Text>

      <TouchableOpacity
        style={[
          intervalStyles.dropdownButton,
          {
            backgroundColor: colors.glass,
            borderColor: error ? colors.error : "rgba(0, 0, 0, 0.1)",
          },
        ]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View style={intervalStyles.dropdownContent}>
          <Text
            style={[
              intervalStyles.dropdownText, 
              { color: colors.text },
              isTablet && {
                fontSize: ((intervalStyles.dropdownText.fontSize || DesignSystem.typography.body.fontSize) * fontMultiplier),
              },
            ]}
            numberOfLines={1}
          >
            {getDisplayText()}
          </Text>
        </View>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
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
                      ? "rgba(52, 152, 219, 0.1)"
                      : "transparent",
                },
                selectedInterval === option.id && [
                  sharedStyles.selectedItemGlow,
                  sharedStyles.selectedItemGlowAlt,
                  sharedStyles.selectedItemGlowAccent,
                ],
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
                  isTablet && {
                    fontSize: ((intervalStyles.dropdownItemText.fontSize || DesignSystem.typography.body.fontSize) * fontMultiplier),
                  },
                ]}
              >
                {option.name}
              </Text>
              <Text
                style={[
                  intervalStyles.dropdownItemDescription,
                  { color: colors.textSecondary },
                  isTablet && {
                    fontSize: ((intervalStyles.dropdownItemDescription.fontSize || DesignSystem.typography.caption.fontSize) * fontMultiplier),
                  },
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
            size={isTablet ? getResponsiveValue(18, 22, 24) : 18}
            color={intervalValue <= 1 ? colors.textSecondary : colors.text}
          />
        </TouchableOpacity>

        <Text style={[
          intervalStyles.stepperValue, 
          { color: colors.text },
          isTablet && {
            fontSize: ((intervalStyles.stepperValue.fontSize || DesignSystem.typography.body.fontSize) * fontMultiplier),
          },
        ]}>
          {intervalValue}
        </Text>

        <TouchableOpacity
          style={[
            intervalStyles.stepperButton,
            { backgroundColor: colors.surface },
          ]}
          onPress={() => handleIntervalValueChange(true)}
        >
          <Ionicons 
            name="add" 
            size={isTablet ? getResponsiveValue(18, 22, 24) : 18} 
            color={colors.text} 
          />
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
