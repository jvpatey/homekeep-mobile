import React from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

const HomeScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar style="auto" />

      {/* Logo Section */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/homekeep-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Welcome Text Section */}
      <View style={styles.textContainer}>
        <Text style={styles.welcomeText}>
          Never miss home maintenance again. Get organized with smart reminders.
        </Text>
      </View>

      {/* Apple Liquid Glass Card */}
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
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Text */}
          <Text style={styles.footerText}>
            Free to try • No credit card required
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  logoContainer: {
    marginTop: 80, // Reduced from 100
    marginBottom: 40, // Reduced from 56
    alignItems: "center",
  },
  logo: {
    width: 240, // Bigger logo
    height: 120, // Bigger logo
    resizeMode: "contain",
  },
  textContainer: {
    paddingHorizontal: 32,
    alignItems: "center",
    maxWidth: 320,
    alignSelf: "center",
    marginBottom: 40, // Reduced from 48 to match logo spacing
  },
  welcomeText: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: "center",
    color: colors.light.text,
    fontWeight: "400",
  },
  cardContainer: {
    paddingHorizontal: 24,
    marginBottom: 40, // Reduced to match other spacing
  },
  liquidGlassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.12)", // Higher transparency for liquid glass
    borderRadius: 20, // Apple's preferred radius
    padding: 32,
    // Subtle shadow with very low opacity
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 2, // Reduced elevation for subtlety
    borderWidth: 0.5, // Thinner border
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  featuresContainer: {
    marginBottom: 40, // Apple's 8px grid: 5 * 8 = 40
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24, // Apple's 8px grid: 3 * 8 = 24
  },
  featureIcon: {
    width: 40, // Slightly smaller for refinement
    height: 40,
    borderRadius: 10, // Apple's preferred radius
    backgroundColor: "rgba(46, 196, 182, 0.08)", // More subtle background
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.light.text,
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24, // Apple's 8px grid: 3 * 8 = 24
  },
  primaryButton: {
    backgroundColor: colors.light.primary,
    borderRadius: 14, // Apple's preferred radius
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    // Very subtle shadow
    shadowColor: colors.light.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 17, // Apple's preferred font size
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.6)", // More transparent
    borderRadius: 14, // Apple's preferred radius
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    borderWidth: 0.5, // Thinner border
    borderColor: "rgba(46, 196, 182, 0.15)", // More subtle
  },
  secondaryButtonText: {
    color: colors.light.primary,
    fontSize: 17, // Apple's preferred font size
    fontWeight: "600",
  },
  footerText: {
    fontSize: 13, // Apple's preferred small text size
    color: colors.light.textSecondary,
    textAlign: "center",
    fontWeight: "400",
  },
});

export default HomeScreen;
