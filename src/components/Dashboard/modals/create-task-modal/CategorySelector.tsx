import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import { useDevice } from "../../../../hooks";
import { DesignSystem } from "../../../../theme/designSystem";
import { MaintenanceCategory } from "../../../../types/maintenance";
import { formControlFill } from "./formChrome";
import { styles as sharedStyles } from "./styles";

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
  /** Increment from parent to close dropdown (backdrop / tap-outside). */
  dismissChromeToken?: number;
}

// CategorySelector component for the CreateTaskModal
export function CategorySelector({
  categories,
  selectedCategory,
  onSelectCategory,
  error,
  dismissChromeToken = 0,
}: CategorySelectorProps) {
  const { colors, isDark } = useTheme();
  const { isTablet, getFontMultiplier, getResponsiveValue } = useDevice();
  const [isOpen, setIsOpen] = useState(false);
  const fontMultiplier = getFontMultiplier();

  useEffect(() => {
    setIsOpen(false);
  }, [dismissChromeToken]);

  const selectedCategoryData = categories.find(
    (c) => c.id === selectedCategory
  );

  return (
    <View style={categoryStyles.container}>
      <Text style={[
        categoryStyles.label, 
        { color: colors.text },
        isTablet && {
          fontSize: ((categoryStyles.label.fontSize || DesignSystem.typography.bodyMedium.fontSize) * fontMultiplier),
        },
      ]}>
        Category <Text style={categoryStyles.required}>*</Text>
      </Text>

      <TouchableOpacity
        style={[
          categoryStyles.dropdownButton,
          {
            backgroundColor: formControlFill(isDark),
            borderColor: error ? colors.error : colors.glassStroke,
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
                size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
                color={selectedCategoryData.color}
              />
              <Text
                style={[
                  categoryStyles.dropdownText,
                  { color: colors.text, marginLeft: 8 },
                  isTablet && {
                    fontSize: ((categoryStyles.dropdownText.fontSize || DesignSystem.typography.body.fontSize) * fontMultiplier),
                  },
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
          size={isTablet ? getResponsiveValue(20, 24, 26) : 20}
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
                      ? "rgba(46, 196, 182, 0.1)"
                      : "transparent",
                },
                selectedCategory === category.id && [
                  sharedStyles.selectedItemGlow,
                  sharedStyles.selectedItemGlowAlt,
                  sharedStyles.selectedItemGlowAccent,
                ],
              ]}
              onPress={() => {
                onSelectCategory(category.id);
                setIsOpen(false);
              }}
            >
              <Ionicons
                name={category.icon as any}
                size={isTablet ? getResponsiveValue(18, 22, 24) : 18}
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
                  isTablet && {
                    fontSize: ((categoryStyles.dropdownItemText.fontSize || DesignSystem.typography.body.fontSize) * fontMultiplier),
                  },
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
