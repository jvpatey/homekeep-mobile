import React from "react";
import { View, Text } from "react-native";
import { TextInput, HelperText } from "react-native-paper";
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

  const getInputTheme = () => ({
    colors: {
      primary: colors.primary,
      outline: error ? colors.error : colors.border,
      surface: colors.surface,
      background: colors.surface,
      onSurface: colors.text,
      onSurfaceVariant: colors.textSecondary,
    },
  });

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
          {
            backgroundColor: colors.surface,
            paddingHorizontal: 16,
            paddingVertical: 12,
          },
        ]}
        textColor={colors.text}
        placeholderTextColor={colors.textSecondary}
        mode="flat"
        error={!!error}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        theme={getInputTheme()}
        dense={false}
        outlineStyle={{ borderRadius: 8 }}
      />
      {error && (
        <HelperText type="error" visible={!!error} style={styles.helperText}>
          {error}
        </HelperText>
      )}
    </View>
  );
}
