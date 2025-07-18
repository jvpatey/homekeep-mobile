import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { styles } from "./styles";
import { ActionButtons } from "../ActionButtons/ActionButtons";

export function FeatureCard() {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.liquidGlassCard}>
        {/* Feature Highlights */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.light.accent}
              />
            </View>
            <Text style={styles.featureText}>Smart Scheduling</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={colors.light.accent}
              />
            </View>
            <Text style={styles.featureText}>Timely Reminders</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons
                name="phone-portrait-outline"
                size={20}
                color={colors.light.accent}
              />
            </View>
            <Text style={styles.featureText}>Easy Tracking</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <ActionButtons />
      </View>
    </View>
  );
}
