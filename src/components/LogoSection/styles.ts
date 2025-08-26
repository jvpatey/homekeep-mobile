import { StyleSheet } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

// Styles for the logo section - Updated for modern 2025 design
export const styles = StyleSheet.create({
  logoContainer: {
    marginTop: 0,
    marginBottom: DesignSystem.spacing.sm, // Reduced from lg to sm
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.md,
    backgroundColor: "transparent", // Remove white background
  },
  logoContainerCompact: {
    marginTop: 0,
    marginBottom: DesignSystem.spacing.sm,
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.md,
    backgroundColor: "transparent", // Remove white background
  },
  logo: {
    width: 380, // Increased from 200
    height: 190, // Increased from 100
    resizeMode: "contain",
    shadowColor: "rgba(255, 255, 255, 0.5)", // Increased opacity for stronger glow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0, // Full opacity for maximum glow effect
    shadowRadius: 30, // Increased radius for larger, more prominent glow
    elevation: 12, // Increased Android shadow
  },
  logoCompact: {
    width: 140,
    height: 70,
    resizeMode: "contain",
    shadowColor: "rgba(255, 255, 255, 0.5)", // Increased opacity for stronger glow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0, // Full opacity for maximum glow effect
    shadowRadius: 30, // Increased radius for larger, more prominent glow
    elevation: 12, // Increased Android shadow
  },
  logoText: {
    ...DesignSystem.typography.h1, // Using design system typography
    textAlign: "center",
    marginTop: DesignSystem.spacing.sm, // Reduced from md to sm for tighter grouping
    fontFamily: "System",
    fontWeight: "700", // Slightly lighter than 800 for elegance
    letterSpacing: -0.5, // Tighter letter spacing for sophistication
    textShadowColor: "rgba(0, 0, 0, 0.15)", // Softer shadow
    textShadowOffset: { width: 0, height: 2 }, // Better shadow positioning
    textShadowRadius: 4, // Softer, more refined shadow
    fontSize: 42, // Increased from 36 to 42 for more prominence
    lineHeight: 48, // Adjusted line height for the new font size
  },
});
