import { StyleSheet, Dimensions } from "react-native";
import { DesignSystem } from "../../../../theme/designSystem";

const { width: screenWidth } = Dimensions.get("window");

export const createStyles = (colors: any) =>
  StyleSheet.create({
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
      backgroundColor: colors.surface,
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
      borderBottomWidth: 1,
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
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    categorySection: {
      alignItems: "center",
      marginBottom: DesignSystem.spacing.md,
    },
    categoryIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: DesignSystem.spacing.sm,
      borderWidth: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    categoryIcon: {
      // No margin needed since container handles spacing
    },
    categoryName: {
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    taskTitle: {
      fontSize: 24,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: DesignSystem.spacing.md,
      lineHeight: 30,
    },
    priorityContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: DesignSystem.spacing.md,
      paddingVertical: DesignSystem.spacing.sm,
      borderRadius: DesignSystem.borders.radius.medium,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
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
      color: colors.text,
      marginBottom: DesignSystem.spacing.md,
    },
    descriptionText: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.textSecondary,
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
      backgroundColor: colors.background,
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
      color: colors.textSecondary,
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    categoryDescription: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.textSecondary,
    },
    actionsContainer: {
      paddingHorizontal: DesignSystem.spacing.lg,
      paddingBottom: DesignSystem.spacing.lg,
      paddingTop: DesignSystem.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    actionSpacing: {
      marginBottom: DesignSystem.spacing.md,
    },
    completeButton: {
      borderRadius: DesignSystem.borders.radius.large,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: DesignSystem.spacing.lg,
      paddingHorizontal: DesignSystem.spacing.lg,
      width: "100%",
    },
    completeButtonDisabled: {
      opacity: 0.6,
    },
    completeButtonText: {
      fontSize: 18,
      fontWeight: "600",
      color: "white",
      marginLeft: DesignSystem.spacing.sm,
    },
  });
