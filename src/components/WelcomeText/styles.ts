import { StyleSheet } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

// Styles for the welcome text section - Updated for modern 2025 design
export const styles = StyleSheet.create({
  textContainer: {
    paddingHorizontal: DesignSystem.spacing.md,
    alignItems: "center",
    alignSelf: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  headline: {
    ...DesignSystem.typography.h2, // Using design system typography
    textAlign: "center",
    marginBottom: DesignSystem.spacing.sm,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    ...DesignSystem.typography.bodyMedium, // Using design system typography
    textAlign: "center",
    opacity: 0.9,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
