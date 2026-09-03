import { StyleSheet } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

export const completionHistoryStyles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: 0,
    flex: 1,
    minHeight: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: DesignSystem.spacing.lg,
    flexGrow: 1,
  },
  listHeader: {
    marginBottom: DesignSystem.spacing.md,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
  },
  chip: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borders.radius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    ...DesignSystem.typography.captionSemiBold,
  },
  subtitle: {
    ...DesignSystem.typography.footnote,
    marginBottom: DesignSystem.spacing.sm,
  },
  truncationNote: {
    ...DesignSystem.typography.caption,
    marginBottom: DesignSystem.spacing.sm,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendText: {
    ...DesignSystem.typography.caption,
    fontSize: 11,
  },
  sectionHeader: {
    ...DesignSystem.typography.footnote,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.md,
  },
  cardContainer: {
    marginBottom: DesignSystem.spacing.sm,
  },
  cardSurface: {
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    ...DesignSystem.typography.bodyMedium,
    marginBottom: 2,
  },
  rowMeta: {
    ...DesignSystem.typography.caption,
  },
  rowBy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: DesignSystem.spacing.xs,
  },
  rowByName: {
    ...DesignSystem.typography.caption,
    fontWeight: "600",
  },
  rowNotes: {
    ...DesignSystem.typography.caption,
    lineHeight: 18,
    marginTop: DesignSystem.spacing.xs,
  },
  rowError: {
    ...DesignSystem.typography.caption,
    marginTop: DesignSystem.spacing.xs,
  },
  undoButton: {
    paddingVertical: DesignSystem.spacing.xs,
    paddingLeft: DesignSystem.spacing.sm,
  },
  undoText: {
    ...DesignSystem.typography.smallSemiBold,
  },
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: DesignSystem.spacing.xxxl,
    gap: DesignSystem.spacing.md,
  },
  loadingText: {
    ...DesignSystem.typography.body,
  },
  emptyState: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.xxxl,
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
  },
});
