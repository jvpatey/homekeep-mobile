import React from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../context/ThemeContext";
import { useHaptics } from "../../../hooks";
import {
  GRADIENT_PRESETS,
  GradientPreset,
} from "../../../context/UserPreferencesContext";
import { styles } from "./styles";

interface GradientPickerProps {
  selectedId: string;
  onSelect: (gradient: GradientPreset) => void;
}

export function GradientPicker({ selectedId, onSelect }: GradientPickerProps) {
  const { colors } = useTheme();
  const { triggerLight } = useHaptics();
  const gradients = Object.values(GRADIENT_PRESETS);

  return (
    <View style={styles.grid}>
      {gradients.map((gradient) => {
        const isSelected = selectedId === gradient.id;
        return (
          <Pressable
            key={gradient.id}
            onPress={() => {
              void triggerLight();
              onSelect(gradient);
            }}
            style={styles.option}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={gradient.name}
          >
            <View
              style={[
                styles.ring,
                {
                  borderColor: isSelected ? colors.primary : "transparent",
                },
              ]}
            >
              <LinearGradient
                colors={gradient.colors}
                style={styles.swatch}
                start={gradient.start}
                end={gradient.end}
              />
            </View>
            <Text
              style={[
                styles.caption,
                {
                  color: isSelected ? colors.primary : colors.textSecondary,
                  fontWeight: isSelected ? "600" : "500",
                },
              ]}
              numberOfLines={1}
            >
              {gradient.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
