import { StyleSheet, Dimensions } from "react-native";
import { DesignSystem } from "../../../theme/designSystem";

const { height: screenHeight } = Dimensions.get("window");

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(26, 22, 18, 0.45)",
    justifyContent: "flex-end",
  },

  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },

  sheetContainer: {
    width: "100%",
    height: screenHeight * 0.92,
  },

  sheetSurface: {
    flex: 1,
    borderTopLeftRadius: DesignSystem.borders.radius.xlarge + 4,
    borderTopRightRadius: DesignSystem.borders.radius.xlarge + 4,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  atmosphereFill: {
    ...StyleSheet.absoluteFillObject,
  },

  sheetSafeArea: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md,
  },

  titleBlock: {
    flex: 1,
    minWidth: 0,
  },

  sheetTitle: {
    ...DesignSystem.typography.title2,
  },

  sheetSubtitle: {
    ...DesignSystem.typography.footnote,
    marginTop: DesignSystem.spacing.xs,
    lineHeight: 18,
  },

  formNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.sm,
  },

  navButton: {
    minWidth: DesignSystem.components.minTouchTarget,
    minHeight: DesignSystem.components.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: -DesignSystem.spacing.sm,
  },

  formTitleBlock: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
  },

  formTitle: {
    ...DesignSystem.typography.title2,
  },

  formSubtitle: {
    ...DesignSystem.typography.footnote,
    marginTop: DesignSystem.spacing.xs,
    lineHeight: 18,
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.xs,
    flexGrow: 1,
    paddingBottom: DesignSystem.spacing.md,
  },

  listFooter: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  equipmentCard: {
    marginBottom: DesignSystem.spacing.md,
  },

  equipmentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md,
  },

  equipmentIconBadge: {
    width: 44,
    height: 44,
    borderRadius: DesignSystem.borders.radius.medium,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  equipmentMain: {
    flex: 1,
    minWidth: 0,
  },

  equipmentMainTouchable: {
    flex: 1,
    minWidth: 0,
  },

  equipmentTitle: {
    ...DesignSystem.typography.callout,
    fontWeight: "600",
    marginBottom: DesignSystem.spacing.xs,
  },

  equipmentMeta: {
    ...DesignSystem.typography.caption,
    marginBottom: 2,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.xs,
    marginTop: DesignSystem.spacing.sm,
  },

  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 4,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },

  statusChipText: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
    fontSize: 11,
  },

  equipmentRowActions: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: DesignSystem.spacing.xs,
    paddingTop: 2,
  },

  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },

  deletingButton: {
    opacity: 0.5,
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xxxl,
    width: "100%",
  },

  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.lg,
  },

  emptyTitle: {
    ...DesignSystem.typography.h3,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.sm,
  },

  emptySubtext: {
    ...DesignSystem.typography.footnote,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
    alignSelf: "center",
  },

  emptyAction: {
    marginTop: DesignSystem.spacing.xl,
    width: "100%",
    maxWidth: 280,
    alignSelf: "center",
  },

  formScroll: {
    flex: 1,
  },

  formScrollContent: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.xs,
  },

  formFooter: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  sectionLabel: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
    marginBottom: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.lg,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  attachCard: {
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: DesignSystem.spacing.xs,
  },

  attachTitle: {
    ...DesignSystem.typography.callout,
    fontWeight: "600",
  },

  attachHint: {
    ...DesignSystem.typography.caption,
    marginTop: DesignSystem.spacing.xs,
    lineHeight: 18,
  },

  rowButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.md,
  },

  attachButton: {
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },

  attachButtonText: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
  },

  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: DesignSystem.spacing.sm,
  },

  dateButtonText: {
    ...DesignSystem.typography.body,
    flex: 1,
  },
});
