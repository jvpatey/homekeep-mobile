import { StyleSheet } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

// Styles for OAuth buttons - Updated for modern 2025 design
export const styles = StyleSheet.create({
  container: {
    marginBottom: DesignSystem.spacing.lg,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  dividerText: {
    ...DesignSystem.typography.small,
    marginHorizontal: DesignSystem.spacing.md,
    opacity: 0.7,
  },
  gradientButton: {
    borderRadius: DesignSystem.borders.radius.large,
    overflow: "hidden",
    ...DesignSystem.shadows.medium,
  },
  googleButton: {
    paddingVertical: DesignSystem.spacing.md,
    height: DesignSystem.components.buttonLarge,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: {
    ...DesignSystem.typography.button,
    letterSpacing: 0.5,
  },
  googleIconContainer: {
    marginRight: DesignSystem.spacing.sm,
  },
});
