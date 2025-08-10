import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Chip } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { styles } from "../styles";

interface RecurrenceOption {
  id: string;
  name: string;
}

interface RecurringTaskToggleProps {
  isRecurring: boolean;
  recurrenceType?: string;
  onToggleRecurring: (isRecurring: boolean) => void;
  onSelectRecurrenceType: (recurrenceType: string) => void;
  recurrenceOptions: RecurrenceOption[];
}

// RecurringTaskToggle component for the CreateTaskModal
export function RecurringTaskToggle({
  isRecurring,
  recurrenceType,
  onToggleRecurring,
  onSelectRecurrenceType,
  recurrenceOptions,
}: RecurringTaskToggleProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.inputGroup}>
      <TouchableOpacity
        style={styles.recurringToggle}
        onPress={() => onToggleRecurring(!isRecurring)}
      >
        <View style={styles.recurringLeft}>
          <Text
            style={[styles.inputLabel, { color: colors.text, marginBottom: 0 }]}
          >
            Recurring Task
          </Text>
          <Text
            style={[styles.recurringSubtext, { color: colors.textSecondary }]}
          >
            Schedule regular maintenance
          </Text>
        </View>
        <Ionicons
          name={isRecurring ? "checkbox" : "square-outline"}
          size={24}
          color={isRecurring ? colors.primary : colors.textSecondary}
        />
      </TouchableOpacity>

      {isRecurring && (
        <View style={styles.chipContainer}>
          {recurrenceOptions.map((option) => (
            <Chip
              key={option.id}
              selected={recurrenceType === option.id}
              onPress={() => onSelectRecurrenceType(option.id)}
              style={[
                styles.recurrenceChip,
                {
                  backgroundColor:
                    recurrenceType === option.id
                      ? colors.primary + "20"
                      : colors.surface,
                  borderWidth: 1,
                  borderColor:
                    recurrenceType === option.id
                      ? colors.primary + "40"
                      : colors.border,
                },
              ]}
              textStyle={[
                styles.chipText,
                {
                  color:
                    recurrenceType === option.id
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
  );
}
