import { StyleSheet } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

export const homeSummaryPreviewStyles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: 0,
    flex: 1,
    minHeight: 0,
  },
  headerSubtitle: {
    ...DesignSystem.typography.small,
    marginBottom: DesignSystem.spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.xxxl,
  },
  docHeader: {
    alignItems: "flex-start",
    alignSelf: "stretch",
    marginBottom: DesignSystem.spacing.xl,
    paddingBottom: DesignSystem.spacing.lg,
    borderBottomWidth: 2,
  },
  brandRow: {
    marginBottom: DesignSystem.spacing.md,
    alignSelf: "flex-start",
  },
  docTitle: {
    ...DesignSystem.typography.h2,
    marginBottom: DesignSystem.spacing.xs,
    textAlign: "left",
    alignSelf: "stretch",
  },
  docMeta: {
    ...DesignSystem.typography.small,
    textAlign: "left",
    alignSelf: "stretch",
  },
  section: {
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.lg,
    borderWidth: 1,
    marginBottom: DesignSystem.spacing.lg,
  },
  sectionTitle: {
    ...DesignSystem.typography.h4,
    marginBottom: DesignSystem.spacing.xs,
  },
  sectionMeta: {
    ...DesignSystem.typography.caption,
    marginBottom: DesignSystem.spacing.sm,
  },
  addressLine: {
    ...DesignSystem.typography.body,
    marginBottom: 2,
  },
  emptyText: {
    ...DesignSystem.typography.body,
    fontStyle: "italic",
  },
  hintText: {
    ...DesignSystem.typography.small,
    marginTop: DesignSystem.spacing.sm,
  },
  equipmentRow: {
    paddingVertical: DesignSystem.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  equipmentName: {
    ...DesignSystem.typography.bodySemiBold,
  },
  equipmentDetail: {
    ...DesignSystem.typography.small,
    marginTop: 2,
  },
  equipmentAttachments: {
    ...DesignSystem.typography.caption,
    marginTop: 2,
  },
  taskRow: {
    paddingVertical: DesignSystem.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  taskTitle: {
    ...DesignSystem.typography.bodySemiBold,
  },
  taskMeta: {
    ...DesignSystem.typography.small,
    marginTop: 2,
  },
  taskNotes: {
    ...DesignSystem.typography.caption,
    marginTop: 4,
    fontStyle: "italic",
  },
  completionDate: {
    ...DesignSystem.typography.small,
    marginTop: 4,
  },
  disclaimer: {
    ...DesignSystem.typography.caption,
    marginTop: DesignSystem.spacing.md,
    lineHeight: 18,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
  },
  exportButtonText: {
    ...DesignSystem.typography.bodySemiBold,
    color: "#FFFFFF",
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: DesignSystem.spacing.xl,
  },
  loadingText: {
    ...DesignSystem.typography.body,
    marginTop: DesignSystem.spacing.md,
  },
  errorBanner: {
    marginHorizontal: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.sm,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.medium,
    borderWidth: 1,
  },
  errorText: {
    ...DesignSystem.typography.small,
    marginBottom: DesignSystem.spacing.sm,
  },
  retryButton: {
    alignSelf: "flex-start",
  },
  retryText: {
    ...DesignSystem.typography.bodySemiBold,
  },
});
