import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Platform,
  type NativeSyntheticEvent,
  type TextInputSubmitEditingEventData,
} from "react-native";
import { useTheme } from "../../../../context/ThemeContext";
import { useDevice } from "../../../../hooks";
import { DesignSystem } from "../../../../theme/designSystem";
import { styles } from "./styles";

export interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  inputAccessoryViewID?: string;
  required?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  returnKeyType?: React.ComponentProps<typeof TextInput>["returnKeyType"];
  blurOnSubmit?: boolean;
  onSubmitEditing?: (
    e: NativeSyntheticEvent<TextInputSubmitEditingEventData>
  ) => void;
  onFocusExtra?: () => void;
}

export const FormField = React.forwardRef<TextInput, FormFieldProps>(
  function FormField(
    {
      label,
      value,
      onChangeText,
      placeholder,
      error,
      multiline = false,
      numberOfLines = 1,
      keyboardType = "default",
      inputAccessoryViewID,
      required = false,
      autoCapitalize = "none",
      returnKeyType,
      blurOnSubmit,
      onSubmitEditing,
      onFocusExtra,
    },
    ref
  ) {
    const { colors, isDark } = useTheme();
    const { isTablet, getFontMultiplier } = useDevice();
    const fontMultiplier = getFontMultiplier();

    return (
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          {label}{" "}
          {required && (
            <Text style={{ color: colors.error, fontWeight: "700" }}>*</Text>
          )}
        </Text>
        <View
          style={[
            styles.glassInputWrapper,
            {
              backgroundColor: colors.fieldFill,
              borderColor: error ? colors.error : colors.border,
              minHeight: multiline ? 100 : DesignSystem.components.inputLarge,
            },
          ]}
        >
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            style={[
              multiline ? styles.textArea : styles.textInput,
              { color: colors.text },
              isTablet && {
                fontSize:
                  DesignSystem.typography.body.fontSize * fontMultiplier,
              },
            ]}
            multiline={multiline}
            numberOfLines={numberOfLines}
            keyboardType={keyboardType}
            inputAccessoryViewID={inputAccessoryViewID}
            keyboardAppearance={isDark ? "dark" : "light"}
            autoCapitalize={autoCapitalize}
            returnKeyType={returnKeyType}
            blurOnSubmit={blurOnSubmit}
            onSubmitEditing={onSubmitEditing}
            onFocus={() => onFocusExtra?.()}
            accessibilityLabel={label}
          />
        </View>
        {error ? (
          <Text style={[styles.helperText, { color: colors.error }]}>
            {error}
          </Text>
        ) : null}
      </View>
    );
  }
);
