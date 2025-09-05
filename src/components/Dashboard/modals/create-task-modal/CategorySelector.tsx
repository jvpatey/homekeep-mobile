import React from "react";
import { View, Text } from "react-native";
import { Chip } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import { styles } from "./styles";
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

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>
        Category <Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.chipContainer}>
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <Chip
              key={category.id}
              selected={isSelected}
              onPress={() => onSelectCategory(category.id)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isSelected 
                    ? category.color + "15" 
                    : colors.surface,
                  borderColor: isSelected 
                    ? category.color 
                    : colors.border,
                  transform: [{ scale: isSelected ? 1.02 : 1 }],
                },
              ]}
              textStyle={[
                styles.chipText,
                {
                  color: isSelected 
                    ? category.color 
                    : colors.textSecondary,
                  fontWeight: isSelected ? "700" : "600",
                },
              ]}
              icon={() => (
                <Ionicons
                  name={category.icon as any}
                  size={18}
                  color={
                    isSelected
                      ? category.color
                      : colors.textSecondary
                  }
                />
              )}
            >
              {category.name === "HVAC" ? "HVAC" : category.name}
            </Chip>
          );
        })}
      </View>
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}
