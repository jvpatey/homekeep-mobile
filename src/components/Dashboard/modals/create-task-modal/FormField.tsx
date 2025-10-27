import React, { useState } from "react";
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
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
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
  autoCapitalize = "none",
}: FormFieldProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

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
      <View
        style={[
          styles.glassInputWrapper,
          {
            backgroundColor: colors.glass,
            borderColor: error
              ? colors.error
              : isFocused
              ? colors.primary + "40"
              : "rgba(0, 0, 0, 0.1)",
          },
          isFocused && !error && styles.focusGlow,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          style={multiline ? styles.textArea : styles.textInput}
          textColor={colors.text}
          placeholderTextColor={colors.textSecondary}
          mode="flat"
          error={!!error}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          theme={getInputTheme()}
          dense={false}
          underlineColor="transparent"
          underlineColorAndroid="transparent"
          activeUnderlineColor="transparent"
          outlineStyle={{ borderRadius: 0, borderWidth: 0 }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
      {error && (
        <HelperText type="error" visible={!!error} style={styles.helperText}>
          {error}
        </HelperText>
      )}
    </View>
  );
}
