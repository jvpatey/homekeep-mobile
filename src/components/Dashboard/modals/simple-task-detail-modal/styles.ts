import { StyleSheet, Dimensions } from "react-native";
import { DesignSystem } from "../../../../theme/designSystem";

const { width: screenWidth } = Dimensions.get("window");

export const createStyles = (colors: any, isTablet: boolean = false) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: isTablet ? DesignSystem.spacing.xl : DesignSystem.spacing.md,
      paddingVertical: isTablet ? DesignSystem.spacing.xl : DesignSystem.spacing.lg,
      zIndex: 9999,
    },
    modalContainer: {
      width: isTablet ? Math.min(screenWidth - 80, 600) : screenWidth - 40,
      height: isTablet ? "75%" : "85%",
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
      paddingTop: isTablet ? DesignSystem.spacing.xxl : DesignSystem.spacing.xl,
      paddingBottom: isTablet ? DesignSystem.spacing.xl : DesignSystem.spacing.lg,
      paddingHorizontal: isTablet ? DesignSystem.spacing.xxl : DesignSystem.spacing.lg,
      borderBottomWidth: DesignSystem.glass.borderWidth,
    },
    headerContent: {
      alignItems: "center",
    },
    closeButton: {
      position: "absolute",
      top: isTablet ? DesignSystem.spacing.lg : DesignSystem.spacing.md,
      right: isTablet ? DesignSystem.spacing.lg : DesignSystem.spacing.md,
      width: isTablet ? 50 : 40,
      height: isTablet ? 50 : 40,
      alignItems: "center",
      justifyContent: "center",
      ...DesignSystem.shadows.small,
    },
    categorySection: {
      alignItems: "center",
      marginBottom: isTablet ? DesignSystem.spacing.lg : DesignSystem.spacing.md,
    },
    categoryIconContainer: {
      width: isTablet ? 80 : 64,
      height: isTablet ? 80 : 64,
      borderRadius: isTablet ? 40 : 32,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: isTablet ? DesignSystem.spacing.md : DesignSystem.spacing.sm,
      ...DesignSystem.shadows.medium,
    },
    categoryIcon: {
      // No margin needed since container handles spacing
    },
    categoryName: {
      fontSize: isTablet ? 20 : 16,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    taskTitle: {
      fontSize: isTablet ? 32 : 24,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: isTablet ? DesignSystem.spacing.lg : DesignSystem.spacing.md,
      lineHeight: isTablet ? 40 : 30,
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
      marginBottom: isTablet ? DesignSystem.spacing.xl : DesignSystem.spacing.lg,
    },
    detailIconContainer: {
      width: isTablet ? 60 : 48,
      height: isTablet ? 60 : 48,
      borderRadius: isTablet ? 30 : 24,
      backgroundColor: colors.glass,
      alignItems: "center",
      justifyContent: "center",
      marginRight: isTablet ? DesignSystem.spacing.lg : DesignSystem.spacing.md,
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
      paddingHorizontal: isTablet ? DesignSystem.spacing.xxl : DesignSystem.spacing.lg,
      paddingBottom: isTablet ? DesignSystem.spacing.xl : DesignSystem.spacing.lg,
      paddingTop: isTablet ? DesignSystem.spacing.lg : DesignSystem.spacing.md,
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
      maxWidth: isTablet ? 250 : 180,
      borderRadius: DesignSystem.borders.radius.round,
      overflow: "hidden",
    },
    pillButtonGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: isTablet ? DesignSystem.spacing.md : DesignSystem.spacing.sm,
      paddingHorizontal: isTablet ? DesignSystem.spacing.lg : DesignSystem.spacing.md,
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
