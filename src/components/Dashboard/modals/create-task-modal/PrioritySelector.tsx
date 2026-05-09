import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import { useDevice } from "../../../../hooks";
import { DesignSystem } from "../../../../theme/designSystem";
import { Priority } from "../../../../types/maintenance";
import { formControlFill } from "./formChrome";
import { styles as sharedStyles } from "./styles";

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
  /** Increment from parent to close dropdown (backdrop / tap-outside). */
  dismissChromeToken?: number;
}

// PrioritySelector component for the CreateTaskModal
export function PrioritySelector({
  priorities,
  selectedPriority,
  onSelectPriority,
  dismissChromeToken = 0,
}: PrioritySelectorProps) {
  const { colors, isDark } = useTheme();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const [isOpen, setIsOpen] = useState(false);
  const fontMultiplier = getFontMultiplier();

  useEffect(() => {
    setIsOpen(false);
  }, [dismissChromeToken]);

  const selectedPriorityData = priorities.find(
    (p) => p.id === selectedPriority
  );

  return (
    <View style={priorityStyles.container}>
      <Text style={[
        priorityStyles.label, 
        { color: colors.text },
        isTablet && {
          fontSize: ((priorityStyles.label.fontSize || DesignSystem.typography.bodyMedium.fontSize) * fontMultiplier),
        },
      ]}>
        Priority
      </Text>

      <TouchableOpacity
        style={[
          priorityStyles.dropdownButton,
          {
            backgroundColor: formControlFill(isDark),
            borderColor: colors.glassStroke,
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
              isTablet && {
                width: getResponsiveValue(12, 16, 18),
                height: getResponsiveValue(12, 16, 18),
                borderRadius: getResponsiveValue(6, 8, 9),
              },
            ]}
          />
          <Text
            style={[
              priorityStyles.dropdownText,
              { color: colors.text, marginLeft: 8 },
              isTablet && {
                fontSize: ((priorityStyles.dropdownText.fontSize || DesignSystem.typography.body.fontSize) * fontMultiplier),
              },
            ]}
          >
            {selectedPriorityData?.name || "Select Priority"}
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
                      ? "rgba(52, 152, 219, 0.1)"
                      : "transparent",
                },
                selectedPriority === priority.id && [
                  sharedStyles.selectedItemGlow,
                  sharedStyles.selectedItemGlowAlt,
                  sharedStyles.selectedItemGlowAccent,
                ],
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
                  isTablet && {
                    width: getResponsiveValue(12, 16, 18),
                    height: getResponsiveValue(12, 16, 18),
                    borderRadius: getResponsiveValue(6, 8, 9),
                  },
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
                  isTablet && {
                    fontSize: ((priorityStyles.dropdownItemText.fontSize || DesignSystem.typography.body.fontSize) * fontMultiplier),
                  },
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
