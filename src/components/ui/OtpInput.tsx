import React, { useRef, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Text,
  Platform,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";

const CODE_LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onComplete?: (code: string) => void;
}

export function OtpInput({ value, onChange, error, onComplete }: OtpInputProps) {
  const { colors, isDark } = useTheme();
  const hiddenRef = useRef<TextInput>(null);
  const digits = value.padEnd(CODE_LENGTH, " ").split("").slice(0, CODE_LENGTH);

  useEffect(() => {
    if (value.length === CODE_LENGTH) {
      onComplete?.(value);
    }
  }, [value, onComplete]);

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH);
    onChange(cleaned);
  };

  return (
    <View style={styles.container}>
      <TextInput
        ref={hiddenRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
        maxLength={CODE_LENGTH}
        style={styles.hiddenInput}
        caretHidden
        autoFocus
        keyboardAppearance={isDark ? "dark" : "light"}
        accessibilityLabel="Verification code"
      />

      <View style={styles.boxRow}>
        {digits.map((digit, index) => {
          const isFocused = value.length === index;
          const hasValue = digit.trim() !== "";

          return (
            <Pressable
              key={index}
              onPress={() => hiddenRef.current?.focus()}
              style={[
                styles.box,
                {
                  backgroundColor: colors.fieldFill,
                  borderColor: error
                    ? colors.error
                    : isFocused
                      ? colors.primary
                      : hasValue
                        ? colors.border
                        : "transparent",
                },
              ]}
              accessibilityRole="none"
              accessibilityLabel={`Digit ${index + 1} of ${CODE_LENGTH}`}
            >
              <Text style={[styles.digit, { color: colors.text }]}>
                {hasValue ? digit : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!!error && (
        <Text
          style={[styles.error, { color: colors.error }]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const BOX_SIZE = 48;

const styles = StyleSheet.create({
  container: {
    marginBottom: DesignSystem.spacing.md,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    height: 1,
    width: 1,
  },
  boxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: DesignSystem.spacing.sm,
  },
  box: {
    flex: 1,
    maxWidth: BOX_SIZE,
    height: BOX_SIZE + 8,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  digit: {
    ...DesignSystem.typography.title2,
    fontFamily: DesignSystem.fonts.ui,
    fontSize: 22,
    lineHeight: 28,
  },
  error: {
    ...DesignSystem.typography.caption,
    marginTop: DesignSystem.spacing.sm,
    textAlign: "center",
  },
});
