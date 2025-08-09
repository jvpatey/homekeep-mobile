import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTasks } from "../../../context/TasksContext";
import { TimeRange } from "../../../context/TasksContext";
import { useGradients } from "../../../hooks/useGradients";

interface FilterButtonProps {
  style?: any;
}

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 30, label: "30 Days" },
  { value: 60, label: "60 Days" },
  { value: 90, label: "90 Days" },
  { value: 120, label: "120 Days" },
];

export function FilterButton({ style }: FilterButtonProps) {
  const { timeRange, setTimeRange } = useTasks();
  const { gradients } = useGradients();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleTimeRangeSelect = (range: TimeRange) => {
    setTimeRange(range);
    setIsModalVisible(false);
  };

  const selectedOption = TIME_RANGE_OPTIONS.find(
    (option) => option.value === timeRange
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.filterButton, style]}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="filter" size={18} color="#666" />
        <Text style={styles.filterText}>
          {selectedOption?.label || "60 Days"}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time Range</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsContainer}>
              {TIME_RANGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    timeRange === option.value && styles.selectedOption,
                  ]}
                  onPress={() => handleTimeRangeSelect(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      timeRange === option.value && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {timeRange === option.value && (
                    <Ionicons name="checkmark" size={20} color="#4F46E5" />
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
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  filterText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
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
    borderBottomColor: "rgba(0, 0, 0, 0.06)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
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
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderWidth: 1.5,
    borderColor: "rgba(0, 0, 0, 0.08)",
    marginVertical: 2,
  },
  selectedOption: {
    backgroundColor: "rgba(79, 70, 229, 0.08)",
    borderColor: "#4F46E5",
    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionText: {
    fontSize: 17,
    color: "#374151",
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  selectedOptionText: {
    color: "#4F46E5",
    fontWeight: "700",
  },
});
