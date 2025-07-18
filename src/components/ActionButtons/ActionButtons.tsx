import React from "react";
import { View, Text } from "react-native";
import { Button } from "react-native-paper";
import { useTheme } from "../../context/ThemeContext";
import { styles } from "./styles";

// Function component for the action buttons section used in the home screen
export function ActionButtons() {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.buttonContainer}>
      <Button
        mode="contained"
        buttonColor={colors.primary}
        textColor={isDark ? colors.text : "white"}
        contentStyle={styles.buttonContent}
        labelStyle={styles.primaryButtonText}
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={() => {
          // Handle create account action
        }}
      >
        Create Account
      </Button>

      <Button
        mode="outlined"
        buttonColor="transparent"
        textColor={colors.primary}
        contentStyle={styles.buttonContent}
        labelStyle={styles.secondaryButtonText}
        style={[
          styles.secondaryButton,
          {
            backgroundColor: isDark
              ? "transparent"
              : "rgba(255, 255, 255, 0.6)",
            borderColor: isDark
              ? "rgba(32, 180, 134, 0.4)"
              : "rgba(46, 196, 182, 0.15)",
          },
        ]}
        onPress={() => {
          // Handle sign in action
        }}
      >
        Sign In
      </Button>

      {/* Footer Text */}
      <Text style={[styles.footerText, { color: colors.textSecondary }]}>
        Free to try • No credit card required
      </Text>
    </View>
  );
}
