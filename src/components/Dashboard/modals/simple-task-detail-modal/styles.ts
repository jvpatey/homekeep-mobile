import { StyleSheet, Dimensions } from "react-native";
import { DesignSystem } from "../../../../theme/designSystem";
import { colors } from "../../../../theme/colors";

const { width: screenWidth } = Dimensions.get("window");

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.lg,
    zIndex: 9999,
  },
  modalContainer: {
    width: screenWidth - 40,
    height: "85%",
    backgroundColor: colors.light.surface,
    borderRadius: DesignSystem.borders.radius.large,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  headerGradient: {
    paddingTop: DesignSystem.spacing.xl,
    paddingBottom: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  headerContent: {
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: DesignSystem.spacing.md,
    right: DesignSystem.spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  categorySection: {
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  categoryIcon: {
    marginBottom: DesignSystem.spacing.xs,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    letterSpacing: 0.5,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    marginBottom: DesignSystem.spacing.md,
    lineHeight: 30,
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borders.radius.medium,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: DesignSystem.spacing.xs,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  content: {
    flex: 1,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.lg,
    minHeight: 0,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  section: {
    marginBottom: DesignSystem.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.light.text,
    marginBottom: DesignSystem.spacing.md,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.light.textSecondary,
  },
  detailsGrid: {
    marginBottom: DesignSystem.spacing.xl,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  detailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: DesignSystem.spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.light.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.text,
  },
  categoryDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.light.textSecondary,
  },
  actionsContainer: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    backgroundColor: colors.light.surface,
  },
  completeButton: {
    borderRadius: DesignSystem.borders.radius.medium,
    overflow: "hidden",
    ...DesignSystem.shadows.medium,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginLeft: DesignSystem.spacing.sm,
  },
});
