import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

// styles for the action buttons
export const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: "center",
    gap: DesignSystem.spacing.lg,
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
    padding: 2,
    borderRadius: DesignSystem.borders.radius.large,
  },
  secondaryButtonInner: {
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: DesignSystem.components.buttonMedium,
    borderRadius: DesignSystem.borders.radius.large - 2,
  },
  secondaryButtonText: {
    ...DesignSystem.typography.button,
    textAlign: "center",
  },
});
