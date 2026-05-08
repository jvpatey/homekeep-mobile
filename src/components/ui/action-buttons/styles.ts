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
    position: "relative",
    overflow: "hidden",
    borderRadius: DesignSystem.borders.radius.large,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    borderWidth: 1,
    // Layered single-color shadow (key only; no rainbow halo).
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },
  primaryButtonHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "45%",
  },
  primaryButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 17,
    letterSpacing: -0.22,
    lineHeight: 21,
  },
  emailLink: {
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  emailLinkText: {
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: -0.12,
    textAlign: "center",
  },
});
