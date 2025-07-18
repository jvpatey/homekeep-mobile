import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { styles } from "./styles";
import { ActionButtons } from "../ActionButtons/ActionButtons";

// Function component for the feature card section used in the home screen
export function FeatureCard() {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.cardContainer}>
      <View
        style={[
          styles.liquidGlassCard,
          {
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(255, 255, 255, 0.12)",
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.15)"
              : "rgba(255, 255, 255, 0.2)",
          },
        ]}
      >
        {/* Feature Highlights */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View
              style={[
                styles.featureIcon,
                {
                  backgroundColor: isDark
                    ? "rgba(32, 180, 134, 0.12)"
                    : "rgba(46, 196, 182, 0.08)",
                },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.accent}
              />
            </View>
            <Text style={[styles.featureText, { color: colors.text }]}>
              Smart Scheduling
            </Text>
          </View>

          <View style={styles.featureItem}>
            <View
              style={[
                styles.featureIcon,
                {
                  backgroundColor: isDark
                    ? "rgba(32, 180, 134, 0.12)"
                    : "rgba(46, 196, 182, 0.08)",
                },
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={colors.accent}
              />
            </View>
            <Text style={[styles.featureText, { color: colors.text }]}>
              Timely Reminders
            </Text>
          </View>

          <View style={styles.featureItem}>
            <View
              style={[
                styles.featureIcon,
                {
                  backgroundColor: isDark
                    ? "rgba(32, 180, 134, 0.12)"
                    : "rgba(46, 196, 182, 0.08)",
                },
              ]}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={20}
                color={colors.accent}
              />
            </View>
            <Text style={[styles.featureText, { color: colors.text }]}>
              Easy Tracking
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <ActionButtons />
      </View>
    </View>
  );
}
