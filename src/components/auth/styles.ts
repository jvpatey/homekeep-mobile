import { StyleSheet } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

// Styles for OAuth buttons
export const styles = StyleSheet.create({
  container: {
    marginBottom: DesignSystem.spacing.md,
    marginTop: 0,
  },
  orText: {
    ...DesignSystem.typography.body,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.md,
    marginHorizontal: DesignSystem.spacing.md,
    fontWeight: "500",
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
    paddingHorizontal: DesignSystem.spacing.xl,
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
});
