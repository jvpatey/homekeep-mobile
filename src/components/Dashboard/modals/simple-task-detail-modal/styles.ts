import { StyleSheet, Dimensions } from "react-native";
import { DesignSystem } from "../../../../theme/designSystem";

const { width: screenWidth } = Dimensions.get("window");

export const createStyles = (colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: DesignSystem.spacing.md,
      paddingVertical: DesignSystem.spacing.lg,
      zIndex: 9999,
    },
    modalContainer: {
      width: screenWidth - 40,
      height: "85%",
      borderRadius: DesignSystem.borders.radius.xlarge,
      overflow: "hidden",
      ...DesignSystem.shadows.glassStrong,
    },
    gradientBackground: {
      flex: 1,
      width: "100%",
      height: "100%",
      flexDirection: "column",
    },
    modalContentWrapper: {
      flex: 1,
    },
    headerGradient: {
      paddingTop: DesignSystem.spacing.xl,
      paddingBottom: DesignSystem.spacing.lg,
      paddingHorizontal: DesignSystem.spacing.lg,
      borderBottomWidth: DesignSystem.glass.borderWidth,
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
      alignItems: "center",
      justifyContent: "center",
      ...DesignSystem.shadows.small,
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
      ...DesignSystem.shadows.medium,
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
      ...DesignSystem.shadows.small,
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
      minHeight: 0,
    },
    contentContainer: {
      flexGrow: 1,
      paddingBottom: DesignSystem.spacing.lg,
    },
    section: {
      marginBottom: DesignSystem.spacing.xl,
    },
    sectionTitle: {
      ...DesignSystem.typography.h4,
      fontWeight: "600",
      marginBottom: DesignSystem.spacing.md,
    },
    descriptionText: {
      ...DesignSystem.typography.body,
      lineHeight: 24,
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
      backgroundColor: colors.glass,
      alignItems: "center",
      justifyContent: "center",
      marginRight: DesignSystem.spacing.md,
      borderWidth: DesignSystem.glass.borderWidth,
      borderColor: colors.glassBorder,
      ...DesignSystem.shadows.small,
    },
    detailContent: {
      flex: 1,
    },
    detailLabel: {
      ...DesignSystem.typography.smallMedium,
      marginBottom: 4,
    },
    detailValue: {
      ...DesignSystem.typography.bodySemiBold,
    },
    categoryDescription: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.textSecondary,
    },
    actionsContainer: {
      paddingHorizontal: DesignSystem.spacing.lg,
      paddingBottom: DesignSystem.spacing.lg,
      paddingTop: DesignSystem.spacing.md,
      borderTopWidth: DesignSystem.glass.borderWidth,
      backgroundColor: "transparent",
    },
    buttonRow: {
      flexDirection: "row",
      gap: DesignSystem.spacing.md,
      justifyContent: "center",
      alignItems: "center",
    },
    pillButton: {
      flex: 1,
      maxWidth: 180,
      borderRadius: DesignSystem.borders.radius.round,
      overflow: "hidden",
    },
    pillButtonGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: DesignSystem.spacing.sm,
      paddingHorizontal: DesignSystem.spacing.md,
      borderRadius: DesignSystem.borders.radius.round,
    },
    completeButtonDisabled: {
      opacity: 0.6,
    },
    pillButtonText: {
      ...DesignSystem.typography.buttonSmall,
      marginLeft: DesignSystem.spacing.xs,
      fontWeight: "600",
    },
  });
