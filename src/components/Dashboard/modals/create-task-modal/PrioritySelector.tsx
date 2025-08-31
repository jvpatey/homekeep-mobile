import React from "react";
import { View, Text } from "react-native";
import { Chip } from "react-native-paper";
import { useTheme } from "../../../../context/ThemeContext";
import { styles } from "./styles";
import { Priority } from "../../../../types/maintenance";

// PriorityOption interface
interface PriorityOption {
  id: Priority;
  name: string;
  color: string;
}

interface PrioritySelectorProps {
  priorities: PriorityOption[];
  selectedPriority: Priority;
  onSelectPriority: (priorityId: Priority) => void;
}

// PrioritySelector component for the CreateTaskModal
export function PrioritySelector({
  priorities,
  selectedPriority,
  onSelectPriority,
}: PrioritySelectorProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>Priority</Text>
      <View style={styles.chipContainer}>
        {priorities.map((priority) => (
          <Chip
            key={priority.id}
            selected={selectedPriority === priority.id}
            onPress={() => onSelectPriority(priority.id)}
            style={[
              styles.priorityChip,
              {
                backgroundColor:
                  selectedPriority === priority.id
                    ? priority.color + "20"
                    : colors.surface,
                borderWidth: 1,
                borderColor:
                  selectedPriority === priority.id
                    ? priority.color + "40"
                    : colors.border,
              },
            ]}
            textStyle={[
              styles.chipText,
              {
                color:
                  selectedPriority === priority.id
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
  );
}
