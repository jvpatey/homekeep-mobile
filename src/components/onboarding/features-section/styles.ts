import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";
import { colors } from "../../../theme/colors";

// styles for the features section
export const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.xl,
  },
  featuresContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.md,
  },
  featureTouchable: {
    flex: 1,
  },
  featureItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.lg,
    ...DesignSystem.shadows.medium,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
    backgroundColor: colors.light.surface + "20",
  },
  featureText: {
    ...DesignSystem.typography.captionMedium,
    textAlign: "center",
    color: colors.light.text,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "600",
  },
  // modalOverlay function to animate the modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: DesignSystem.borders.radius.xlarge,
    padding: DesignSystem.spacing.xl,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    ...DesignSystem.shadows.large,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  modalIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
    backgroundColor: colors.light.surface + "20",
  },
  modalTitle: {
    ...DesignSystem.typography.h3,
    textAlign: "center",
    fontWeight: "700",
    color: "#333",
  },
  modalDescription: {
    ...DesignSystem.typography.bodyMedium,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: DesignSystem.spacing.xl,
    color: colors.light.textSecondary,
  },
  closeButton: {
    width: "100%",
    borderRadius: DesignSystem.borders.radius.large,
    overflow: "hidden",
  },
  closeButtonGradient: {
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    ...DesignSystem.typography.button,
    color: "white",
    fontWeight: "600",
  },
});
