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
  },
  logoCompact: {
    width: 140,
    height: 70,
    resizeMode: "contain",
  },
  logoText: {
    ...DesignSystem.typography.h1, // Using design system typography
    textAlign: "center",
    marginTop: DesignSystem.spacing.md,
    fontFamily: "System",
    fontWeight: "600", // Reduced from 800 to make it less bold
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
