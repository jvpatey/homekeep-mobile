import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import { DesignSystem } from "../../../../theme/designSystem";
import {
  intervalOptions,
  intervalValueExamples,
} from "../../../Dashboard/modals/create-task-modal/data";

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

  const handleIntervalValueChange = (increment: boolean) => {
    const newValue = increment
      ? intervalValue + 1
      : Math.max(1, intervalValue - 1);
    onIntervalValueChange(newValue);
  };

  const getIntervalMultiplier = (
    selectedInterval: number,
    intervalValue: number
  ) => {
    if (selectedInterval === 0) {
      // Custom interval - show the actual days
      return intervalValue;
    } else {
      return intervalValue;
    }
  };

  // getIntervalLabel function
  const getIntervalLabel = (days: number) => {
    if (days === 7) return "week";
    if (days === 30) return "month";
    if (days === 90) return "quarter";
    if (days === 365) return "year";
    return "day";
  };

  const getIntervalLabelPlural = (days: number) => {
    const label = getIntervalLabel(days);
    return intervalValue > 1 ? `${label}s` : label;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>
        Recurrence Interval
      </Text>

      {/* Interval Type Selection */}
      <View style={styles.intervalTypeContainer}>
        {intervalOptions.map((option) => {
          const isSelected = selectedInterval === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.intervalOption,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  transform: [{ scale: isSelected ? 1.02 : 1 }],
                  ...DesignSystem.shadows.small,
                },
              ]}
              onPress={() => {
                onSelectInterval(option.id);
                // Reset interval value to 1 when selecting a predefined interval
                if (option.id !== 0) {
                  onIntervalValueChange(1);
                }
              }}
            >
              <Text
                style={[
                  styles.intervalOptionText,
                  {
                    color: isSelected ? "white" : colors.text,
                    fontWeight: isSelected ? "700" : "600",
                  },
                ]}
              >
                {option.name}
              </Text>
              <Text
                style={[
                  styles.intervalDescription,
                  {
                    color: isSelected
                      ? "rgba(255, 255, 255, 0.9)"
                      : colors.textSecondary,
                    fontWeight: isSelected ? "500" : "400",
                  },
                ]}
              >
                {option.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Interval Value Selection */}
      <View
        style={[
          styles.intervalValueContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.intervalValueLabel, { color: colors.text }]}>
          Every {getIntervalMultiplier(selectedInterval, intervalValue)}{" "}
          {getIntervalLabelPlural(selectedInterval)}
        </Text>

        <View style={styles.valueControls}>
          <TouchableOpacity
            style={[
              styles.valueButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                ...DesignSystem.shadows.small,
              },
            ]}
            onPress={() => handleIntervalValueChange(false)}
          >
            <Ionicons name="remove" size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.valueDisplay, { color: colors.text }]}>
            {intervalValue}
          </Text>

          <TouchableOpacity
            style={[
              styles.valueButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                ...DesignSystem.shadows.small,
              },
            ]}
            onPress={() => handleIntervalValueChange(true)}
          >
            <Ionicons name="add" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.exampleText, { color: colors.textSecondary }]}>
          {
            intervalValueExamples[
              selectedInterval as keyof typeof intervalValueExamples
            ]
          }
        </Text>
      </View>

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
  intervalTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.lg,
  },
  intervalOption: {
    flex: 1,
    minWidth: 80,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 2,
    alignItems: "center",
  },
  intervalOptionText: {
    fontSize: DesignSystem.typography.caption.fontSize,
    fontWeight: "600",
    marginBottom: DesignSystem.spacing.xs,
    letterSpacing: 0.1,
    textAlign: "center",
  },
  intervalDescription: {
    fontSize: DesignSystem.typography.caption.fontSize,
    textAlign: "center",
    letterSpacing: 0.1,
    lineHeight: 14,
  },
  intervalValueContainer: {
    alignItems: "center",
    padding: DesignSystem.spacing.lg,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: 1,
    ...DesignSystem.shadows.small,
  },
  intervalValueLabel: {
    fontSize: DesignSystem.typography.bodyMedium.fontSize,
    fontWeight: "600",
    marginBottom: DesignSystem.spacing.md,
    textAlign: "center",
    color: "#1F2937",
  },
  valueControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  valueButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  valueDisplay: {
    fontSize: DesignSystem.typography.h3.fontSize,
    fontWeight: "700",
    minWidth: 44,
    textAlign: "center",
    color: "#1F2937",
  },
  exampleText: {
    fontSize: DesignSystem.typography.caption.fontSize,
    fontStyle: "italic",
    textAlign: "center",
    color: "#6B7280",
  },
  errorText: {
    fontSize: DesignSystem.typography.caption.fontSize,
    color: "#EF4444",
    marginTop: DesignSystem.spacing.sm,
    fontWeight: "500",
  },
});
