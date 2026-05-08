import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

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
  // 2026: iOS grouped list inside one glass surface
  groupedCard: {
    width: "100%",
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: DesignSystem.spacing.lg,
    minHeight: 68,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: DesignSystem.borders.hairline,
    marginRight: DesignSystem.spacing.md,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 21,
    letterSpacing: -0.22,
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 19,
    letterSpacing: -0.12,
    opacity: 0.9,
  },
  rowChevron: {
    marginLeft: DesignSystem.spacing.sm,
    opacity: 0.6,
  },
  divider: {
    height: DesignSystem.borders.hairline,
    marginLeft: DesignSystem.spacing.lg + 36 + DesignSystem.spacing.md, // align under text (after icon)
    marginRight: DesignSystem.spacing.lg,
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  modalContent: {
    // iOS 26 sheets have generous internal safe padding so content never
    // kisses the glass edge.
    paddingTop: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.xl,
  },
  modalGrabber: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    opacity: 0.55,
    marginBottom: DesignSystem.spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: DesignSystem.borders.hairline,
  },
  modalHeaderText: {
    flex: 1,
    minWidth: 0,
    marginLeft: DesignSystem.spacing.md,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 23,
    letterSpacing: -0.28,
  },
  modalSubtitle: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 19,
    letterSpacing: -0.12,
    opacity: 0.85,
  },
  modalDescription: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 23,
    letterSpacing: -0.12,
    textAlign: "left",
    marginBottom: DesignSystem.spacing.xl,
  },
  modalCloseIconHit: {
    position: "absolute",
    top: DesignSystem.spacing.md,
    right: DesignSystem.spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
});
