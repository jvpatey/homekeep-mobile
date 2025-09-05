import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../../context/ThemeContext";
import { useGradients } from "../../../../hooks";
import { DesignSystem } from "../../../../theme/designSystem";
import { styles } from "./styles";

// SubmitButtonProps interface
interface SubmitButtonProps {
  onPress: () => void;
  disabled: boolean;
  title: string;
}

// SubmitButton component for the CreateTaskModal
export function SubmitButton({ onPress, disabled, title }: SubmitButtonProps) {
  const { colors } = useTheme();
  const { primaryGradient } = useGradients();

  return (
    <View
      style={[
        styles.modalFooter,
        { backgroundColor: colors.surface, borderTopColor: colors.border },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.submitButton,
          {
            backgroundColor: colors.primary,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 6,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={[styles.submitButtonText, { color: "white" }]}>
          {title}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
