import React, { useState } from "react";
import {
  View,
  Text,
  TextInput as RNTextInput,
  Platform,
  type NativeSyntheticEvent,
  type TextInputSubmitEditingEventData,
} from "react-native";
import { TextInput, HelperText } from "react-native-paper";
import { useTheme } from "../../../../context/ThemeContext";
import { useAuthInputTheme, useDevice } from "../../../../hooks";
import { DesignSystem } from "../../../../theme/designSystem";
import { styles } from "./styles";
import { formControlFill } from "./formChrome";

export interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  /** iOS: shows accessory above keyboard (e.g. Done for number pads). */
  inputAccessoryViewID?: string;
  required?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  returnKeyType?: React.ComponentProps<typeof TextInput>["returnKeyType"];
  blurOnSubmit?: boolean;
  onSubmitEditing?: (
    e: NativeSyntheticEvent<TextInputSubmitEditingEventData>,
  ) => void;
  /** Extra handler after focus (e.g. scroll parent ScrollView on iOS keyboard). */
  onFocusExtra?: () => void;
}

// FormField component for the CreateTaskModal
export const FormField = React.forwardRef<RNTextInput, FormFieldProps>(
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
    ref,
  ) {
    const { colors, isDark } = useTheme();
    const { getInputTheme } = useAuthInputTheme();
    const { isTablet, getFontMultiplier } = useDevice();
    const [isFocused, setIsFocused] = useState(false);
    const fontMultiplier = getFontMultiplier();

    const inputTheme = getInputTheme(!!error);

    return (
      <View style={styles.inputGroup}>
        <Text
          style={[
            styles.inputLabel,
            { color: colors.text },
            isTablet && {
              fontSize:
                (styles.inputLabel.fontSize ||
                  DesignSystem.typography.bodyMedium.fontSize) * fontMultiplier,
            },
          ]}
        >
          {label}{" "}
          {required && (
            <Text style={{ color: colors.error, fontWeight: "700" }}>*</Text>
          )}
        </Text>
        <View
          style={[
            styles.glassInputWrapper,
            {
              backgroundColor: formControlFill(isDark),
              borderColor: error
                ? colors.error
                : isFocused
                  ? `${colors.primary}99`
                  : colors.glassStroke,
            },
            isFocused && !error && styles.focusGlow,
          ]}
        >
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            style={[
              multiline ? styles.textArea : styles.textInput,
              isTablet && {
                fontSize:
                  (styles.textInput.fontSize ||
                    DesignSystem.typography.body.fontSize) * fontMultiplier,
                paddingVertical:
                  DesignSystem.spacing.md * (1 + (fontMultiplier - 1) * 0.3),
              },
            ]}
            textColor={colors.text}
            placeholderTextColor={colors.textSecondary}
            cursorColor={colors.primary}
            selectionColor={
              Platform.OS === "ios"
                ? `${colors.primary}55`
                : `${colors.primary}99`
            }
            mode="flat"
            error={!!error}
            multiline={multiline}
            numberOfLines={numberOfLines}
            keyboardType={keyboardType}
            inputAccessoryViewID={inputAccessoryViewID}
            keyboardAppearance={isDark ? "dark" : "light"}
            autoCapitalize={autoCapitalize}
            returnKeyType={returnKeyType}
            blurOnSubmit={blurOnSubmit}
            onSubmitEditing={onSubmitEditing}
            theme={inputTheme}
            dense={false}
            underlineColor="transparent"
            underlineColorAndroid="transparent"
            activeUnderlineColor="transparent"
            outlineStyle={{ borderRadius: 0, borderWidth: 0 }}
            onFocus={() => {
              setIsFocused(true);
              onFocusExtra?.();
            }}
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
  },
);
