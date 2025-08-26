import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { intervalOptions, intervalValueExamples } from "./data";

interface IntervalSelectorProps {
  selectedInterval: number;
  intervalValue: number;
  onSelectInterval: (interval: number) => void;
  onIntervalValueChange: (value: number) => void;
  error?: string;
}

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
      // For predefined intervals, return the intervalValue directly
      // This will show "2" when intervalValue is 2, "3" when it's 3, etc.
      return intervalValue;
    }
  };

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
        {intervalOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.intervalOption,
              {
                backgroundColor:
                  selectedInterval === option.id
                    ? colors.primary
                    : colors.surface,
                borderColor:
                  selectedInterval === option.id
                    ? colors.primary
                    : colors.border,
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
                  color: selectedInterval === option.id ? "white" : colors.text,
                },
              ]}
            >
              {option.name}
            </Text>
            <Text
              style={[
                styles.intervalDescription,
                {
                  color:
                    selectedInterval === option.id
                      ? "white"
                      : colors.textSecondary,
                },
              ]}
            >
              {option.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Interval Value Selection */}
      <View style={styles.intervalValueContainer}>
        <Text style={[styles.intervalValueLabel, { color: colors.text }]}>
          Every {getIntervalMultiplier(selectedInterval, intervalValue)}{" "}
          {getIntervalLabelPlural(selectedInterval)}
        </Text>

        <View style={styles.valueControls}>
          <TouchableOpacity
            style={[styles.valueButton, { backgroundColor: colors.surface }]}
            onPress={() => handleIntervalValueChange(false)}
          >
            <Ionicons name="remove" size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.valueDisplay, { color: colors.text }]}>
            {intervalValue}
          </Text>

          <TouchableOpacity
            style={[styles.valueButton, { backgroundColor: colors.surface }]}
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
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  intervalTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  intervalOption: {
    flex: 1,
    minWidth: 80,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
  },
  intervalOptionText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  intervalDescription: {
    fontSize: 12,
    textAlign: "center",
  },
  intervalValueContainer: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 12,
  },
  intervalValueLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  valueControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  valueButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  valueDisplay: {
    fontSize: 24,
    fontWeight: "700",
    minWidth: 40,
    textAlign: "center",
  },
  exampleText: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
  errorText: {
    fontSize: 12,
    color: "#E74C3C",
    marginTop: 8,
  },
});
