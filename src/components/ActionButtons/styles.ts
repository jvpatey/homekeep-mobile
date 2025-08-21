import { StyleSheet } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

// Styles for action buttons - Updated for modern 2025 design
export const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: "center",
    gap: DesignSystem.spacing.md,
  },
  primaryButton: {
    width: "100%",
    borderRadius: DesignSystem.borders.radius.large,
    overflow: "hidden",
    ...DesignSystem.shadows.medium,
  },
  gradientButton: {
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: DesignSystem.components.buttonLarge,
  },
  primaryButtonText: {
    ...DesignSystem.typography.button,
    color: "white",
    textAlign: "center",
  },
  secondaryButtonContainer: {
    width: "100%",
    borderRadius: DesignSystem.borders.radius.large,
    overflow: "hidden",
    ...DesignSystem.shadows.small,
  },
  gradientBorder: {
    padding: 2, // Border width
    borderRadius: DesignSystem.borders.radius.large,
  },
  secondaryButtonInner: {
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: DesignSystem.components.buttonMedium,
    borderRadius: DesignSystem.borders.radius.large - 2, // Account for border
  },
  secondaryButtonText: {
    ...DesignSystem.typography.button,
    textAlign: "center",
  },
  footerText: {
    ...DesignSystem.typography.caption,
    textAlign: "center",
    marginTop: DesignSystem.spacing.md,
    opacity: 0.7,
  },
});
