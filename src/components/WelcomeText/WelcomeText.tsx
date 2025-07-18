import React from "react";
import { View, Text } from "react-native";
import { styles } from "./styles";

// Function component for the welcome text section used in the home screen
export function WelcomeText() {
  return (
    <View style={styles.textContainer}>
      <Text style={styles.welcomeText}>
        Never miss home maintenance again. Get organized with smart reminders.
      </Text>
    </View>
  );
}
