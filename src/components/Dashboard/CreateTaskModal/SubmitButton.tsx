import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../context/ThemeContext";
import { useGradients } from "../../../hooks";
import { styles } from "../styles";

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
    <View style={styles.modalFooter}>
      <TouchableOpacity
        onPress={onPress}
        style={[styles.submitButton, { opacity: disabled ? 0.6 : 1 }]}
        disabled={disabled}
      >
        <LinearGradient
          colors={primaryGradient}
          style={styles.submitGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.submitButtonText}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
