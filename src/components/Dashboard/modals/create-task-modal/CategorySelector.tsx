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
        {categories.map((category) => (
          <Chip
            key={category.id}
            selected={selectedCategory === category.id}
            onPress={() => onSelectCategory(category.id)}
            style={[
              styles.categoryChip,
              {
                backgroundColor:
                  selectedCategory === category.id
                    ? category.color + "20"
                    : colors.surface,
                borderWidth: 1,
                borderColor:
                  selectedCategory === category.id
                    ? category.color + "40"
                    : colors.border,
              },
            ]}
            textStyle={[
              styles.chipText,
              {
                color:
                  selectedCategory === category.id
                    ? category.color
                    : colors.textSecondary,
              },
            ]}
            icon={() => (
              <Ionicons
                name={category.icon as any}
                size={16}
                color={
                  selectedCategory === category.id
                    ? category.color
                    : colors.textSecondary
                }
              />
            )}
          >
            {category.name}
          </Chip>
        ))}
      </View>
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}
