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
        {priorities.map((priority) => {
          const isSelected = selectedPriority === priority.id;
          return (
            <Chip
              key={priority.id}
              selected={isSelected}
              onPress={() => onSelectPriority(priority.id)}
              style={[
                styles.priorityChip,
                {
                  backgroundColor: isSelected 
                    ? priority.color + "15" 
                    : colors.surface,
                  borderColor: isSelected 
                    ? priority.color 
                    : colors.border,
                  transform: [{ scale: isSelected ? 1.02 : 1 }],
                },
              ]}
              textStyle={[
                styles.chipText,
                {
                  color: isSelected 
                    ? priority.color 
                    : colors.textSecondary,
                  fontWeight: isSelected ? "700" : "600",
                },
              ]}
            >
              {priority.name}
            </Chip>
          );
        })}
      </View>
    </View>
  );
}
