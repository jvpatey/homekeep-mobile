import { StyleSheet } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

// Styles for OAuth buttons
export const styles = StyleSheet.create({
  container: {
    marginBottom: DesignSystem.spacing.lg,
    marginTop: DesignSystem.spacing.md,
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
  googleButton: {
    borderRadius: DesignSystem.borders.radius.large,
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
    flex: 1,
  },
  buttonLabel: {
    ...DesignSystem.typography.button,
    letterSpacing: 0.5,
    flex: 1,
    textAlign: "center",
  },
  googleIconContainer: {
    marginRight: DesignSystem.spacing.sm,
  },
  appleButton: {
    borderRadius: DesignSystem.borders.radius.large,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    minHeight: DesignSystem.components.buttonLarge,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
});
