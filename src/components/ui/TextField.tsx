import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { DesignSystem } from "../../theme/designSystem";

interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  error?: string;
  secureToggle?: boolean;
}

export function TextField({
  label,
  error,
  secureToggle = false,
  secureTextEntry,
  ...inputProps
}: TextFieldProps) {
  const { colors, isDark } = useTheme();
  const [showSecure, setShowSecure] = useState(false);
  const isSecure = secureToggle ? !showSecure : secureTextEntry;

  return (
    <View style={styles.container}>
      <Text
        style={[styles.label, { color: colors.textSecondary }]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {label}
      </Text>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.fieldFill,
            borderColor: error ? colors.error : "transparent",
          },
        ]}
      >
        <TextInput
          {...inputProps}
          secureTextEntry={isSecure}
          style={[styles.input, { color: colors.text }]}
          placeholderTextColor={colors.textSecondary}
          keyboardAppearance={isDark ? "dark" : "light"}
          accessibilityLabel={label}
        />
        {secureToggle && (
          <Pressable
            onPress={() => setShowSecure((v) => !v)}
            hitSlop={8}
            style={styles.toggle}
            accessibilityRole="button"
            accessibilityLabel={showSecure ? "Hide password" : "Show password"}
          >
            <Ionicons
              name={showSecure ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
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

const styles = StyleSheet.create({
  container: {
    marginBottom: DesignSystem.spacing.md,
  },
  label: {
    ...DesignSystem.typography.footnote,
    fontWeight: "500",
    marginBottom: DesignSystem.spacing.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: DesignSystem.components.inputLarge,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: 1.5,
    paddingHorizontal: DesignSystem.spacing.md,
  },
  input: {
    flex: 1,
    ...DesignSystem.typography.body,
    paddingVertical: DesignSystem.spacing.sm,
  },
  toggle: {
    padding: DesignSystem.spacing.xs,
    minWidth: DesignSystem.components.minTouchTarget,
    minHeight: DesignSystem.components.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    ...DesignSystem.typography.caption,
    marginTop: DesignSystem.spacing.xs,
  },
});
