import { StyleSheet } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

export const completionHistoryStyles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.sm,
    flexGrow: 1,
  },
  listHeader: {
    marginBottom: DesignSystem.spacing.md,
  },
  segmented: {
    marginBottom: DesignSystem.spacing.md,
  },
  chipLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: DesignSystem.spacing.xs + 2,
  },
  chip: {
    maxWidth: 180,
  },
  subtitle: {
    ...DesignSystem.typography.footnote,
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
    marginTop: DesignSystem.spacing.lg - DesignSystem.spacing.sm,
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
  loadingState: {
    flexGrow: 1,
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
    justifyContent: "center",
    paddingVertical: DesignSystem.spacing.xxxl,
  },
});
