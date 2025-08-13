import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignSystem } from "../../../theme/designSystem";
import { useTheme } from "../../../context/ThemeContext";

export type PriorityFilter = "all" | "urgent" | "high" | "medium" | "low";

interface PriorityFilterButtonProps {
  selectedPriority: PriorityFilter;
  onPriorityChange: (priority: PriorityFilter) => void;
  style?: any;
}

const PRIORITY_OPTIONS: {
  value: PriorityFilter;
  label: string;
  icon: string;
  color: string;
}[] = [
  { value: "all", label: "All Tasks", icon: "list", color: "#6B7280" },
  {
    value: "urgent",
    label: "Urgent",
    icon: "alert",
    color: "#DC2626",
  },
  {
    value: "high",
    label: "High Priority",
    icon: "chevron-up",
    color: "#EF4444",
  },
  {
    value: "medium",
    label: "Medium Priority",
    icon: "remove",
    color: "#F59E0B",
  },
  {
    value: "low",
    label: "Low Priority",
    icon: "chevron-down",
    color: "#10B981",
  },
];

export function PriorityFilterButton({
  selectedPriority,
  onPriorityChange,
  style,
}: PriorityFilterButtonProps) {
  const { colors } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handlePrioritySelect = (priority: PriorityFilter) => {
    onPriorityChange(priority);
    setIsModalVisible(false);
  };

  const selectedOption = PRIORITY_OPTIONS.find(
    (option) => option.value === selectedPriority
  );

  return (
    <>
      <TouchableOpacity
        style={[
          styles.filterButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          style,
        ]}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={(selectedOption?.icon as any) || "list"}
          size={16}
          color={selectedOption?.color || "#6B7280"}
        />
        <Text style={[styles.filterText, { color: colors.text }]}>
          {selectedOption?.label || "All Tasks"}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Filter by Priority
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.border + "20" },
                ]}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsContainer}>
              {PRIORITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: colors.border + "10",
                      borderColor: colors.border,
                    },
                    selectedPriority === option.value && [
                      styles.selectedOption,
                      {
                        backgroundColor: colors.primary + "20",
                        borderColor: colors.primary,
                        shadowColor: colors.primary,
                      },
                    ],
                  ]}
                  onPress={() => handlePrioritySelect(option.value)}
                >
                  <View style={styles.optionLeft}>
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={option.color}
                      style={styles.optionIcon}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        { color: colors.textSecondary },
                        selectedPriority === option.value && [
                          styles.selectedOptionText,
                          { color: colors.primary },
                        ],
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                  {selectedPriority === option.value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.sm + 6, // 14px
    paddingVertical: DesignSystem.spacing.sm + 2, // 10px
    borderRadius: DesignSystem.borders.radius.medium,
    gap: DesignSystem.spacing.xs + 2, // 6px
    minHeight: DesignSystem.components.buttonSmall,
    ...DesignSystem.shadows.medium,
    borderWidth: DesignSystem.borders.width,
  },
  filterText: {
    ...DesignSystem.typography.smallSemiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    minWidth: 320,
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
  },
  optionsContainer: {
    padding: 24,
    gap: 8,
  },
  optionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    marginVertical: 2,
  },
  selectedOption: {
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 17,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  selectedOptionText: {
    fontWeight: "700",
  },
});
