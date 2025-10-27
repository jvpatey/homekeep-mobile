import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import { DesignSystem } from "../../../../theme/designSystem";
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
  const [isOpen, setIsOpen] = useState(false);

  const selectedPriorityData = priorities.find(
    (p) => p.id === selectedPriority
  );

  return (
    <View style={priorityStyles.container}>
      <Text style={[priorityStyles.label, { color: colors.text }]}>
        Priority
      </Text>

      <TouchableOpacity
        style={[
          priorityStyles.dropdownButton,
          {
            backgroundColor: colors.glass,
            borderColor: colors.glassBorder,
          },
        ]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View style={priorityStyles.dropdownContent}>
          <View
            style={[
              priorityStyles.colorDot,
              { backgroundColor: selectedPriorityData?.color || colors.border },
            ]}
          />
          <Text
            style={[
              priorityStyles.dropdownText,
              { color: colors.text, marginLeft: 8 },
            ]}
          >
            {selectedPriorityData?.name || "Select Priority"}
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
            priorityStyles.dropdownList,
            {
              backgroundColor: colors.surface,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          {priorities.map((priority) => (
            <TouchableOpacity
              key={priority.id}
              style={[
                priorityStyles.dropdownItem,
                {
                  backgroundColor:
                    selectedPriority === priority.id
                      ? colors.glass
                      : "transparent",
                },
              ]}
              onPress={() => {
                onSelectPriority(priority.id);
                setIsOpen(false);
              }}
            >
              <View
                style={[
                  priorityStyles.colorDot,
                  { backgroundColor: priority.color },
                ]}
              />
              <Text
                style={[
                  priorityStyles.dropdownItemText,
                  {
                    color:
                      selectedPriority === priority.id
                        ? priority.color
                        : colors.text,
                    fontWeight:
                      selectedPriority === priority.id ? "700" : "400",
                  },
                  { marginLeft: 8 },
                ]}
              >
                {priority.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const priorityStyles = StyleSheet.create({
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
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
    flexDirection: "row",
    alignItems: "center",
    padding: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  dropdownItemText: {
    ...DesignSystem.typography.body,
    flex: 1,
  },
});
