import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";
import { colors } from "../../../theme/colors";

// styles for the features section
export const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingTop: 0,
    paddingBottom: DesignSystem.spacing.xl,
  },
  featuresContainer: {
    flexDirection: "column",
    marginBottom: DesignSystem.spacing.xxl,
    gap: DesignSystem.spacing.md,
  },
  featureItem: {
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.md,
    minHeight: 72,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  featureContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.md,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    ...DesignSystem.typography.h4,
    marginBottom: DesignSystem.spacing.xs,
  },
  featureSubtitle: {
    ...DesignSystem.typography.body,
    fontSize: 15,
    opacity: 0.85,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  modalTitle: {
    ...DesignSystem.typography.h3,
    textAlign: "center",
    fontWeight: "700",
  },
  modalDescription: {
    ...DesignSystem.typography.bodyMedium,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: DesignSystem.spacing.xl,
  },
  closeButton: {
    width: "100%",
    borderRadius: DesignSystem.borders.radius.large,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    ...DesignSystem.typography.button,
    fontWeight: "600",
  },
});
