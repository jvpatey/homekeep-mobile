import React from "react";
import { View, Text } from "react-native";
import { TextInput } from "react-native-paper";
import { useTheme } from "../../../../context/ThemeContext";
import { styles } from "./styles";

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  required?: boolean;
}

// FormField component for the CreateTaskModal
export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  numberOfLines = 1,
  keyboardType = "default",
  required = false,
}: FormFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={[
          multiline ? styles.textArea : styles.textInput,
          { backgroundColor: colors.surface },
        ]}
        textColor={colors.text}
        placeholderTextColor={colors.textSecondary}
        mode="flat"
        error={!!error}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
      />
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}
