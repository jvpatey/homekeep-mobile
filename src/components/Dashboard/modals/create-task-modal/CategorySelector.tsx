import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import { DesignSystem } from "../../../../theme/designSystem";
import { MaintenanceCategory } from "../../../../types/maintenance";

// Category interface
interface Category {
  id: MaintenanceCategory;
  name: string;
  icon: string;
  color: string;
}

// CategorySelectorProps
interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: MaintenanceCategory;
  onSelectCategory: (categoryId: MaintenanceCategory) => void;
  error?: string;
}

// CategorySelector component for the CreateTaskModal
export function CategorySelector({
  categories,
  selectedCategory,
  onSelectCategory,
  error,
}: CategorySelectorProps) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const selectedCategoryData = categories.find(
    (c) => c.id === selectedCategory
  );

  return (
    <View style={categoryStyles.container}>
      <Text style={[categoryStyles.label, { color: colors.text }]}>
        Category <Text style={categoryStyles.required}>*</Text>
      </Text>

      <TouchableOpacity
        style={[
          categoryStyles.dropdownButton,
          {
            backgroundColor: colors.glass,
            borderColor: error ? colors.error : colors.glassBorder,
          },
        ]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View style={categoryStyles.dropdownContent}>
          {selectedCategoryData && (
            <>
              <Ionicons
                name={selectedCategoryData.icon as any}
                size={20}
                color={selectedCategoryData.color}
              />
              <Text
                style={[
                  categoryStyles.dropdownText,
                  { color: colors.text, marginLeft: 8 },
                ]}
              >
                {selectedCategoryData.name === "HVAC"
                  ? "HVAC"
                  : selectedCategoryData.name}
              </Text>
            </>
          )}
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
            categoryStyles.dropdownList,
            {
              backgroundColor: colors.surface,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                categoryStyles.dropdownItem,
                {
                  backgroundColor:
                    selectedCategory === category.id
                      ? colors.glass
                      : "transparent",
                },
              ]}
              onPress={() => {
                onSelectCategory(category.id);
                setIsOpen(false);
              }}
            >
              <Ionicons
                name={category.icon as any}
                size={18}
                color={category.color}
              />
              <Text
                style={[
                  categoryStyles.dropdownItemText,
                  {
                    color:
                      selectedCategory === category.id
                        ? category.color
                        : colors.text,
                    fontWeight:
                      selectedCategory === category.id ? "700" : "400",
                  },
                  { marginLeft: 8 },
                ]}
              >
                {category.name === "HVAC" ? "HVAC" : category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error && (
        <Text style={[categoryStyles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const categoryStyles = StyleSheet.create({
  container: {
    marginBottom: DesignSystem.spacing.md,
  },
  label: {
    ...DesignSystem.typography.bodyMedium,
    fontWeight: "600",
    marginBottom: DesignSystem.spacing.sm,
  },
  required: {
    color: "#EF4444",
    fontWeight: "700",
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
  errorText: {
    ...DesignSystem.typography.caption,
    marginTop: DesignSystem.spacing.xs,
  },
});
