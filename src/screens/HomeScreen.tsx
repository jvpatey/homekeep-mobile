import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Image } from "react-native";
import { colors } from "../theme/colors";

const HomeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 60, // Safe area for status bar
  },
  logoContainer: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 100,
    resizeMode: "contain",
  },
  textContainer: {
    paddingHorizontal: 32,
    alignItems: "center",
    maxWidth: 320,
  },
  welcomeText: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: "center",
    color: colors.light.text,
    marginBottom: 16,
    fontWeight: "400",
  },
  callToAction: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    color: colors.light.primary,
    lineHeight: 28,
  },
});

export default HomeScreen;
