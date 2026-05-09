import { StyleSheet } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

export const completionHistoryStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: DesignSystem.spacing.sm,
    marginLeft: -DesignSystem.spacing.sm,
    zIndex: 1,
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: DesignSystem.spacing.sm,
  },
  headerTitle: {
    ...DesignSystem.typography.h3,
    textAlign: "center",
  },
  headerSubtitle: {
    ...DesignSystem.typography.small,
    textAlign: "center",
    marginTop: DesignSystem.spacing.xs,
  },
  headerRightSpacer: {
    width: 40,
    zIndex: 1,
  },
  routinesList: {
    flexGrow: 1,
    padding: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.xxxl,
  },
  routineItem: {
    borderRadius: DesignSystem.borders.radius.large,
    padding: DesignSystem.spacing.md,
    borderWidth: 1,
    marginBottom: DesignSystem.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  routineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  routineHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  routineHeaderRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  routineTitle: {
    ...DesignSystem.typography.bodySemiBold,
    fontSize: 18,
    lineHeight: 24,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borders.radius.small,
    borderWidth: 1,
  },
  categoryText: {
    ...DesignSystem.typography.captionSemiBold,
    fontSize: 12,
    fontWeight: "600",
  },
  routineSummary: {
    marginBottom: DesignSystem.spacing.md,
  },
  routineSummaryStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: DesignSystem.spacing.md,
  },
  routineSummaryStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
  },
  routineSummaryText: {
    ...DesignSystem.typography.caption,
    fontSize: 12,
  },
  lastCompletion: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.xs,
  },
  lastCompletionText: {
    ...DesignSystem.typography.caption,
    fontSize: 12,
    flex: 1,
  },
  instanceDetails: {
    borderTopWidth: 1,
    paddingTop: DesignSystem.spacing.md,
  },
  instanceTitle: {
    ...DesignSystem.typography.bodySemiBold,
    marginBottom: DesignSystem.spacing.sm,
    fontSize: 14,
  },
  instanceItem: {
    paddingVertical: DesignSystem.spacing.sm,
    borderBottomWidth: 1,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borders.radius.small,
    marginTop: DesignSystem.spacing.sm,
    gap: DesignSystem.spacing.xs,
  },
  completeButtonText: {
    ...DesignSystem.typography.captionSemiBold,
    fontSize: 12,
    fontWeight: "600",
  },
  instanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  instanceDate: {
    ...DesignSystem.typography.caption,
    fontSize: 12,
    flex: 1,
  },
  instancePriority: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
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
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.xxxl,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  emptyStateTitle: {
    ...DesignSystem.typography.h2,
    marginTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    ...DesignSystem.typography.body,
    textAlign: "center",
    opacity: 0.85,
  },
});
