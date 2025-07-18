import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { styles } from "./styles";

// Function component for the action buttons section used in the home screen
export function ActionButtons() {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.secondaryButton,
          {
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(255, 255, 255, 0.6)",
            borderColor: isDark
              ? "rgba(32, 180, 134, 0.2)"
              : "rgba(46, 196, 182, 0.15)",
          },
        ]}
        activeOpacity={0.7}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
          Sign In
        </Text>
      </TouchableOpacity>

      {/* Footer Text */}
      <Text style={[styles.footerText, { color: colors.textSecondary }]}>
        Free to try • No credit card required
      </Text>
    </View>
  );
}
