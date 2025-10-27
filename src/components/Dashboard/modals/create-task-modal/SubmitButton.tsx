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
  const { colors, isDark } = useTheme();
  const { primaryGradient } = useGradients();

  return (
    <View style={[styles.modalFooter, { backgroundColor: "transparent" }]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[
            isDark ? "rgba(32, 180, 134, 0.70)" : "rgba(46, 196, 182, 0.75)",
            isDark ? "rgba(58, 134, 255, 0.65)" : "rgba(58, 134, 255, 0.70)",
            isDark ? "rgba(255, 159, 28, 0.60)" : "rgba(255, 159, 28, 0.65)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.submitButton,
            {
              shadowColor: isDark
                ? "rgba(32, 180, 134, 0.25)"
                : "rgba(46, 196, 182, 0.30)",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 5,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(255, 255, 255, 0.2)",
              opacity: disabled ? 0.6 : 1,
            },
          ]}
        >
          <Text style={[styles.submitButtonText, { color: "white" }]}>
            {title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
