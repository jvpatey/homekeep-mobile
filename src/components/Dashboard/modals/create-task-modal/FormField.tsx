import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Platform,
  type NativeSyntheticEvent,
  type TextInputSubmitEditingEventData,
  type LayoutChangeEvent,
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
  autoCorrect?: boolean;
  spellCheck?: boolean;
  textContentType?: React.ComponentProps<typeof TextInput>["textContentType"];
  returnKeyType?: React.ComponentProps<typeof TextInput>["returnKeyType"];
  blurOnSubmit?: boolean;
  enablesReturnKeyAutomatically?: boolean;
  onSubmitEditing?: (
    e: NativeSyntheticEvent<TextInputSubmitEditingEventData>
  ) => void;
  onFocusExtra?: () => void;
  onBlurExtra?: () => void;
  onFieldLayout?: (y: number) => void;
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
      autoCorrect,
      spellCheck,
      textContentType,
      returnKeyType,
      blurOnSubmit,
      enablesReturnKeyAutomatically,
      onSubmitEditing,
      onFocusExtra,
      onBlurExtra,
      onFieldLayout,
    },
    ref
  ) {
    const { colors, isDark } = useTheme();
    const { isTablet, getFontMultiplier } = useDevice();
    const fontMultiplier = getFontMultiplier();
    const [focused, setFocused] = useState(false);

    const handleLayout = (event: LayoutChangeEvent) => {
      onFieldLayout?.(event.nativeEvent.layout.y);
    };

    return (
      <View style={styles.inputGroup} onLayout={handleLayout}>
        <Text
          style={[styles.inputLabel, { color: colors.textSecondary }]}
          accessibilityRole="text"
        >
          {label}{" "}
          {required ? (
            <Text style={{ color: colors.error, fontWeight: "700" }}>*</Text>
          ) : null}
        </Text>
        <View
          style={[
            styles.glassInputWrapper,
            {
              backgroundColor: colors.fieldFill,
              borderColor: error
                ? colors.error
                : focused
                  ? colors.primary + "66"
                  : colors.border,
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
            autoCorrect={autoCorrect}
            spellCheck={spellCheck}
            textContentType={textContentType}
            returnKeyType={returnKeyType}
            blurOnSubmit={blurOnSubmit}
            enablesReturnKeyAutomatically={enablesReturnKeyAutomatically}
            onSubmitEditing={onSubmitEditing}
            onFocus={() => {
              setFocused(true);
              onFocusExtra?.();
            }}
            onBlur={() => {
              setFocused(false);
              onBlurExtra?.();
            }}
            accessibilityLabel={label}
            accessibilityHint={error}
          />
        </View>
        {error ? (
          <Text
            style={[styles.helperText, { color: colors.error }]}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            {error}
          </Text>
        ) : null}
      </View>
    );
  }
);
