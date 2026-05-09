import { StyleSheet } from "react-native";
import { DesignSystem } from "../../../../theme/designSystem";

export const sheetChromeStyles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    minHeight: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    width: "100%",
    flexShrink: 1,
  },
  sheetGlassOuter: {
    width: "100%",
    borderTopLeftRadius: DesignSystem.borders.radius.glass,
    borderTopRightRadius: DesignSystem.borders.radius.glass,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
  },
  sheetGlassInner: {
    borderTopLeftRadius: DesignSystem.borders.radius.glass,
    borderTopRightRadius: DesignSystem.borders.radius.glass,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
  },
  gradientBackground: {
    paddingTop: DesignSystem.spacing.xs,
    paddingBottom: DesignSystem.spacing.md,
  },
  sheetSafeArea: {
    paddingHorizontal: DesignSystem.spacing.lg,
    maxHeight: "100%",
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  sheetTitleSideSpacer: {
    width: 40,
  },
  sheetTitlePressable: {
    flex: 1,
    minWidth: 0,
  },
  sheetCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    ...DesignSystem.typography.h2,
    fontWeight: "700",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  scrollSection: {
    minHeight: 0,
  },
});

export const createContentStyles = (
  colors: {
    glass: string;
    glassBorder: string;
    text: string;
    textSecondary: string;
  },
  isTablet: boolean
) =>
  StyleSheet.create({
    taskTitle: {
      ...DesignSystem.typography.h3,
      fontWeight: "700",
      letterSpacing: -0.2,
      marginBottom: DesignSystem.spacing.md,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: DesignSystem.spacing.sm,
      marginBottom: DesignSystem.spacing.lg,
    },
    categoryChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: DesignSystem.spacing.xs,
      paddingHorizontal: DesignSystem.spacing.sm,
      paddingVertical: DesignSystem.spacing.xs,
      borderRadius: DesignSystem.borders.radius.round,
      borderWidth: DesignSystem.borders.hairline,
    },
    categoryIconWrap: {
      width: isTablet ? 36 : 28,
      height: isTablet ? 36 : 28,
      borderRadius: isTablet ? 18 : 14,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryLabel: {
      ...DesignSystem.typography.smallSemiBold,
    },
    priorityPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: DesignSystem.spacing.sm,
      paddingVertical: DesignSystem.spacing.xs,
      borderRadius: DesignSystem.borders.radius.round,
      borderWidth: DesignSystem.borders.hairline,
      gap: DesignSystem.spacing.xs,
    },
    priorityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    priorityText: {
      ...DesignSystem.typography.smallSemiBold,
    },
    section: {
      marginBottom: DesignSystem.spacing.lg,
    },
    sectionTitle: {
      ...DesignSystem.typography.smallSemiBold,
      marginBottom: DesignSystem.spacing.sm,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    descriptionText: {
      ...DesignSystem.typography.body,
      lineHeight: 24,
    },
    detailCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: DesignSystem.spacing.md,
      borderRadius: DesignSystem.borders.radius.medium,
      marginBottom: DesignSystem.spacing.sm,
      borderWidth: DesignSystem.borders.hairline,
    },
    detailIconBox: {
      width: isTablet ? 44 : 40,
      height: isTablet ? 44 : 40,
      borderRadius: DesignSystem.borders.radius.medium,
      alignItems: "center",
      justifyContent: "center",
      marginRight: DesignSystem.spacing.md,
      borderWidth: DesignSystem.borders.hairline,
    },
    detailLabel: {
      ...DesignSystem.typography.small,
      marginBottom: 2,
    },
    detailValue: {
      ...DesignSystem.typography.bodySemiBold,
    },
    actionsRow: {
      flexDirection: "row",
      gap: DesignSystem.spacing.md,
      paddingTop: DesignSystem.spacing.md,
      marginTop: DesignSystem.spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    secondaryButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: DesignSystem.spacing.xs,
      paddingVertical: DesignSystem.spacing.md,
      borderRadius: DesignSystem.borders.radius.large,
      borderWidth: DesignSystem.borders.hairline,
      minHeight: DesignSystem.components.buttonLarge,
    },
    primaryButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: DesignSystem.spacing.xs,
      paddingVertical: DesignSystem.spacing.md,
      borderRadius: DesignSystem.borders.radius.large,
      minHeight: DesignSystem.components.buttonLarge,
      overflow: "hidden",
    },
    primaryButtonLabel: {
      ...DesignSystem.typography.bodySemiBold,
      color: "#FFFFFF",
    },
  });
