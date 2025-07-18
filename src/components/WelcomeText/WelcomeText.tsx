import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { styles } from "./styles";

// Function component for the welcome text section used in the home screen
export function WelcomeText() {
  const { colors } = useTheme();

  return (
    <View style={styles.textContainer}>
      <Text style={[styles.welcomeText, { color: colors.text }]}>
        Never miss home maintenance again. Get organized with smart reminders.
      </Text>
    </View>
  );
}
