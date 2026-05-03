import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

// styles for the action buttons
export const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: "stretch",
    gap: DesignSystem.spacing.md,
    paddingBottom: 0,
    marginBottom: 0,
  },
  primaryButton: {
    borderRadius: DesignSystem.borders.radius.large,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  primaryButtonText: {
    ...DesignSystem.typography.button,
    color: "white",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: -0.3,
  },
  emailLink: {
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  emailLinkText: {
    ...DesignSystem.typography.body,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
});
