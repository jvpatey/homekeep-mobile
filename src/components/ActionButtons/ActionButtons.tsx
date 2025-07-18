import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "./styles";

// Function component for the action buttons section used in the home screen
export function ActionButtons() {
  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
        <Text style={styles.primaryButtonText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7}>
        <Text style={styles.secondaryButtonText}>Sign In</Text>
      </TouchableOpacity>

      {/* Footer Text */}
      <Text style={styles.footerText}>
        Free to try • No credit card required
      </Text>
    </View>
  );
}
